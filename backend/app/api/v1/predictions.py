from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionRead, WhatIfRequest, WhatIfResponse
from app.services.predictor import compute_prediction, compute_whatif
from app.services.recommender import generate_recommendations

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/{budget_id}/compute", response_model=dict)
async def compute_budget_prediction(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calcule la prédiction complète pour un budget."""
    # Vérifier accès budget
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")

    # Récupérer les transactions
    tx_result = await db.execute(
        select(Transaction).where(Transaction.budget_id == budget_id)
    )
    transactions = tx_result.scalars().all()

    if not transactions:
        raise HTTPException(status_code=400, detail="Aucune transaction pour ce budget")

    # Calculer les totaux par catégorie
    category_totals = {}
    for tx in transactions:
        cat = tx.category.value
        category_totals[cat] = category_totals.get(cat, 0) + tx.amount

    total_spent = sum(category_totals.values())

    # Jours écoulés dans le mois
    today = date.today()
    days_elapsed = today.day

    # Calcul de la prédiction
    prediction_data = compute_prediction(
        budget_amount=budget.total_amount,
        total_spent=total_spent,
        category_totals=category_totals,
        days_elapsed=days_elapsed,
    )

    # Sauvegarder la prédiction
    overdraft_dt = None
    if prediction_data.get("overdraft_date"):
        overdraft_dt = date.fromisoformat(prediction_data["overdraft_date"])

    prediction = Prediction(
        budget_id=budget_id,
        overdraft_date=overdraft_dt,
        days_until_overdraft=prediction_data.get("days_until_overdraft"),
        daily_spending_rate=prediction_data["daily_spending_rate"],
        projected_end_balance=prediction_data["projected_end_balance"],
        risk_score=prediction_data["risk_score"],
        risk_categories=prediction_data["risk_categories"],
        projection_data=prediction_data["projection_data"],
    )
    db.add(prediction)
    await db.flush()

    # Générer les recommandations IA
    recommendations = await generate_recommendations(
        risk_categories=prediction_data["risk_categories"],
        category_totals=category_totals,
        budget_amount=budget.total_amount,
        city=current_user.city or "Paris",
        days_until_overdraft=prediction_data.get("days_until_overdraft"),
    )

    return {
        "prediction": prediction_data,
        "category_totals": category_totals,
        "recommendations": recommendations,
    }


@router.post("/whatif", response_model=dict)
async def simulate_whatif(
    request: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Simule l'impact de réductions sur les dépenses."""
    result = await db.execute(
        select(Budget).where(Budget.id == request.budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")

    tx_result = await db.execute(
        select(Transaction).where(Transaction.budget_id == request.budget_id)
    )
    transactions = tx_result.scalars().all()
    category_totals = {}
    for tx in transactions:
        cat = tx.category.value
        category_totals[cat] = category_totals.get(cat, 0) + tx.amount

    total_spent = sum(category_totals.values())
    days_elapsed = date.today().day

    original = compute_prediction(budget.total_amount, total_spent, category_totals, days_elapsed)
    simulated = compute_whatif(original, budget.total_amount, total_spent, category_totals, days_elapsed, request.reductions)

    return {"original": original, **simulated}
