"""Tests de la base de connaissances et du moteur de recommandations."""
import pytest
from app.services.knowledge_base import (
    get_alternatives_for_profile, get_meal_prep_recipes,
    ALTERNATIVES_BY_CATEGORY
)


class TestKnowledgeBase:
    def test_all_categories_have_alternatives(self):
        for cat in ["transport", "resto", "courses", "abonnements", "shopping"]:
            assert cat in ALTERNATIVES_BY_CATEGORY
            assert len(ALTERNATIVES_BY_CATEGORY[cat]) > 0

    def test_alternatives_have_required_fields(self):
        for cat, alts in ALTERNATIVES_BY_CATEGORY.items():
            for alt in alts:
                assert alt.label, f"{cat}: label manquant"
                assert alt.saving_euros > 0, f"{cat}: saving_euros invalide"
                assert alt.description, f"{cat}: description manquante"
                assert alt.effort in ["faible", "moyen", "élevé"], f"{cat}: effort invalide"

    def test_profile_filtering_etudiant(self):
        result = get_alternatives_for_profile(["resto", "abonnements"], "Paris", "etudiant")
        assert "resto" in result
        assert "abonnements" in result
        # CROUS et Spotify étudiant doivent apparaître pour un étudiant à Paris
        resto_labels = [a["label"] for a in result["resto"]]
        assert any("CROUS" in l or "Too Good" in l for l in resto_labels)

    def test_profile_filtering_famille(self):
        result = get_alternatives_for_profile(["courses", "resto"], "Lyon", "famille")
        assert "courses" in result
        courses_labels = [a["label"] for a in result["courses"]]
        assert len(courses_labels) > 0

    def test_max_per_category(self):
        result = get_alternatives_for_profile(["transport", "resto"], "Paris", "actif", max_per_category=2)
        for cat, alts in result.items():
            assert len(alts) <= 2

    def test_empty_categories(self):
        result = get_alternatives_for_profile([], "Paris", "etudiant")
        assert result == {}

    def test_unknown_category(self):
        result = get_alternatives_for_profile(["unknown_cat"], "Paris", "etudiant")
        assert result == {}

    def test_city_adaptation_rungis(self):
        """Rungis est en IDF — doit avoir les alternatives IDF."""
        result = get_alternatives_for_profile(["transport"], "Rungis", "etudiant")
        assert "transport" in result
        assert len(result["transport"]) > 0


class TestMealPrep:
    def test_recipes_returned(self):
        recipes = get_meal_prep_recipes("etudiant")
        assert len(recipes) > 0

    def test_recipe_structure(self):
        recipes = get_meal_prep_recipes("etudiant")
        for r in recipes:
            assert "name" in r
            assert "cost_per_portion" in r
            assert r["cost_per_portion"] > 0
            assert "portions" in r
            assert "ingredients" in r
            assert len(r["ingredients"]) > 0

    def test_etudiant_gets_cheap_recipes(self):
        recipes = get_meal_prep_recipes("etudiant", max_recipes=3)
        # Les recettes pour étudiants doivent être < 2€/portion
        avg_cost = sum(r["cost_per_portion"] for r in recipes) / len(recipes)
        assert avg_cost < 2.0

    def test_max_recipes_limit(self):
        recipes = get_meal_prep_recipes("actif", max_recipes=3)
        assert len(recipes) <= 3


class TestNotificationLogic:
    @pytest.mark.asyncio
    async def test_critical_notification(self):
        from app.services.recommender import generate_notification_message
        notif = await generate_notification_message(
            risk_score=95, days_until_overdraft=2,
            top_category="resto", top_amount=250, budget_amount=1000
        )
        assert notif["urgency"] == "critical"
        assert "2" in notif["body"]

    @pytest.mark.asyncio
    async def test_warning_notification(self):
        from app.services.recommender import generate_notification_message
        notif = await generate_notification_message(
            risk_score=60, days_until_overdraft=8,
            top_category="transport", top_amount=150, budget_amount=1000
        )
        assert notif["urgency"] == "warning"

    @pytest.mark.asyncio
    async def test_info_notification(self):
        from app.services.recommender import generate_notification_message
        notif = await generate_notification_message(
            risk_score=15, days_until_overdraft=None,
            top_category="courses", top_amount=200, budget_amount=1500
        )
        assert notif["urgency"] == "info"

    def test_profile_detection(self):
        from app.services.recommender import _detect_profile
        assert _detect_profile("Paris", 700) == "etudiant"
        assert _detect_profile("Paris", 1500) == "actif"
        assert _detect_profile("Lyon", 3000) == "famille"
