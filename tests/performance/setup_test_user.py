"""
Crée l'utilisateur de test pour les tests de charge k6.
Usage : python tests/performance/setup_test_user.py
"""
import asyncio
import httpx

BASE_URL = "http://localhost:8000"

async def main():
    async with httpx.AsyncClient() as client:
        # Créer l'utilisateur de test
        res = await client.post(f"{BASE_URL}/api/v1/auth/register", json={
            "email": "test@coachbudget.fr",
            "password": "TestPassword123!",
            "full_name": "Test K6",
            "city": "Paris",
        })
        if res.status_code in (200, 201):
            print("✅ Utilisateur de test créé")
        elif res.status_code == 400:
            print("ℹ️ Utilisateur de test déjà existant")
        else:
            print(f"❌ Erreur : {res.status_code} — {res.text}")

asyncio.run(main())
