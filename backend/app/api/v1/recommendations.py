from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.notification import Notification, NotificationUrgency
from app.services.knowledge_base import get_alternatives_for_profile, get_meal_prep_recipes, ALTERNATIVES_BY_CATEGORY
from app.services.recommender import generate_recommendations, generate_notification_message, _detect_profile, client
from app.services.predictor import compute_prediction, get_risk_level
from app.core.config import settings

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/alternatives")
async def get_alternatives(
    categories: str = Query(description="Catégories séparées par virgule, ex: resto,transport"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Alternatives de la base de connaissances, personnalisées par ville et profil."""
    cat_list = [c.strip() for c in categories.split(",") if c.strip()]
    
    # Récupérer le dernier budget pour déduire le profil
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc())
    )
    budget = result.scalars().first()
    budget_amount = budget.total_amount if budget else 1200.0

    profile = _detect_profile(current_user.city or "Paris", budget_amount)
    alternatives = get_alternatives_for_profile(cat_list, current_user.city or "Paris", profile)

    total_saving = sum(
        max(a["saving_euros"] for a in alts) if alts else 0
        for alts in alternatives.values()
    )

    return {
        "categories": alternatives,
        "profile": profile,
        "total_potential_saving": total_saving,
    }


@router.get("/meal-prep")
async def get_meal_prep(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recettes meal-prep économiques adaptées au profil."""
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc())
    )
    budget = result.scalars().first()
    budget_amount = budget.total_amount if budget else 1200.0
    profile = _detect_profile(current_user.city or "Paris", budget_amount)

    recipes = get_meal_prep_recipes(profile, max_recipes=7)
    return {"recipes": recipes, "profile": profile}


@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Notifications intelligentes non lues pour l'utilisateur."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    notifications = result.scalars().all()
    return {"notifications": [
        {
            "id": n.id, "title": n.title, "body": n.body,
            "urgency": n.urgency.value, "action": n.action,
            "is_read": n.is_read, "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]}


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marque une notification comme lue."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.flush()
    return {"success": True}


class DailyPhraseRequest(BaseModel):
    budget_amount: float
    total_spent: float
    daily_rate: float
    days_elapsed: int
    top_category: str
    top_amount: float
    city: str = "Paris"

@router.post("/daily-phrase")
async def get_daily_phrase(
    req: DailyPhraseRequest,
    current_user: User = Depends(get_current_user),
):
    projected_end = (req.budget_amount - req.total_spent) - req.daily_rate * (30 - req.days_elapsed)
    pct_spent = (req.total_spent / req.budget_amount) * 100 if req.budget_amount > 0 else 0
    expected_pct = (req.days_elapsed / 30) * 100
    is_ahead = pct_spent < expected_pct

    prompt = f"""Tu es Solv, un coach budget bienveillant et direct.
L'utilisateur est à {req.city}.
Budget : {req.budget_amount}€. Dépensé : {req.total_spent:.0f}€ ({pct_spent:.0f}%).
Jour {req.days_elapsed}/30. Rythme : {req.daily_rate:.0f}€/jour.
Solde projeté fin de mois : {projected_end:.0f}€.
Poste principal : {req.top_category} ({req.top_amount:.0f}€).
En avance sur budget : {is_ahead}.

Écris UNE phrase personnalisée de 15-25 mots maximum.
Ton : direct, bienveillant, légèrement motivant.
Si en avance : félicite avec un chiffre précis.
Si en retard : alerte concrète avec la date de découvert.
Pas de majuscule au début, pas de point à la fin.
Réponds uniquement avec la phrase, rien d'autre."""

    message = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    return {"phrase": message.content[0].text.strip()}


class ChatRequest(BaseModel):
    message: str
    budget_context: dict = {}

@router.post("/chat")
async def chat_with_solv(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch user's real budget and transactions from DB
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc())
    )
    budget = budget_result.scalars().first()

    budget_amount = budget.total_amount if budget else 0
    total_spent = 0.0
    category_summary = ""

    if budget:
        tx_result = await db.execute(
            select(Transaction).where(Transaction.budget_id == budget.id)
        )
        transactions = tx_result.scalars().all()
        total_spent = sum(tx.amount for tx in transactions)

        cat_totals: dict = {}
        for tx in transactions:
            cat = tx.category.value if hasattr(tx.category, "value") else str(tx.category)
            cat_totals[cat] = cat_totals.get(cat, 0) + tx.amount

        if cat_totals:
            top3 = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:3]
            category_summary = ", ".join(f"{c}: {a:.0f}€" for c, a in top3)

    city = current_user.city or "Paris"
    balance = budget_amount - total_spent

    system = f"""Tu es Solv, un assistant budget personnel bienveillant et expert.
Utilisateur à {city}. Budget : {budget_amount:.0f}€. Dépensé : {total_spent:.0f}€. Solde restant : {balance:.0f}€.
{"Top dépenses : " + category_summary if category_summary else "Aucune transaction ce mois."}
Réponds en 2-3 phrases max, en français, de façon directe et actionnable. Pas de markdown."""

    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=200,
        system=system,
        messages=[{"role": "user", "content": req.message}]
    )
    return {"response": response.content[0].text}


@router.post("/trigger-check/{budget_id}")
async def trigger_smart_notification(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyse le budget et crée une notification intelligente si nécessaire.
    Appelé périodiquement (cron) ou manuellement.
    Seuils : budget dépassé à 80%, découvert < 10 jours, tendance dégradée 3 jours.
    """
    from datetime import date

    # Récupérer budget + transactions
    b_result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = b_result.scalar_one_or_none()
    if not budget:
        return {"created": False, "reason": "Budget non trouvé"}

    t_result = await db.execute(
        select(Transaction).where(Transaction.budget_id == budget_id)
    )
    transactions = t_result.scalars().all()
    if not transactions:
        return {"created": False, "reason": "Pas de transactions"}

    category_totals: dict = {}
    for tx in transactions:
        cat = tx.category.value
        category_totals[cat] = category_totals.get(cat, 0) + tx.amount

    total_spent = sum(category_totals.values())
    days_elapsed = date.today().day

    prediction = compute_prediction(budget.total_amount, total_spent, category_totals, days_elapsed)
    risk_score = prediction["risk_score"]
    days_until = prediction.get("days_until_overdraft")
    pct_spent = (total_spent / budget.total_amount) * 100 if budget.total_amount > 0 else 0

    # ── Seuils de déclenchement ──────────────────────────────
    should_notify = (
        (days_until is not None and days_until <= 10) or  # Découvert imminent
        pct_spent >= 80 or                                 # 80% du budget atteint
        risk_score >= 65                                   # Risque élevé
    )

    if not should_notify:
        return {"created": False, "reason": "Aucun seuil atteint", "risk_score": risk_score}

    top_cat = max(category_totals, key=category_totals.get)
    top_amount = category_totals[top_cat]

    notif_data = await generate_notification_message(
        risk_score, days_until, top_cat, top_amount, budget.total_amount
    )

    urgency_map = {
        "critical": NotificationUrgency.CRITICAL,
        "warning":  NotificationUrgency.WARNING,
        "info":     NotificationUrgency.INFO,
    }

    notification = Notification(
        user_id=current_user.id,
        title=notif_data["title"],
        body=notif_data["body"],
        urgency=urgency_map.get(notif_data["urgency"], NotificationUrgency.INFO),
        action=notif_data.get("action"),
    )
    db.add(notification)
    await db.flush()

    return {
        "created": True,
        "notification": notif_data,
        "risk_score": risk_score,
        "pct_spent": round(pct_spent, 1),
    }
