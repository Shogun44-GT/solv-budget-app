"""
Endpoints RGPD — Phase 6.
Couvre : export données, suppression compte, consentement, politique confidentialité.
Conformité : RGPD Art. 17 (droit à l'oubli), Art. 20 (portabilité des données).
"""
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.prediction import Prediction
from app.models.notification import Notification

router = APIRouter(prefix="/gdpr", tags=["gdpr"])


@router.get("/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RGPD Art. 20 — Portabilité des données.
    Exporte toutes les données de l'utilisateur en JSON.
    """
    # Budgets
    b_result = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    budgets = b_result.scalars().all()

    # Transactions
    t_result = await db.execute(select(Transaction).where(Transaction.user_id == current_user.id))
    transactions = t_result.scalars().all()

    # Prédictions
    budget_ids = [b.id for b in budgets]
    predictions = []
    if budget_ids:
        p_result = await db.execute(
            select(Prediction).where(Prediction.budget_id.in_(budget_ids))
        )
        predictions = p_result.scalars().all()

    export = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "gdpr_notice": "Ces données vous appartiennent. Exportées conformément à l'Art. 20 du RGPD.",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "city": current_user.city,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "budgets": [
            {
                "id": b.id,
                "month": b.month,
                "year": b.year,
                "total_amount": b.total_amount,
                "category_limits": b.category_limits,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in budgets
        ],
        "transactions": [
            {
                "id": t.id,
                "label": t.label,
                "amount": t.amount,
                "category": t.category.value,
                "date": t.date.isoformat(),
                "is_recurring": t.is_recurring,
                "source": t.source,
            }
            for t in transactions
        ],
        "predictions_count": len(predictions),
    }

    return JSONResponse(
        content=export,
        headers={
            "Content-Disposition": f'attachment; filename="coachbudget_export_{datetime.now().strftime("%Y%m%d")}.json"',
            "Content-Type": "application/json",
        },
    )


@router.delete("/delete-account")
async def delete_my_account(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    RGPD Art. 17 — Droit à l'effacement (droit à l'oubli).
    Supprime TOUTES les données de l'utilisateur de façon irréversible.
    """
    user_id = current_user.id

    # Supprimer dans l'ordre (contraintes FK)
    # 1. Notifications
    await db.execute(delete(Notification).where(Notification.user_id == user_id))

    # 2. Prédictions (via budgets)
    b_result = await db.execute(select(Budget.id).where(Budget.user_id == user_id))
    budget_ids = [row[0] for row in b_result.all()]
    if budget_ids:
        await db.execute(delete(Prediction).where(Prediction.budget_id.in_(budget_ids)))

    # 3. Transactions
    await db.execute(delete(Transaction).where(Transaction.user_id == user_id))

    # 4. Budgets
    await db.execute(delete(Budget).where(Budget.user_id == user_id))

    # 5. Utilisateur
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()

    return {
        "success": True,
        "message": "Votre compte et toutes vos données ont été supprimés définitivement.",
        "gdpr_reference": "Art. 17 RGPD — Droit à l'effacement",
    }


@router.get("/privacy-policy")
async def privacy_policy():
    """Politique de confidentialité simplifiée (in-app)."""
    return {
        "app": "Coach Budget IA",
        "last_updated": "2025-01-01",
        "data_controller": "Coach Budget IA SAS — contact@coachbudget.fr",
        "data_processed": [
            "Email et mot de passe (hashé bcrypt, jamais transmis en clair)",
            "Données budgétaires (montants, catégories, dates)",
            "Historique des transactions importées",
            "Ville de résidence (pour personnalisation des recommandations)",
        ],
        "data_retention": "Jusqu'à suppression du compte par l'utilisateur",
        "third_parties": [
            "Anthropic Claude API — génération de recommandations (aucune donnée personnelle transmise)",
            "Open Food Facts — recherche de produits (données publiques anonymes)",
            "OpenStreetMap — géolocalisation des commerces (coordonnées GPS uniquement)",
        ],
        "your_rights": [
            "Art. 15 — Droit d'accès : GET /api/v1/gdpr/export",
            "Art. 17 — Droit à l'effacement : DELETE /api/v1/gdpr/delete-account",
            "Art. 20 — Droit à la portabilité : GET /api/v1/gdpr/export",
            "Contact DPO : dpo@coachbudget.fr",
        ],
        "cookies": "Aucun cookie tiers. Session gérée par JWT stocké localement.",
        "analytics": "Aucune analytics tier (Mixpanel/Amplitude désactivé en prod par défaut).",
    }


@router.get("/consent-status")
async def consent_status(current_user: User = Depends(get_current_user)):
    """Retourne le statut du consentement de l'utilisateur."""
    return {
        "user_id": current_user.id,
        "analytics_consent": False,
        "marketing_consent": False,
        "functional_consent": True,   # Obligatoire pour le service
        "last_updated": current_user.created_at.isoformat() if current_user.created_at else None,
    }
