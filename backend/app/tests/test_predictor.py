"""Tests unitaires du moteur de prédiction ML — Phase 3."""
import pytest
from datetime import date, timedelta
from app.services.predictor import (
    compute_prediction, compute_whatif, get_risk_level,
    _weighted_daily_rate, _detect_anomalies
)


class TestWeightedDailyRate:
    def test_recent_days_weigh_more(self):
        # Série avec pic récent → taux plus élevé
        series_up = [10, 10, 10, 10, 50, 50]
        series_flat = [30, 30, 30, 30, 30, 30]
        assert _weighted_daily_rate(series_up) > _weighted_daily_rate(series_flat)

    def test_empty_series(self):
        assert _weighted_daily_rate([]) == 0.0

    def test_single_value(self):
        assert _weighted_daily_rate([42.0]) == pytest.approx(42.0)


class TestAnomalyDetection:
    def test_detects_spike(self):
        # 29 jours normaux + 1 pic énorme
        series = [20.0] * 10 + [200.0]
        anomalies = _detect_anomalies(series)
        assert len(anomalies) > 0
        assert anomalies[-1]["day"] == 11

    def test_no_anomaly_flat(self):
        series = [25.0] * 10
        assert _detect_anomalies(series) == []

    def test_needs_min_5_points(self):
        assert _detect_anomalies([100, 5, 5, 5]) == []


class TestComputePrediction:
    def test_overdraft_detected(self):
        result = compute_prediction(
            budget_amount=1000,
            total_spent=800,
            category_totals={"resto": 400, "courses": 250, "transport": 150},
            days_elapsed=15,
        )
        assert result["overdraft_date"] is not None
        assert result["days_until_overdraft"] is not None
        assert result["risk_score"] > 60

    def test_no_overdraft_safe(self):
        result = compute_prediction(
            budget_amount=2500,
            total_spent=600,
            category_totals={"courses": 300, "transport": 150, "loyer": 150},
            days_elapsed=15,
        )
        assert result["overdraft_date"] is None
        assert result["risk_score"] < 40

    def test_projection_length(self):
        result = compute_prediction(1200, 400, {"courses": 400}, 10)
        # Doit couvrir le mois + 1 jour
        assert len(result["projection_data"]) == 31

    def test_spent_percentage(self):
        result = compute_prediction(1000, 500, {"courses": 500}, 15)
        assert result["spent_percentage"] == pytest.approx(50.0)

    def test_remaining_budget(self):
        result = compute_prediction(1000, 300, {"courses": 300}, 10)
        assert result["remaining_budget"] == pytest.approx(700.0)

    def test_risk_categories_present(self):
        result = compute_prediction(
            1200, 500,
            {"courses": 200, "resto": 200, "transport": 100},
            15
        )
        assert "courses" in result["risk_categories"]
        assert "resto" in result["risk_categories"]

    def test_with_daily_series(self):
        """Teste la prédiction avec série temporelle (moving average)."""
        series = [20.0, 25.0, 30.0, 50.0, 15.0, 35.0, 28.0]
        result = compute_prediction(
            budget_amount=1500,
            total_spent=sum(series),
            category_totals={"courses": sum(series)},
            days_elapsed=len(series),
            daily_series=series,
        )
        assert result["daily_spending_rate"] > 0


class TestWhatIf:
    def test_reduction_improves_balance(self):
        original = compute_prediction(
            1000, 700,
            {"resto": 350, "transport": 200, "courses": 150},
            20
        )
        whatif = compute_whatif(
            original, 1000, 700,
            {"resto": 350, "transport": 200, "courses": 150},
            20, {"resto": 50, "transport": 30}
        )
        assert whatif["total_savings"] > 0
        assert whatif["simulated_end_balance"] > original["projected_end_balance"]

    def test_100_pct_reduction(self):
        original = compute_prediction(500, 300, {"shopping": 300}, 10)
        whatif = compute_whatif(
            original, 500, 300, {"shopping": 300}, 10, {"shopping": 100}
        )
        assert whatif["total_savings"] == pytest.approx(300.0)

    def test_overdraft_eliminated(self):
        """Test qu'une réduction suffisante élimine le découvert."""
        original = compute_prediction(800, 700, {"resto": 700}, 15)
        assert original["overdraft_date"] is not None
        whatif = compute_whatif(
            original, 800, 700, {"resto": 700}, 15, {"resto": 80}
        )
        assert whatif["simulated_overdraft_date"] is None


class TestRiskLevel:
    def test_levels(self):
        assert get_risk_level(80) == "critical"
        assert get_risk_level(55) == "warning"
        assert get_risk_level(20) == "safe"
        assert get_risk_level(40) == "warning"
        assert get_risk_level(70) == "critical"


class TestCSVParser:
    def test_parse_boursorama_format(self):
        from app.services.csv_parser import parse_csv
        csv = b"""dateOp;dateVal;label;category;supplierFound;amount;accountNum;accountLabel;isoCurrencyCode;originalAmount;originalCurrency
2024-05-10;2024-05-10;LIDL ORLY;Alimentation;LIDL;-42.30;FR76xxx;Compte courant;EUR;-42.30;EUR
2024-05-11;2024-05-11;UBER TRIP;Transport;UBER;-12.50;FR76xxx;Compte courant;EUR;-12.50;EUR
2024-05-12;2024-05-12;VIREMENT SALAIRE;Revenus;ENTREPRISE;+2500.00;FR76xxx;Compte courant;EUR;+2500.00;EUR
"""
        txs, imported, skipped = parse_csv(csv)
        assert imported == 2       # Le salaire positif est ignoré
        assert skipped >= 0
        cats = [t["category"].value for t in txs]
        assert "courses" in cats
        assert "transport" in cats

    def test_parse_generic_comma_separator(self):
        from app.services.csv_parser import parse_csv
        csv = b"""Date,Description,Amount
2024-05-01,Netflix,-13.99
2024-05-02,Spotify,-9.99
2024-05-03,Salary,+2000.00
"""
        txs, imported, skipped = parse_csv(csv)
        assert imported == 2
        assert any(t["is_recurring"] for t in txs)

    def test_categorization_accuracy(self):
        from app.services.csv_parser import detect_category
        from app.models.transaction import TransactionCategory
        assert detect_category("LIDL ORLY 94") == TransactionCategory.COURSES
        assert detect_category("UBER TRIP") == TransactionCategory.TRANSPORT
        assert detect_category("NETFLIX.COM") == TransactionCategory.ABONNEMENTS
        assert detect_category("MCDONALDS") == TransactionCategory.RESTO
        assert detect_category("PHARMACIE DU CENTRE") == TransactionCategory.SANTE
