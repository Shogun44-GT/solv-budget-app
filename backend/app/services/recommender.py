"""
Moteur de recommandations — Phase 4.
Combine la base de connaissances locale + Claude API pour des conseils
ultra-personnalisés selon profil, ville, et urgence financière.
"""
import json
import anthropic
from app.core.config import settings
from app.services.knowledge_base import get_alternatives_for_profile, get_meal_prep_recipes

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _detect_profile(city: str, budget_amount: float) -> str:
    """Détecte le profil utilisateur approximatif."""
    if budget_amount < 900:
        return "etudiant"
    elif budget_amount < 2000:
        return "actif"
    else:
        return "famille"


async def generate_recommendations(
    risk_categories: dict,
    category_totals: dict,
    budget_amount: float,
    city: str = "Paris",
    days_until_overdraft: int | None = None,
) -> dict:
    """
    Génère des recommandations personnalisées.
    Stratégie : base de connaissances locale (rapide) + enrichissement Claude API.
    """
    # Catégories à risque triées par score
    top_cats = [
        cat for cat, _ in sorted(risk_categories.items(), key=lambda x: x[1], reverse=True)
        if category_totals.get(cat, 0) > 0
    ][:3]

    if not top_cats:
        return {}

    profile = _detect_profile(city, budget_amount)

    # 1. Base locale (toujours disponible, aucune latence)
    local_recs = get_alternatives_for_profile(top_cats, city, profile)

    # 2. Enrichissement Claude API (contexte personnalisé)
    try:
        enhanced = await _enrich_with_claude(
            local_recs, category_totals, budget_amount,
            city, profile, days_until_overdraft
        )
        return enhanced
    except Exception:
        # Fallback propre sur les recommandations locales
        return local_recs


def _get_city_context(city: str) -> str:
    city_lower = city.lower()
    if "orly" in city_lower:
        return (
            f"Contexte Orly (Val-de-Marne) : "
            "Recommande E.Leclerc Orly, Aldi Orly, marché d'Orly le jeudi matin. "
            "Navigo zones 1-4 pour les trajets vers Paris. "
            "Cibler les commerces locaux du 94 (Val-de-Marne)."
        )
    if "rungis" in city_lower:
        return (
            f"Contexte Rungis (Val-de-Marne) : "
            "Recommande Lidl Rungis, marché de Rungis le samedi matin. "
            "Navigo zones 1-4 pour les trajets vers Paris. "
            "Cibler les commerces locaux du 94."
        )
    for commune in ("vitry", "créteil", "ivry", "villejuif", "choisy"):
        if commune in city_lower:
            return (
                f"Contexte banlieue sud ({city}) : "
                "Navigo zones 1-4 plutôt que zone 1-2. "
                "Privilégier les marchés locaux et les grandes surfaces du Val-de-Marne."
            )
    return f"Utilisateur à {city}."


async def _enrich_with_claude(
    local_recs: dict,
    category_totals: dict,
    budget_amount: float,
    city: str,
    profile: str,
    days_until_overdraft: int | None,
) -> dict:
    """
    Enrichit les recommandations locales avec le contexte Claude.
    Claude ajoute : conseils comportementaux, tips locaux spécifiques, urgence.
    """
    urgence = ""
    if days_until_overdraft is not None:
        urgence = f"⚠️ URGENT : découvert prévu dans {days_until_overdraft} jours. "

    cats_str = ", ".join(
        f"{cat}: {category_totals[cat]:.0f}€"
        for cat in local_recs
        if cat in category_totals
    )

    base_json = json.dumps(local_recs, ensure_ascii=False, indent=2)
    city_context = _get_city_context(city)

    prompt = f"""{urgence}
{city_context} Profil "{profile}". Budget : {budget_amount:.0f}€/mois.
Postes à risque : {cats_str}.

Voici des recommandations de base :
{base_json}

Améliore ces recommandations en :
1. Ajoutant 1 conseil comportemental concret et chiffré par catégorie
2. Adaptant les descriptions au contexte géographique exact
3. Priorisant les économies les plus rapides à réaliser
4. Gardant un ton bienveillant et motivant

Réponds UNIQUEMENT en JSON valide avec la même structure.
Chaque alternative doit avoir : label, saving_euros, description, effort, url (null si inconnu).
"""

    message = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1500,
        system="""Tu es un coach budget expert du marché français. 
Tu donnes des conseils ultra-concrets, réalistes et chiffrés.
Réponds UNIQUEMENT en JSON valide. Jamais de texte avant ou après.""",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Nettoyer les éventuelles balises markdown
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


async def generate_notification_message(
    risk_score: float,
    days_until_overdraft: int | None,
    top_category: str,
    top_amount: float,
    budget_amount: float,
) -> dict:
    """
    Génère un message de notification personnalisé (push ou in-app).
    Retourne : {"title": str, "body": str, "urgency": str, "action": str}
    """
    if days_until_overdraft is not None and days_until_overdraft <= 3:
        return {
            "title": "🚨 Découvert imminent",
            "body": f"À ton rythme actuel, tu seras à découvert dans {days_until_overdraft} jour{'s' if days_until_overdraft > 1 else ''}. Regarde tes recommandations maintenant.",
            "urgency": "critical",
            "action": "open_recommendations",
        }
    elif days_until_overdraft is not None and days_until_overdraft <= 10:
        return {
            "title": "⚠️ Attention à tes dépenses",
            "body": f"Découvert prévu dans {days_until_overdraft} jours. Ton poste {top_category} ({top_amount:.0f}€) est le plus à risque.",
            "urgency": "warning",
            "action": "open_whatif",
        }
    elif risk_score >= 70:
        return {
            "title": "📊 Budget sous tension",
            "body": f"Tu as dépensé {(top_amount/budget_amount*100):.0f}% de ton budget en {top_category}. Simule une réduction ?",
            "urgency": "warning",
            "action": "open_whatif",
        }
    else:
        return {
            "title": "✅ Budget sous contrôle",
            "body": "Bonne gestion ce mois-ci ! Consulte le comparateur de prix pour optimiser encore tes courses.",
            "urgency": "info",
            "action": "open_prices",
        }
