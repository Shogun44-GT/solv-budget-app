# Architecture — Coach Budget IA

## Vue d'ensemble
```
Client (React) → Nginx → FastAPI → PostgreSQL
                               ↘ Redis (cache)
                               ↘ Claude API (recommandations)
                               ↘ Open Food Facts (prix)
```

## Backend structure
- `app/main.py` : Point d'entrée FastAPI, lifespan, CORS, routers
- `app/core/` : Config, base de données, sécurité JWT
- `app/models/` : Entités SQLAlchemy (User, Budget, Transaction, Prediction)
- `app/schemas/` : Pydantic (validation entrées/sorties)
- `app/api/v1/` : Routes REST
- `app/services/` : Logique métier (csv_parser, predictor, recommender)

## Frontend structure
- `src/pages/` : Écrans principaux
- `src/components/` : Composants réutilisables
- `src/services/` : Appels API axios
- `src/store/` : État global Zustand
- `src/types/` : Types TypeScript partagés

## Flux principal
1. User upload CSV ou saisit dépenses manuellement
2. `csv_parser.py` catégorise chaque transaction (NLP mots-clés)
3. `predictor.py` calcule rythme journalier + projection découvert
4. `recommender.py` appelle Claude API avec le contexte
5. Frontend affiche dashboard + courbe + recommandations

## Phase 3 — Ajouts

### Nouveaux services backend
- `price_aggregator.py` : comparaison prix statiques + Open Food Facts API
- `predictor.py` amélioré : moyenne glissante pondérée, détection d'anomalies

### Nouvelles routes
- `GET /api/v1/prices/compare` → comparaison prix tous produits
- `POST /api/v1/prices/monthly-savings` → calcul économies si changement de supermarché
- `GET /api/v1/prices/search?q=...` → recherche Open Food Facts

### Nouveaux composants frontend
- `ProjectionChart` : courbe AreaChart double (actuel + what-if)
- `CategoryBreakdown` : barres de progression par catégorie
- `WhatIfSimulator` : sliders interactifs + appel API
- `GhostSubsList` : liste abonnements récurrents avec scoring risque
- `PriceCompareGrid` : grille comparaison prix 4 enseignes
- `CSVImport` : drag-and-drop avec react-dropzone
- `AppLayout` : navigation responsive (mobile bottom nav + desktop tabs)
