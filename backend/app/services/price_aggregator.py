"""
Agrégateur de prix — Phase 5.
Sources : base statique FR + Open Food Facts API + géolocalisation OSM.
Pipeline : normalisation noms → matching → déduplication → cache.
"""
import httpx
import hashlib
import json
from typing import Optional
from app.core.config import settings

# ── Catalogue produits de référence (50 produits quotidiens) ─
PRODUCT_CATALOG: dict[str, dict] = {
    # Laitiers
    "lait_demi_ecreme_1l":    {"name": "Lait demi-écrémé 1L",       "unit": "1L",    "category": "laitier",    "stores": {"Lidl": 0.89, "E.Leclerc": 0.95, "Carrefour": 1.09, "Monoprix": 1.45, "Franprix": 1.35}},
    "lait_entier_1l":         {"name": "Lait entier 1L",            "unit": "1L",    "category": "laitier",    "stores": {"Lidl": 0.95, "E.Leclerc": 1.02, "Carrefour": 1.15, "Monoprix": 1.55}},
    "yaourts_nature_x8":      {"name": "Yaourts nature ×8",         "unit": "8 pots","category": "laitier",    "stores": {"Lidl": 1.19, "E.Leclerc": 1.45, "Carrefour": 1.75, "Monoprix": 2.80}},
    "beurre_250g":            {"name": "Beurre doux 250g",          "unit": "250g",  "category": "laitier",    "stores": {"Lidl": 1.89, "E.Leclerc": 2.05, "Carrefour": 2.25, "Monoprix": 3.20}},
    "fromage_emmental_200g":  {"name": "Emmental râpé 200g",        "unit": "200g",  "category": "laitier",    "stores": {"Lidl": 1.49, "E.Leclerc": 1.65, "Carrefour": 1.89, "Monoprix": 2.70}},
    "creme_fraiche_20cl":     {"name": "Crème fraîche épaisse 20cl","unit": "20cl",  "category": "laitier",    "stores": {"Lidl": 0.69, "E.Leclerc": 0.79, "Carrefour": 0.89, "Monoprix": 1.35}},
    # Épicerie
    "pates_500g":             {"name": "Pâtes spaghetti 500g",      "unit": "500g",  "category": "epicerie",   "stores": {"Lidl": 0.59, "E.Leclerc": 0.79, "Carrefour": 0.89, "Monoprix": 1.25}},
    "riz_blanc_1kg":          {"name": "Riz blanc 1kg",             "unit": "1kg",   "category": "epicerie",   "stores": {"Lidl": 0.99, "E.Leclerc": 1.15, "Carrefour": 1.35, "Monoprix": 2.10}},
    "farine_1kg":             {"name": "Farine T55 1kg",            "unit": "1kg",   "category": "epicerie",   "stores": {"Lidl": 0.49, "E.Leclerc": 0.55, "Carrefour": 0.69, "Monoprix": 1.10}},
    "sucre_1kg":              {"name": "Sucre blanc 1kg",           "unit": "1kg",   "category": "epicerie",   "stores": {"Lidl": 0.89, "E.Leclerc": 0.95, "Carrefour": 1.05, "Monoprix": 1.50}},
    "huile_tournesol_1l":     {"name": "Huile tournesol 1L",        "unit": "1L",    "category": "epicerie",   "stores": {"Lidl": 1.45, "E.Leclerc": 1.55, "Carrefour": 1.79, "Monoprix": 2.50}},
    "huile_olive_75cl":       {"name": "Huile d'olive 75cl",        "unit": "75cl",  "category": "epicerie",   "stores": {"Lidl": 3.49, "E.Leclerc": 3.89, "Carrefour": 4.25, "Monoprix": 6.99}},
    "sel_kg":                 {"name": "Sel fin 1kg",               "unit": "1kg",   "category": "epicerie",   "stores": {"Lidl": 0.29, "E.Leclerc": 0.35, "Carrefour": 0.45, "Monoprix": 0.89}},
    "boite_tomates":          {"name": "Tomates pelées en boîte 400g","unit":"400g", "category": "epicerie",   "stores": {"Lidl": 0.49, "E.Leclerc": 0.59, "Carrefour": 0.69, "Monoprix": 1.15}},
    "lentilles_500g":         {"name": "Lentilles vertes 500g",     "unit": "500g",  "category": "epicerie",   "stores": {"Lidl": 0.79, "E.Leclerc": 0.89, "Carrefour": 1.09, "Monoprix": 1.75}},
    "pois_chiches_boite":     {"name": "Pois chiches en boîte 400g","unit": "400g",  "category": "epicerie",   "stores": {"Lidl": 0.65, "E.Leclerc": 0.75, "Carrefour": 0.89, "Monoprix": 1.40}},
    # Boulangerie
    "pain_de_mie_500g":       {"name": "Pain de mie 500g",          "unit": "500g",  "category": "boulangerie","stores": {"Lidl": 0.69, "E.Leclerc": 0.79, "Carrefour": 0.99, "Monoprix": 1.99}},
    "biscottes_x36":          {"name": "Biscottes ×36",             "unit": "36 uni","category": "boulangerie","stores": {"Lidl": 0.89, "E.Leclerc": 0.99, "Carrefour": 1.15, "Monoprix": 1.89}},
    # Boissons
    "eau_plate_6x1_5l":       {"name": "Eau plate 6×1,5L",          "unit": "9L",    "category": "boissons",   "stores": {"Lidl": 1.79, "E.Leclerc": 1.99, "Carrefour": 2.35, "Monoprix": 3.45}},
    "jus_orange_1l":          {"name": "Jus d'orange 1L",           "unit": "1L",    "category": "boissons",   "stores": {"Lidl": 1.09, "E.Leclerc": 1.25, "Carrefour": 1.49, "Monoprix": 2.30}},
    "cafe_moulu_250g":        {"name": "Café moulu 250g",           "unit": "250g",  "category": "boissons",   "stores": {"Lidl": 1.99, "E.Leclerc": 2.15, "Carrefour": 2.45, "Monoprix": 3.80}},
    "the_noir_x25":           {"name": "Thé noir ×25 sachets",      "unit": "25 sac","category": "boissons",   "stores": {"Lidl": 0.89, "E.Leclerc": 0.99, "Carrefour": 1.15, "Monoprix": 2.10}},
    # Frais
    "oeufs_x6":               {"name": "Œufs plein air ×6",         "unit": "6 oeufs","category": "frais",     "stores": {"Lidl": 1.49, "E.Leclerc": 1.65, "Carrefour": 1.89, "Monoprix": 2.75}},
    "jambon_blanc_x4":        {"name": "Jambon blanc ×4 tranches",  "unit": "4 tr.", "category": "frais",      "stores": {"Lidl": 1.39, "E.Leclerc": 1.55, "Carrefour": 1.79, "Monoprix": 2.90}},
    "poulet_entier_1_5kg":    {"name": "Poulet entier ~1,5kg",      "unit": "1,5kg", "category": "boucherie",  "stores": {"Lidl": 4.50, "E.Leclerc": 4.89, "Carrefour": 5.49, "Monoprix": 8.90}},
    "steaks_haches_x4":       {"name": "Steaks hachés ×4 (15%MG)", "unit": "4×100g","category": "boucherie",  "stores": {"Lidl": 2.99, "E.Leclerc": 3.25, "Carrefour": 3.79, "Monoprix": 5.50}},
    # Hygiène
    "gel_douche_300ml":       {"name": "Gel douche 300ml",          "unit": "300ml", "category": "hygiene",    "stores": {"Lidl": 0.79, "E.Leclerc": 0.89, "Carrefour": 1.09, "Monoprix": 2.50}},
    "shampoing_250ml":        {"name": "Shampooing 250ml",          "unit": "250ml", "category": "hygiene",    "stores": {"Lidl": 0.99, "E.Leclerc": 1.15, "Carrefour": 1.39, "Monoprix": 3.20}},
    "papier_wc_x6":           {"name": "Papier toilette ×6 rouleaux","unit":"6 rou.","category": "hygiene",    "stores": {"Lidl": 1.49, "E.Leclerc": 1.65, "Carrefour": 1.89, "Monoprix": 3.50}},
    "lessive_liquide_1_5l":   {"name": "Lessive liquide 1,5L",      "unit": "1,5L",  "category": "entretien",  "stores": {"Lidl": 2.49, "E.Leclerc": 2.79, "Carrefour": 3.25, "Monoprix": 5.90}},
}

ALL_STORES = ["Lidl", "E.Leclerc", "Carrefour", "Monoprix", "Franprix"]


def normalize_product_name(name: str) -> str:
    """Normalise un nom de produit pour le matching (lowercase, supprime accents/ponctuation)."""
    import unicodedata, re
    nfkd = unicodedata.normalize('NFKD', name.lower())
    no_accent = ''.join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9\s]', '', no_accent).strip()


def get_all_price_comparisons(category: Optional[str] = None) -> list[dict]:
    """Retourne les comparaisons de prix, filtrées par catégorie si précisé."""
    result = []
    for pid, data in PRODUCT_CATALOG.items():
        if category and data["category"] != category:
            continue
        stores = data["stores"]
        best_store   = min(stores, key=lambda s: stores[s])
        worst_store  = max(stores, key=lambda s: stores[s])
        best_price   = stores[best_store]
        worst_price  = stores[worst_store]

        result.append({
            "id": pid,
            "name": data["name"],
            "unit": data["unit"],
            "category": data["category"],
            "stores": stores,
            "best_store": best_store,
            "best_price": round(best_price, 2),
            "worst_price": round(worst_price, 2),
            "max_saving_per_purchase": round(worst_price - best_price, 2),
            "saving_percentage": round((1 - best_price / worst_price) * 100, 1) if worst_price > 0 else 0,
        })

    return sorted(result, key=lambda x: x["max_saving_per_purchase"], reverse=True)


def get_categories() -> list[str]:
    """Liste toutes les catégories disponibles."""
    return sorted(set(d["category"] for d in PRODUCT_CATALOG.values()))


def compute_monthly_savings(
    basket: dict[str, int],
    current_store: str = "Monoprix",
    target_store: str = "Lidl",
) -> dict:
    """Calcule l'économie mensuelle si l'utilisateur change de supermarché."""
    total_current = 0.0
    total_target  = 0.0
    product_savings = []

    for pid, qty in basket.items():
        product = PRODUCT_CATALOG.get(pid)
        if not product:
            continue
        price_current = product["stores"].get(current_store)
        price_target  = product["stores"].get(target_store)
        if price_current is None or price_target is None:
            continue

        cost_current = price_current * qty
        cost_target  = price_target  * qty
        saving = round(cost_current - cost_target, 2)

        total_current += cost_current
        total_target  += cost_target

        if saving > 0:
            product_savings.append({
                "product_id":    pid,
                "product_name":  product["name"],
                "quantity":      qty,
                "price_current": price_current,
                "price_target":  price_target,
                "monthly_saving": saving,
            })

    return {
        "current_store":         current_store,
        "target_store":          target_store,
        "total_current_store":   round(total_current, 2),
        "total_target_store":    round(total_target, 2),
        "monthly_saving":        round(total_current - total_target, 2),
        "annual_saving":         round((total_current - total_target) * 12, 2),
        "products":              sorted(product_savings, key=lambda x: x["monthly_saving"], reverse=True),
        "saving_percentage":     round((1 - total_target / total_current) * 100, 1) if total_current > 0 else 0,
    }


def get_smart_basket_suggestion(category_totals: dict) -> dict[str, int]:
    """
    Suggère un panier de courses intelligent basé sur les habitudes de dépense.
    Retourne {product_id: quantite_mensuelle_estimee}.
    """
    total_courses = category_totals.get("courses", 0)
    if total_courses == 0:
        return {}

    # Panier de base proportionnel au budget courses
    multiplier = max(1, int(total_courses / 150))
    return {
        "lait_demi_ecreme_1l": 4 * multiplier,
        "oeufs_x6":            2 * multiplier,
        "pates_500g":          3 * multiplier,
        "riz_blanc_1kg":       2 * multiplier,
        "yaourts_nature_x8":   2 * multiplier,
        "pain_de_mie_500g":    2 * multiplier,
        "beurre_250g":         1 * multiplier,
        "eau_plate_6x1_5l":    2 * multiplier,
        "huile_tournesol_1l":  1,
        "boite_tomates":       4 * multiplier,
        "lentilles_500g":      2 * multiplier,
        "jambon_blanc_x4":     2 * multiplier,
    }


async def search_openfoodfacts(query: str) -> list[dict]:
    """Recherche sur Open Food Facts avec timeout et gestion d'erreurs."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.OPENFOODFACTS_API_URL}/search",
                params={
                    "q": query, "cc": "fr", "lc": "fr",
                    "page_size": 8,
                    "fields": "product_name,brands,nutriscore_grade,ecoscore_grade,image_small_url,quantity",
                },
                headers={"User-Agent": "CoachBudgetIA/1.0 (contact@coachbudget.fr)"},
            )
            if resp.status_code == 200:
                return resp.json().get("products", [])
    except (httpx.TimeoutException, httpx.RequestError):
        pass
    return []


async def get_nearby_stores(lat: float, lon: float, radius_m: int = 3000) -> list[dict]:
    """
    Trouve les supermarchés proches via OpenStreetMap Nominatim.
    Retourne liste de {name, address, distance_m, lat, lon}.
    """
    overpass_query = f"""
[out:json][timeout:10];
(
  node["shop"="supermarket"](around:{radius_m},{lat},{lon});
  node["shop"="convenience"](around:{radius_m},{lat},{lon});
);
out body;
"""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data=overpass_query,
                headers={"User-Agent": "CoachBudgetIA/1.0"},
            )
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                stores = []
                for el in elements[:15]:
                    tags = el.get("tags", {})
                    name = tags.get("name", "Supermarché")
                    store_lat = el.get("lat", lat)
                    store_lon = el.get("lon", lon)
                    # Distance approximative (formule de Haversine simplifiée)
                    dist = _approx_distance(lat, lon, store_lat, store_lon)
                    stores.append({
                        "name": name,
                        "address": tags.get("addr:street", ""),
                        "city": tags.get("addr:city", ""),
                        "lat": store_lat,
                        "lon": store_lon,
                        "distance_m": round(dist),
                        "opening_hours": tags.get("opening_hours", ""),
                    })
                return sorted(stores, key=lambda s: s["distance_m"])
    except Exception:
        pass
    return []


def _approx_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance approximative en mètres (sphère locale)."""
    import math
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
