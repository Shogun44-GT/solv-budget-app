# Coach Budget IA — CLAUDE.md
> Ce fichier est lu par Claude Code à chaque session. Ne pas modifier sans raison.

## Projet
Application web de coaching budgétaire intelligent.
- Prédit la date de découvert d'un utilisateur
- Catégorise automatiquement les dépenses (CSV bancaire)
- Suggère des alternatives concrètes pour réduire les dépenses
- Compare les prix des produits du quotidien entre supermarchés

## Stack technique
- **Backend** : FastAPI (Python 3.12) + PostgreSQL 16 + Redis
- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS
- **ORM** : SQLAlchemy 2.0 async + Alembic (migrations)
- **ML** : scikit-learn + pandas
- **IA** : Anthropic Claude API (recommandations)
- **Infra** : Docker Compose + Nginx + GitHub Actions

## Commandes essentielles

### Démarrer l'environnement
```bash
docker-compose up -d           # Démarre tout
docker-compose logs -f backend # Logs backend
```

### Backend
```bash
cd backend
alembic upgrade head           # Migrations
pytest app/tests/ -v           # Tests
uvicorn app.main:app --reload  # Dev server
```

### Frontend
```bash
cd frontend
npm install && npm run dev     # Dev server port 5173
npm run build                  # Build prod
npm run type-check             # TypeScript check
```

## Conventions de code

### Python
- PEP 8 strict, type hints obligatoires
- Toujours async/await pour routes et DB
- Jamais de logique métier dans les routes → services/
- Schemas Pydantic : séparer Create / Read / Update

### TypeScript
- Interfaces pour les types API (jamais `any`)
- Hooks custom pour logique réutilisable
- Composants fonctionnels uniquement

### Git
- Branches : feat/nom, fix/nom, chore/nom
- Commits : "feat: description", "fix: description"
- Tests obligatoires avant commit

## Règles critiques
- Ne JAMAIS hardcoder de secrets → .env uniquement
- Ne JAMAIS committer .env
- Toujours migrer si les modèles changent
- Endpoints préfixés /api/v1/
- Erreurs : {"detail": "message"}

## Docs
- agent_docs/architecture.md → architecture complète
- agent_docs/database_schema.md → schéma BDD
- agent_docs/api_conventions.md → conventions API
- agent_docs/running_tests.md → guide tests
