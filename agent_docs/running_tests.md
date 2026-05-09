# Guide Tests

## Backend
```bash
cd backend

# Tests rapides
pytest app/tests/ -v

# Avec coverage
pytest app/tests/ -v --cov=app --cov-report=html

# Test spécifique
pytest app/tests/test_predictions.py -v

# Voir le rapport HTML
open htmlcov/index.html
```

## Objectifs de coverage
- Minimum : 70%
- Cible : 85%

## Ajouter un test
1. Créer `app/tests/test_nom_feature.py`
2. Utiliser le fixture `client` pour les tests API
3. Utiliser le fixture `auth_headers` pour les routes protégées
4. Marquer avec `@pytest.mark.asyncio`

## Frontend
```bash
cd frontend
npm run type-check  # Vérification TypeScript
npm run lint        # ESLint
```
