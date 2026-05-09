# Conventions API

## Base URL
- Dev : http://localhost:8000/api/v1
- Docs Swagger : http://localhost:8000/docs

## Authentification
Toutes les routes (sauf /auth/register et /auth/login) nécessitent :
```
Authorization: Bearer <access_token>
```

## Format erreurs
```json
{"detail": "Message d'erreur lisible"}
```

## Endpoints principaux
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Inscription |
| POST | /auth/login | Connexion (form-data) |
| GET | /auth/me | Profil utilisateur |
| POST | /budgets/ | Créer un budget |
| GET | /budgets/ | Lister les budgets |
| POST | /transactions/ | Ajouter une transaction |
| POST | /transactions/import-csv | Importer un CSV |
| GET | /transactions/ghost-subscriptions | Abonnements fantômes |
| POST | /predictions/{id}/compute | Calculer la prédiction |
| POST | /predictions/whatif | Simuler une réduction |

## Phase 4 — Nouvelles routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /recommendations/alternatives?categories=... | Alternatives par catégorie + profil |
| GET | /recommendations/meal-prep | Recettes meal-prep économiques |
| GET | /recommendations/notifications | Notifications intelligentes |
| POST | /recommendations/notifications/{id}/read | Marquer comme lue |
| POST | /recommendations/trigger-check/{budget_id} | Déclencher analyse + notification |

## Phase 5 — Nouvelles routes prix

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /prices/compare?category=... | Comparaison 50 produits (filtre catégorie) |
| GET | /prices/categories | Liste des catégories |
| POST | /prices/monthly-savings | Économie si changement supermarché |
| GET | /prices/smart-basket/{budget_id} | Panier intelligent + économies |
| GET | /prices/search?q=... | Recherche Open Food Facts |
| GET | /prices/nearby-stores?lat=&lon= | Supermarchés proches (OSM) |
