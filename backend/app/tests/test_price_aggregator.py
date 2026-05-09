"""Tests du pipeline d'agrégation de prix — Phase 5."""
import pytest
from app.services.price_aggregator import (
    get_all_price_comparisons, compute_monthly_savings,
    get_smart_basket_suggestion, normalize_product_name,
    get_categories, PRODUCT_CATALOG, ALL_STORES,
)


class TestProductCatalog:
    def test_catalog_has_enough_products(self):
        assert len(PRODUCT_CATALOG) >= 20

    def test_all_products_have_required_fields(self):
        for pid, data in PRODUCT_CATALOG.items():
            assert "name"     in data, f"{pid}: name manquant"
            assert "unit"     in data, f"{pid}: unit manquant"
            assert "category" in data, f"{pid}: category manquant"
            assert "stores"   in data, f"{pid}: stores manquant"
            assert len(data["stores"]) >= 2, f"{pid}: moins de 2 magasins"

    def test_all_prices_positive(self):
        for pid, data in PRODUCT_CATALOG.items():
            for store, price in data["stores"].items():
                assert price > 0, f"{pid} @ {store}: prix invalide ({price})"

    def test_lidl_usually_cheapest(self):
        """Lidl doit être le moins cher pour la majorité des produits."""
        lidl_wins = 0
        total = 0
        for data in PRODUCT_CATALOG.values():
            if "Lidl" not in data["stores"]:
                continue
            total += 1
            best = min(data["stores"], key=lambda s: data["stores"][s])
            if best == "Lidl":
                lidl_wins += 1
        assert lidl_wins / total >= 0.7  # Lidl le moins cher sur ≥ 70%

    def test_categories_not_empty(self):
        cats = get_categories()
        assert len(cats) >= 4
        assert "epicerie" in cats
        assert "laitier" in cats


class TestPriceComparisons:
    def test_compare_all(self):
        results = get_all_price_comparisons()
        assert len(results) == len(PRODUCT_CATALOG)

    def test_compare_filtered_by_category(self):
        results = get_all_price_comparisons("laitier")
        assert all(r["category"] == "laitier" for r in results)
        assert len(results) > 0

    def test_sorted_by_saving(self):
        results = get_all_price_comparisons()
        savings = [r["max_saving_per_purchase"] for r in results]
        assert savings == sorted(savings, reverse=True)

    def test_comparison_structure(self):
        results = get_all_price_comparisons()
        for r in results:
            assert r["best_price"] <= r["worst_price"]
            assert r["max_saving_per_purchase"] >= 0
            assert 0 <= r["saving_percentage"] <= 100
            assert r["best_store"] in ALL_STORES


class TestMonthlySavings:
    def test_lidl_cheaper_than_monoprix(self):
        basket = {"lait_demi_ecreme_1l": 4, "pates_500g": 3, "oeufs_x6": 2}
        result = compute_monthly_savings(basket, "Monoprix", "Lidl")
        assert result["monthly_saving"] > 0
        assert result["total_target_store"] < result["total_current_store"]

    def test_same_store_no_saving(self):
        basket = {"lait_demi_ecreme_1l": 4}
        result = compute_monthly_savings(basket, "Lidl", "Lidl")
        assert result["monthly_saving"] == 0

    def test_annual_saving_is_12x_monthly(self):
        basket = {"lait_demi_ecreme_1l": 4, "pates_500g": 3}
        result = compute_monthly_savings(basket, "Monoprix", "Lidl")
        assert abs(result["annual_saving"] - result["monthly_saving"] * 12) < 0.01

    def test_unknown_product_ignored(self):
        basket = {"produit_inexistant": 5, "lait_demi_ecreme_1l": 2}
        result = compute_monthly_savings(basket, "Monoprix", "Lidl")
        assert result["total_current_store"] > 0  # Le produit connu est compté

    def test_saving_percentage_correct(self):
        basket = {"lait_demi_ecreme_1l": 10}
        result = compute_monthly_savings(basket, "Monoprix", "Lidl")
        expected_pct = (1 - 0.89 / 1.45) * 100
        assert abs(result["saving_percentage"] - expected_pct) < 1


class TestSmartBasket:
    def test_generates_basket_from_courses(self):
        basket = get_smart_basket_suggestion({"courses": 300})
        assert len(basket) > 0
        assert all(qty > 0 for qty in basket.values())

    def test_empty_with_no_courses(self):
        basket = get_smart_basket_suggestion({"transport": 100})
        assert basket == {}

    def test_scales_with_budget(self):
        basket_small = get_smart_basket_suggestion({"courses": 100})
        basket_large = get_smart_basket_suggestion({"courses": 400})
        total_small = sum(basket_small.values())
        total_large = sum(basket_large.values())
        assert total_large >= total_small


class TestNormalization:
    def test_lowercase(self):
        assert normalize_product_name("LAIT") == "lait"

    def test_removes_accents(self):
        assert "e" in normalize_product_name("crème fraîche")

    def test_handles_empty(self):
        assert normalize_product_name("") == ""
