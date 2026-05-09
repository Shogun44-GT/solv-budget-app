"""Tests de sécurité et conformité RGPD — Phase 6."""
import pytest


class TestSecurityHeaders:
    @pytest.mark.asyncio
    async def test_health_has_security_headers(self, client):
        """Vérifie que les headers de sécurité sont présents."""
        res = await client.get("/health")
        assert res.status_code == 200
        # Ces headers doivent être injectés par le middleware
        assert "x-content-type-options" in res.headers
        assert "x-frame-options" in res.headers

    @pytest.mark.asyncio
    async def test_unauthorized_returns_401(self, client):
        """Les routes protégées renvoient 401 sans token."""
        routes = [
            "/api/v1/budgets/",
            "/api/v1/transactions/",
            "/api/v1/prices/compare",
            "/api/v1/recommendations/meal-prep",
            "/api/v1/gdpr/export",
        ]
        for route in routes:
            res = await client.get(route)
            assert res.status_code == 401, f"{route} devrait renvoyer 401"

    @pytest.mark.asyncio
    async def test_invalid_token_rejected(self, client):
        """Un token JWT invalide est rejeté."""
        res = await client.get(
            "/api/v1/budgets/",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_wrong_password_rejected(self, client):
        """Un mauvais mot de passe renvoie 401."""
        await client.post("/api/v1/auth/register", json={
            "email": "sec@test.com", "password": "correctpassword123"
        })
        res = await client.post("/api/v1/auth/login", data={
            "username": "sec@test.com", "password": "wrongpassword"
        })
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_password_not_exposed(self, client, auth_headers):
        """Le mot de passe hashé n'est jamais exposé dans les réponses."""
        res = await client.get("/api/v1/auth/me", headers=auth_headers)
        data = res.json()
        assert "password" not in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_sql_injection_attempt(self, client):
        """Tentative d'injection SQL rejetée proprement."""
        res = await client.post("/api/v1/auth/login", data={
            "username": "' OR 1=1; --",
            "password": "anything"
        })
        assert res.status_code == 401  # Rejeté, pas d'erreur 500


class TestGDPR:
    @pytest.mark.asyncio
    async def test_export_returns_user_data(self, client, auth_headers):
        """L'export RGPD contient les données de l'utilisateur."""
        res = await client.get("/api/v1/gdpr/export", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "user" in data
        assert "budgets" in data
        assert "transactions" in data
        assert "gdpr_notice" in data
        assert "export_date" in data

    @pytest.mark.asyncio
    async def test_export_no_password_in_data(self, client, auth_headers):
        """L'export RGPD ne contient pas le mot de passe."""
        res = await client.get("/api/v1/gdpr/export", headers=auth_headers)
        data = res.json()
        user_data = data["user"]
        assert "password" not in user_data
        assert "hashed_password" not in user_data

    @pytest.mark.asyncio
    async def test_privacy_policy_available(self, client, auth_headers):
        """La politique de confidentialité est accessible."""
        res = await client.get("/api/v1/gdpr/privacy-policy", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "data_processed" in data
        assert "your_rights" in data
        assert "cookies" in data

    @pytest.mark.asyncio
    async def test_delete_account_removes_data(self, client):
        """La suppression de compte efface toutes les données."""
        # Créer un compte temporaire
        reg = await client.post("/api/v1/auth/register", json={
            "email": "delete_me@test.com", "password": "password123"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Supprimer le compte
        del_res = await client.delete("/api/v1/gdpr/delete-account", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True

        # Vérifier que le compte n'existe plus
        login_res = await client.post("/api/v1/auth/login", data={
            "username": "delete_me@test.com", "password": "password123"
        })
        assert login_res.status_code == 401

    @pytest.mark.asyncio
    async def test_consent_status(self, client, auth_headers):
        """Le statut de consentement est retourné."""
        res = await client.get("/api/v1/gdpr/consent-status", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "analytics_consent" in data
        assert data["functional_consent"] is True


class TestInputValidation:
    @pytest.mark.asyncio
    async def test_budget_negative_amount_rejected(self, client, auth_headers):
        """Un budget négatif est rejeté par la validation Pydantic."""
        res = await client.post("/api/v1/budgets/", json={
            "month": 5, "year": 2025, "total_amount": -500
        }, headers=auth_headers)
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_month_rejected(self, client, auth_headers):
        """Un mois invalide (0 ou 13) est rejeté."""
        for invalid_month in [0, 13, -1]:
            res = await client.post("/api/v1/budgets/", json={
                "month": invalid_month, "year": 2025, "total_amount": 1000
            }, headers=auth_headers)
            assert res.status_code == 422, f"Mois {invalid_month} devrait être rejeté"

    @pytest.mark.asyncio
    async def test_short_password_rejected(self, client):
        """Un mot de passe trop court est rejeté."""
        res = await client.post("/api/v1/auth/register", json={
            "email": "short@test.com", "password": "abc"
        })
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_email_rejected(self, client):
        """Un email invalide est rejeté."""
        res = await client.post("/api/v1/auth/register", json={
            "email": "notanemail", "password": "password123"
        })
        assert res.status_code == 422
