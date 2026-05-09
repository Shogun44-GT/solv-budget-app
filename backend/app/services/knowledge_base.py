"""
Base de connaissances des alternatives — Phase 4.
Structure : alternatives par catégorie, personnalisées par ville et profil.
Couvre transport, alimentation, abonnements, shopping, restauration.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Alternative:
    label: str
    saving_euros: int
    description: str
    effort: str          # "faible" | "moyen" | "élevé"
    tags: list[str]      # ["etudiant", "paris", "famille", ...]
    url: Optional[str] = None
    saving_min: Optional[int] = None
    saving_max: Optional[int] = None


# ── Alternatives Transport ─────────────────────────────────────
TRANSPORT_ALTERNATIVES: list[Alternative] = [
    Alternative(
        label="Passe Navigo Mois",
        saving_euros=80,
        saving_min=60, saving_max=120,
        description="Remplace 8 trajets Uber/semaine. Valable sur tout le réseau RATP + SNCF Île-de-France.",
        effort="faible",
        tags=["paris", "idf", "etudiant", "actif"],
        url="https://www.navigo.fr",
    ),
    Alternative(
        label="Vélib' / Poney / Tier",
        saving_euros=45,
        description="Pour les trajets < 5 km en ville. Abonnement Vélib' à 37€/an, trottinettes à la minute.",
        effort="faible",
        tags=["paris", "idf", "etudiant"],
    ),
    Alternative(
        label="Covoiturage BlaBlaCar Daily",
        saving_euros=55,
        description="Pour les trajets domicile-travail réguliers en banlieue. Économise 50-70€/mois vs voiture.",
        effort="moyen",
        tags=["banlieue", "idf", "actif"],
        url="https://blablacar.fr",
    ),
    Alternative(
        label="Forfait 75% SNCF (étudiant)",
        saving_euros=30,
        description="Carte Avantage Jeune : -30% sur les TGV, -75% sur les Intercités certains horaires.",
        effort="faible",
        tags=["etudiant", "paris", "idf"],
    ),
    Alternative(
        label="Trottinette perso (amortie en 3 mois)",
        saving_euros=35,
        description="Achat trottinette électrique ~300€, rentabilisée en 3 mois vs trottinettes location.",
        effort="moyen",
        tags=["paris", "etudiant", "actif"],
    ),
]

# ── Alternatives Restauration ─────────────────────────────────
RESTO_ALTERNATIVES: list[Alternative] = [
    Alternative(
        label="Meal prep dominical",
        saving_euros=120,
        saving_min=80, saving_max=150,
        description="Cuisiner 5-6 repas le dimanche. 3€/repas maison vs 13-15€ livraison Deliveroo.",
        effort="moyen",
        tags=["etudiant", "actif", "famille"],
    ),
    Alternative(
        label="Too Good To Go",
        saving_euros=45,
        description="Paniers surprise 2,99-5,99€ dans les restos et boulangeries proches. App gratuite.",
        effort="faible",
        tags=["paris", "etudiant", "actif"],
        url="https://toogoodtogo.com",
    ),
    Alternative(
        label="Restaurant universitaire CROUS",
        saving_euros=80,
        description="Repas complet à 3,30€ avec carte étudiante. Disponible dans tous les campus.",
        effort="faible",
        tags=["etudiant", "paris", "idf"],
        url="https://www.crous-paris.fr",
    ),
    Alternative(
        label="Batch cooking / freezer meals",
        saving_euros=60,
        description="Cuisiner en grande quantité et congeler. Repas prêts toute la semaine à 2-3€ l'unité.",
        effort="moyen",
        tags=["famille", "actif"],
    ),
    Alternative(
        label="Applications cashback (Shopmium, iGraal)",
        saving_euros=20,
        description="Remboursements sur courses et restaurants partenaires. Cumulable avec promotions.",
        effort="faible",
        tags=["etudiant", "actif", "famille"],
    ),
    Alternative(
        label="Resto midi formule vs soir",
        saving_euros=35,
        description="La formule déjeuner est 30-40% moins chère que le même plat le soir. Même qualité.",
        effort="faible",
        tags=["actif", "paris"],
    ),
]

# ── Alternatives Courses ──────────────────────────────────────
COURSES_ALTERNATIVES: list[Alternative] = [
    Alternative(
        label="Lidl / Aldi marques propres",
        saving_euros=40,
        saving_min=25, saving_max=60,
        description="-25 à -40% vs Carrefour/Monoprix sur les mêmes produits. Qualité équivalente testée.",
        effort="faible",
        tags=["tous"],
    ),
    Alternative(
        label="Marché local (samedi/dimanche matin)",
        saving_euros=22,
        description="Fruits, légumes et fromages 20-35% moins chers qu'en grande surface. Produits frais.",
        effort="faible",
        tags=["paris", "idf", "famille"],
    ),
    Alternative(
        label="Achats en vrac (Day By Day, Biocoop)",
        saving_euros=18,
        description="Riz, pâtes, légumineuses, céréales. Payé au poids, zéro emballage, -15 à -25%.",
        effort="moyen",
        tags=["paris", "etudiant", "actif"],
    ),
    Alternative(
        label="Applications anti-gaspi (Phenix, Nous Anti-Gaspi)",
        saving_euros=25,
        description="Invendus de supermarchés à -50%. Pratique pour fruits, légumes, produits laitiers.",
        effort="faible",
        tags=["paris", "idf", "etudiant"],
    ),
    Alternative(
        label="Liste de courses stricte + repas planifiés",
        saving_euros=30,
        description="Planifier 7 repas avant de faire les courses réduit de 20-30% les achats impulsifs.",
        effort="moyen",
        tags=["tous"],
    ),
]

# ── Alternatives Abonnements ──────────────────────────────────
ABONNEMENTS_ALTERNATIVES: list[Alternative] = [
    Alternative(
        label="Netflix → partage compte (4 profils max)",
        saving_euros=10,
        description="Partager un abonnement Premium à 4 : 4,25€/personne vs 17€. Légal avec la même adresse.",
        effort="faible",
        tags=["etudiant", "actif", "famille"],
    ),
    Alternative(
        label="Spotify / Apple Music → plan étudiant",
        saving_euros=5,
        description="-50% avec carte étudiante valide. Spotify étudiant : 5,99€/mois vs 10,99€.",
        effort="faible",
        tags=["etudiant"],
        url="https://www.spotify.com/fr/student",
    ),
    Alternative(
        label="Salle de sport → YouTube + parcs",
        saving_euros=30,
        description="Canaux YouTube (Jeff Nippard, AthleanX) + parcs publics. Résultats identiques à terme.",
        effort="moyen",
        tags=["etudiant", "actif"],
    ),
    Alternative(
        label="Audit mensuel des abonnements (Tricount, Virgil)",
        saving_euros=25,
        description="En moyenne 2-3 abonnements oubliés par utilisateur. Virgil FR détecte les débits récurrents.",
        effort="faible",
        tags=["tous"],
    ),
    Alternative(
        label="Bibliothèque municipale → livres & films gratuits",
        saving_euros=15,
        description="Accès gratuit aux livres, BD, DVD, magazines. Certaines bibliothèques donnent accès à des ebooks.",
        effort="faible",
        tags=["paris", "idf", "etudiant", "famille"],
    ),
]

# ── Alternatives Shopping ─────────────────────────────────────
SHOPPING_ALTERNATIVES: list[Alternative] = [
    Alternative(
        label="Vinted / Leboncoin",
        saving_euros=55,
        description="Seconde main vêtements, électronique, meubles. -50 à -70% vs neuf. Livraison assurée.",
        effort="faible",
        tags=["tous"],
        url="https://www.vinted.fr",
    ),
    Alternative(
        label="Amazon Warehouse / Rakuten",
        saving_euros=28,
        description="Produits reconditionnés avec garantie constructeur. -20 à -40% vs neuf.",
        effort="faible",
        tags=["actif", "etudiant"],
    ),
    Alternative(
        label="Règle des 48h avant achat impulsif",
        saving_euros=40,
        description="Attendre 48h avant tout achat non planifié > 30€. Réduit de 60% les achats impulsifs.",
        effort="faible",
        tags=["tous"],
    ),
    Alternative(
        label="Emmaüs / ressourceries",
        saving_euros=35,
        description="Meubles, électroménager, vêtements à prix symboliques. Plusieurs points de vente en IDF.",
        effort="moyen",
        tags=["paris", "idf", "etudiant"],
    ),
]

# ── Mapping catégorie → alternatives ──────────────────────────
ALTERNATIVES_BY_CATEGORY: dict[str, list[Alternative]] = {
    "transport":   TRANSPORT_ALTERNATIVES,
    "resto":       RESTO_ALTERNATIVES,
    "courses":     COURSES_ALTERNATIVES,
    "abonnements": ABONNEMENTS_ALTERNATIVES,
    "shopping":    SHOPPING_ALTERNATIVES,
}

# ── Recettes meal-prep économiques ────────────────────────────
MEAL_PREP_RECIPES: list[dict] = [
    {
        "name": "Riz sauté légumes & œufs",
        "cost_per_portion": 1.20,
        "portions": 4,
        "prep_time": "20 min",
        "ingredients": ["riz", "œufs", "carottes", "petits pois", "sauce soja"],
        "difficulty": "facile",
        "tags": ["etudiant", "rapide", "sans gluten"],
    },
    {
        "name": "Lentilles corail au curry",
        "cost_per_portion": 0.90,
        "portions": 6,
        "prep_time": "25 min",
        "ingredients": ["lentilles corail", "lait de coco", "curry", "oignons", "tomates"],
        "difficulty": "facile",
        "tags": ["vegan", "etudiant", "sans gluten"],
    },
    {
        "name": "Pâtes bolognaise maison",
        "cost_per_portion": 1.50,
        "portions": 5,
        "prep_time": "35 min",
        "ingredients": ["pâtes", "viande hachée", "tomates concassées", "oignons", "carottes"],
        "difficulty": "facile",
        "tags": ["famille", "etudiant"],
    },
    {
        "name": "Soupe de pois chiches épicée",
        "cost_per_portion": 0.70,
        "portions": 6,
        "prep_time": "30 min",
        "ingredients": ["pois chiches en boîte", "tomates", "cumin", "paprika", "oignons"],
        "difficulty": "facile",
        "tags": ["vegan", "etudiant", "sans gluten"],
    },
    {
        "name": "Gratin de pommes de terre thon",
        "cost_per_portion": 1.30,
        "portions": 4,
        "prep_time": "45 min",
        "ingredients": ["pommes de terre", "thon en boîte", "crème fraîche", "gruyère"],
        "difficulty": "moyen",
        "tags": ["famille", "etudiant"],
    },
    {
        "name": "Buddha bowl quinoa légumes rôtis",
        "cost_per_portion": 1.80,
        "portions": 3,
        "prep_time": "30 min",
        "ingredients": ["quinoa", "pois chiches", "courgette", "poivron", "tahini"],
        "difficulty": "facile",
        "tags": ["vegan", "actif"],
    },
    {
        "name": "Poulet rôti & légumes (batch)",
        "cost_per_portion": 2.20,
        "portions": 5,
        "prep_time": "1h15",
        "ingredients": ["cuisses de poulet", "pommes de terre", "carottes", "oignons", "herbes de Provence"],
        "difficulty": "facile",
        "tags": ["famille", "actif"],
    },
]


def get_alternatives_for_profile(
    categories: list[str],
    city: str = "Paris",
    profile: str = "etudiant",
    max_per_category: int = 3,
) -> dict[str, list[dict]]:
    """
    Retourne les meilleures alternatives pour un profil donné.
    
    Args:
        categories: Catégories à risque à traiter
        city: Ville de l'utilisateur (pour filtrage géographique)
        profile: "etudiant" | "actif" | "famille"
        max_per_category: Nombre max d'alternatives par catégorie
    """
    result = {}
    city_lower = city.lower()

    # Tags de ville génériques
    city_tags = []
    if any(c in city_lower for c in ["paris", "boulogne", "vincennes", "montreuil", "saint-denis"]):
        city_tags = ["paris", "idf"]
    elif any(c in city_lower for c in ["rungis", "orly", "vitry", "ivry", "villejuif", "créteil", "choisy"]):
        city_tags = ["idf", "banlieue"]
    elif any(c in city_lower for c in ["lyon", "marseille", "bordeaux", "toulouse", "lille", "nantes"]):
        city_tags = ["province"]
    else:
        city_tags = ["idf"]

    for cat in categories:
        alts = ALTERNATIVES_BY_CATEGORY.get(cat, [])
        if not alts:
            continue

        # Score chaque alternative selon profil + ville
        scored = []
        for alt in alts:
            score = alt.saving_euros
            if profile in alt.tags:
                score += 30
            if any(t in alt.tags for t in city_tags):
                score += 20
            if "tous" in alt.tags:
                score += 10
            scored.append((score, alt))

        # Trier et prendre les meilleures
        top = sorted(scored, key=lambda x: x[0], reverse=True)[:max_per_category]
        result[cat] = [
            {
                "label": alt.label,
                "saving_euros": alt.saving_euros,
                "saving_min": alt.saving_min,
                "saving_max": alt.saving_max,
                "description": alt.description,
                "effort": alt.effort,
                "url": alt.url,
            }
            for _, alt in top
        ]

    return result


def get_meal_prep_recipes(profile: str = "etudiant", max_recipes: int = 5) -> list[dict]:
    """Retourne les recettes meal-prep adaptées au profil."""
    scored = []
    for recipe in MEAL_PREP_RECIPES:
        score = -recipe["cost_per_portion"] * 10  # Moins cher = mieux
        if profile in recipe["tags"]:
            score += 20
        scored.append((score, recipe))
    return [r for _, r in sorted(scored, reverse=True)[:max_recipes]]
