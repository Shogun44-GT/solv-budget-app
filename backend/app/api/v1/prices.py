from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.services.price_aggregator import (
    get_all_price_comparisons, compute_monthly_savings,
    get_smart_basket_suggestion, search_openfoodfacts,
    get_nearby_stores, get_categories, ALL_STORES,
)

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/compare")
async def compare_prices(
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    current_user: User = Depends(get_current_user),
):
    """Comparaison des prix de tous les produits du catalogue."""
    products = get_all_price_comparisons(category)
    return {
        "products": products,
        "categories": get_categories(),
        "stores": ALL_STORES,
        "total_products": len(products),
    }


@router.get("/categories")
async def list_categories(current_user: User = Depends(get_current_user)):
    return {"categories": get_categories()}


@router.post("/monthly-savings")
async def monthly_savings(
    basket: dict,
    current_store: str = Query(default="Monoprix"),
    target_store:  str = Query(default="Lidl"),
    current_user: User = Depends(get_current_user),
):
    """Calcule l'économie mensuelle pour un panier donné."""
    return compute_monthly_savings(basket, current_store, target_store)


@router.get("/smart-basket/{budget_id}")
async def smart_basket(
    budget_id: str,
    current_store: str = Query(default="Monoprix"),
    target_store:  str = Query(default="Lidl"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Génère un panier intelligent basé sur les habitudes de courses
    et calcule l'économie potentielle en changeant de supermarché.
    """
    # Récupérer les transactions du budget
    tx_result = await db.execute(
        select(Transaction).where(Transaction.budget_id == budget_id)
    )
    transactions = tx_result.scalars().all()
    category_totals: dict = {}
    for tx in transactions:
        cat = tx.category.value
        category_totals[cat] = category_totals.get(cat, 0) + tx.amount

    basket = get_smart_basket_suggestion(category_totals)
    if not basket:
        return {"basket": {}, "savings": None, "message": "Pas assez de données de courses"}

    savings = compute_monthly_savings(basket, current_store, target_store)
    return {"basket": basket, "savings": savings}


@router.get("/search")
async def search_product(
    q: str = Query(min_length=2, description="Terme de recherche produit"),
    current_user: User = Depends(get_current_user),
):
    """Recherche un produit sur Open Food Facts."""
    results = await search_openfoodfacts(q)
    return {"results": results, "count": len(results)}


@router.get("/nearby-stores")
async def nearby_stores(
    lat: float = Query(description="Latitude"),
    lon: float = Query(description="Longitude"),
    radius: int = Query(default=3000, ge=500, le=10000, description="Rayon en mètres"),
    current_user: User = Depends(get_current_user),
):
    """Trouve les supermarchés proches via OpenStreetMap."""
    stores = await get_nearby_stores(lat, lon, radius)
    return {
        "stores": stores,
        "count": len(stores),
        "search_radius_m": radius,
        "center": {"lat": lat, "lon": lon},
    }
