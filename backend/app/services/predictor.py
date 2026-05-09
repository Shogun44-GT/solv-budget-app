"""
Moteur de prédiction ML — Phase 3.
Algorithmes : moyenne glissante pondérée, détection d'anomalies, 
projection linéaire avec pondération des tendances récentes.
Précision cible : ±3 jours sur la date de découvert.
"""
import numpy as np
from datetime import date, timedelta, datetime
from typing import Optional
from calendar import monthrange


CATEGORY_WEIGHTS = {
    "loyer":       0.1,   # Fixe → risque très faible
    "courses":     0.55,
    "transport":   0.65,
    "resto":       0.90,  # Très variable → risque élevé
    "abonnements": 0.45,
    "shopping":    0.80,
    "sante":       0.25,
    "autre":       0.50,
}

# Poids pour la moyenne glissante (plus récent = plus lourd)
RECENCY_WEIGHTS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.25]  # 6 derniers jours


def compute_prediction(
    budget_amount: float,
    total_spent: float,
    category_totals: dict,
    days_elapsed: int,
    daily_series: Optional[list[float]] = None,  # Série temporelle si dispo
    month_days: int = 30,
) -> dict:
    """
    Calcule la prédiction complète avec moyenne glissante et détection d'anomalies.

    Args:
        budget_amount: Budget mensuel total (€)
        total_spent: Total dépensé jusqu'à aujourd'hui (€)
        category_totals: {"courses": 250, "resto": 180, ...}
        days_elapsed: Jours écoulés dans le mois
        daily_series: Dépenses jour par jour (optionnel, pour ML avancé)
        month_days: Durée du mois
    """
    days_elapsed = max(days_elapsed, 1)

    # ── 1. Calcul du rythme journalier ──────────────────────────
    if daily_series and len(daily_series) >= 3:
        daily_rate = _weighted_daily_rate(daily_series)
        anomalies = _detect_anomalies(daily_series)
    else:
        daily_rate = total_spent / days_elapsed
        anomalies = []

    # ── 2. Projection sur 30 jours ──────────────────────────────
    projection = _build_projection(
        budget_amount, total_spent, daily_rate, days_elapsed, month_days
    )

    # ── 3. Date de découvert ─────────────────────────────────────
    overdraft_day = next(
        (p["day"] for p in projection if p["balance"] < 0), None
    )
    overdraft_date = None
    days_until_overdraft = None

    if overdraft_day:
        days_until_overdraft = max(0, overdraft_day - days_elapsed)
        overdraft_date = (
            date.today() + timedelta(days=days_until_overdraft)
        ).isoformat()

    # ── 4. Solde projeté fin de mois ────────────────────────────
    projected_end_balance = projection[-1]["balance"] if projection else budget_amount - total_spent

    # ── 5. Score de risque (0–100) ───────────────────────────────
    risk_score = _compute_risk_score(
        budget_amount, total_spent, daily_rate,
        days_elapsed, month_days, days_until_overdraft
    )

    # ── 6. Risque par catégorie ──────────────────────────────────
    risk_categories = _score_categories(category_totals, budget_amount, days_elapsed, month_days)

    return {
        "overdraft_date": overdraft_date,
        "days_until_overdraft": days_until_overdraft,
        "daily_spending_rate": round(daily_rate, 2),
        "projected_end_balance": round(projected_end_balance, 2),
        "risk_score": round(risk_score, 1),
        "risk_categories": risk_categories,
        "projection_data": projection,
        "anomalies": anomalies,
        "remaining_budget": round(budget_amount - total_spent, 2),
        "spent_percentage": round((total_spent / budget_amount) * 100, 1) if budget_amount > 0 else 0,
    }


def _weighted_daily_rate(daily_series: list[float]) -> float:
    """Moyenne glissante pondérée — privilégie les dépenses récentes."""
    if not daily_series:
        return 0.0
    series = daily_series[-6:] if len(daily_series) >= 6 else daily_series
    weights = RECENCY_WEIGHTS[-len(series):]
    # Normaliser les poids
    total_w = sum(weights)
    weights = [w / total_w for w in weights]
    return sum(d * w for d, w in zip(series, weights))


def _detect_anomalies(daily_series: list[float]) -> list[dict]:
    """
    Détecte les pics de dépenses anormaux (> 2 écarts-types).
    Utilisé pour identifier les dépenses exceptionnelles non récurrentes.
    """
    if len(daily_series) < 5:
        return []
    arr = np.array(daily_series)
    mean, std = arr.mean(), arr.std()
    if std == 0:
        return []
    anomalies = []
    for i, val in enumerate(daily_series):
        z_score = (val - mean) / std
        if z_score > 2.0:
            anomalies.append({
                "day": i + 1,
                "amount": round(float(val), 2),
                "z_score": round(float(z_score), 2),
                "label": "Dépense exceptionnelle détectée",
            })
    return anomalies


def _build_projection(
    budget: float,
    spent: float,
    daily_rate: float,
    days_elapsed: int,
    month_days: int,
) -> list[dict]:
    """Courbe de projection jour par jour avec pondération tendance récente."""
    today = date.today()
    month_start = today.replace(day=1)
    projection = []

    for day in range(1, month_days + 2):
        day_date = month_start + timedelta(days=day - 1)
        if day <= days_elapsed:
            # Passé : interpolation linéaire des données réelles
            balance = budget - (spent * day / days_elapsed)
        else:
            # Futur : projection au rythme actuel
            future_days = day - days_elapsed
            balance = budget - spent - (daily_rate * future_days)

        projection.append({
            "day": day,
            "date": day_date.isoformat(),
            "balance": round(balance, 2),
        })

    return projection


def _compute_risk_score(
    budget: float,
    spent: float,
    daily_rate: float,
    days_elapsed: int,
    month_days: int,
    days_until_overdraft: Optional[int],
) -> float:
    """Score de risque de 0 (serein) à 100 (critique)."""
    # Cas découvert imminent
    if days_until_overdraft is not None:
        if days_until_overdraft <= 3:
            return 97.0
        elif days_until_overdraft <= 7:
            return 85.0 + (7 - days_until_overdraft) * 2
        elif days_until_overdraft <= 15:
            return 65.0 + (15 - days_until_overdraft) * 1.5
        else:
            return 50.0 + max(0, 30 - days_until_overdraft)

    # Pas de découvert → risque relatif
    days_ratio = days_elapsed / month_days if month_days > 0 else 1
    spent_ratio = spent / budget if budget > 0 else 0
    overspend_ratio = spent_ratio / days_ratio if days_ratio > 0 else 1

    if overspend_ratio > 1.3:
        return 45.0
    elif overspend_ratio > 1.1:
        return 30.0
    elif overspend_ratio > 1.0:
        return 20.0
    else:
        return max(5.0, overspend_ratio * 18)


def _score_categories(
    category_totals: dict,
    budget: float,
    days_elapsed: int,
    month_days: int,
) -> dict:
    """Score de risque par catégorie (0–100)."""
    total = sum(category_totals.values()) or 1
    expected_spend_ratio = days_elapsed / month_days if month_days > 0 else 1
    scores = {}

    for cat, amount in category_totals.items():
        weight = CATEGORY_WEIGHTS.get(cat, 0.5)
        share = amount / total
        # Ratio dépense réelle vs budget proportionnel attendu
        expected = budget * expected_spend_ratio * share
        overshoot = (amount / expected) if expected > 0 else 1
        scores[cat] = round(min(100, overshoot * weight * 60), 1)

    return scores


def compute_whatif(
    original_prediction: dict,
    budget_amount: float,
    total_spent: float,
    category_totals: dict,
    days_elapsed: int,
    reductions: dict,
    month_days: int = 30,
) -> dict:
    """Simule l'impact de réductions de dépenses (What-If)."""
    days_elapsed = max(days_elapsed, 1)

    # Économies sur le mois entier (passé + futur)
    total_savings = sum(
        category_totals.get(cat, 0) * (pct / 100)
        for cat, pct in reductions.items()
    )

    simulated_spent = max(0, total_spent - total_savings)
    simulated_daily_rate = simulated_spent / days_elapsed

    projection = _build_projection(
        budget_amount, simulated_spent, simulated_daily_rate, days_elapsed, month_days
    )

    overdraft_day = next((p["day"] for p in projection if p["balance"] < 0), None)
    simulated_overdraft_date = None
    if overdraft_day:
        days_until = max(0, overdraft_day - days_elapsed)
        simulated_overdraft_date = (date.today() + timedelta(days=days_until)).isoformat()

    return {
        "simulated_end_balance": round(projection[-1]["balance"], 2),
        "simulated_overdraft_date": simulated_overdraft_date,
        "total_savings": round(total_savings, 2),
        "projection_data": projection,
        "simulated_daily_rate": round(simulated_daily_rate, 2),
    }


def get_risk_level(risk_score: float) -> str:
    """Retourne le niveau de risque textuel."""
    if risk_score >= 70:
        return "critical"
    elif risk_score >= 40:
        return "warning"
    else:
        return "safe"
