import pytest
from app.services.predictor import compute_prediction, compute_whatif


def test_compute_prediction_with_overdraft():
    result = compute_prediction(
        budget_amount=1000,
        total_spent=700,
        category_totals={"resto": 300, "courses": 250, "transport": 150},
        days_elapsed=15,
    )
    assert result["daily_spending_rate"] > 0
    assert result["risk_score"] > 50
    assert result["overdraft_date"] is not None
    assert len(result["projection_data"]) == 31


def test_compute_prediction_no_overdraft():
    result = compute_prediction(
        budget_amount=2000,
        total_spent=400,
        category_totals={"courses": 200, "transport": 100, "resto": 100},
        days_elapsed=15,
    )
    assert result["overdraft_date"] is None
    assert result["projected_end_balance"] > 0
    assert result["risk_score"] < 50


def test_whatif_reduces_spending():
    original = compute_prediction(1000, 600, {"resto": 300, "transport": 200, "courses": 100}, 15)
    whatif = compute_whatif(
        original, 1000, 600, {"resto": 300, "transport": 200, "courses": 100},
        15, {"resto": 50, "transport": 30}
    )
    assert whatif["total_savings"] > 0
    assert whatif["simulated_end_balance"] > original["projected_end_balance"]


def test_csv_parser():
    from app.services.csv_parser import parse_csv
    csv_content = b"""Date;Libelle;Montant
2024-05-01;LIDL ORLY;-45.30
2024-05-02;UBER;-12.50
2024-05-03;NETFLIX;-13.99
2024-05-04;SALAIRE ENTREPRISE;+2000.00
"""
    transactions, imported, skipped = parse_csv(csv_content)
    assert imported == 3   # Le salaire (positif) est ignoré
    assert any(t["category"].value == "courses" for t in transactions)
    assert any(t["category"].value == "transport" for t in transactions)
    assert any(t["is_recurring"] for t in transactions)  # Netflix
