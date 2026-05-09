# 💰 Coach Budget IA

> Application web de coaching budgétaire intelligent — prédit ton découvert, détecte tes abonnements oubliés, suggère des alternatives concrètes, compare les prix.

![Status](https://img.shields.io/badge/status-Production%20Ready-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![RGPD](https://img.shields.io/badge/RGPD-Compliant-purple)
![Tests](https://img.shields.io/badge/Tests-70%25%2B%20coverage-yellow)

---

## 🚀 Démarrage en 3 commandes

```bash
git clone https://github.com/votre-username/coach-budget.git
cd coach-budget
./start.sh
```

Le script vérifie les prérequis, configure l'environnement et démarre tout automatiquement.

**Accès :**
| Service  | URL                        |
|----------|----------------------------|
| App web  | http://localhost:5173      |
| API REST | http://localhost:8000      |
| Swagger  | http://localhost:8000/docs |

---

## ✨ Fonctionnalités

| Module | Description |
|--------|-------------|
| 📊 Dashboard | Projection solde 30 jours, date de découvert précise |
| 🎛️ What-If | Simulateur de réductions avec curseurs interactifs |
| 👻 Abonnements | Détection des paiements récurrents oubliés |
| 💡 Recommandations | Alternatives personnalisées par ville et profil (IA) |
| 🍳 Meal Prep | Recettes économiques < 2€/portion |
| 🏪 Prix | Comparateur 30 produits × 5 enseignes + géoloc OSM |
| 📂 Import CSV | Boursorama, BNP, Revolut, format générique |
| 🔔 Notifications | Alertes intelligentes (découvert, budget 80%, abonnements) |
| 🔒 RGPD | Export données, suppression compte, politique confidentialité |

---

## 🗺️ Roadmap — 6 Phases complètes

| Phase | Description | Semaines | Statut |
|-------|-------------|----------|--------|
| 1 | Cadrage & architecture | 1–2   | ✅ Terminé |
| 2 | Infrastructure & Auth  | 3–4   | ✅ Terminé |
| 3 | Moteur ML prédiction   | 5–8   | ✅ Terminé |
| 4 | Recommandations IA     | 9–12  | ✅ Terminé |
| 5 | Agrégateur de prix     | 13–17 | ✅ Terminé |
| 6 | Polish, RGPD, Lancement| 18–20 | ✅ Terminé |

---

## 🏗️ Architecture

```
React (Vite + TypeScript + Tailwind)
        ↓ HTTPS / JWT
Nginx (reverse proxy + SSL)
        ↓
FastAPI (Python 3.12) ── Redis (cache + sessions)
        ↓
PostgreSQL 16 ── Alembic (migrations)
        ↓
Anthropic Claude API    (recommandations)
Open Food Facts API     (recherche produits)
OpenStreetMap / Overpass (géolocalisation)
```

---

## 🧪 Tests

```bash
# Backend — 60+ tests unitaires
cd backend && pytest app/tests/ -v --cov=app

# Tests de performance (nécessite k6)
k6 run tests/performance/load_test.js

# Objectif : p(95) < 300ms, taux erreur < 1%
```

---

## 🔒 Sécurité & RGPD

- **Rate limiting** : 120 req/min (10/min pour /auth)
- **Security headers** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **JWT** : access token 30min + refresh token 7j
- **Mots de passe** : hashés bcrypt, jamais transmis en clair
- **RGPD Art. 17** : droit à l'effacement — `DELETE /api/v1/gdpr/delete-account`
- **RGPD Art. 20** : portabilité — `GET /api/v1/gdpr/export`
- **Cookies** : fonctionnels uniquement, aucun cookie tiers

---

## 📁 Structure du projet

```
coach-budget/
├── CONTRIBUTING.md          ← Guide de contribution
├── start.sh                 ← Script démarrage rapide
├── docker-compose.yml       ← Dev
├── docker-compose.prod.yml  ← Production
├── backend/
│   └── app/
│       ├── api/v1/          ← 7 routers REST
│       ├── core/            ← Config, DB, Sécurité, Middleware
│       ├── models/          ← 5 modèles SQLAlchemy
│       ├── schemas/         ← Pydantic validation
│       ├── services/        ← ML, IA, CSV, Prix, Recommandations
│       └── tests/           ← 60+ tests pytest
├── frontend/src/
│   ├── pages/               ← 9 pages
│   ├── components/          ← 20+ composants
│   ├── hooks/               ← React Query hooks
│   ├── services/            ← API axios
│   └── store/               ← Zustand
├── tests/performance/       ← k6 load tests
├── agent_docs/              ← Docs pour Claude Code
└── .github/workflows/       ← CI/CD GitHub Actions
```

---

## 👤 Auteur

**Joan Andy Mballa Nsengue**
Étudiant B3 IA & Big Data — ECE Paris
[LinkedIn](https://linkedin.com/in/joan-andy-mballa-nsengue) · [GitHub](https://github.com/Shogun44-GT)

---

*MIT License — 2025*
