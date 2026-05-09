# Schéma Base de Données

## users
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | Identifiant unique |
| email | VARCHAR UNIQUE | Email de connexion |
| hashed_password | VARCHAR | Bcrypt hash |
| full_name | VARCHAR | Nom complet |
| city | VARCHAR | Ville (pour recommandations locales) |
| is_active | BOOLEAN | Compte actif |

## budgets
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | FK users | |
| month | INT | 1-12 |
| year | INT | 2024+ |
| total_amount | FLOAT | Budget mensuel en € |
| category_limits | JSON | {"courses": 300, ...} |

## transactions
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | FK users | |
| budget_id | FK budgets | |
| label | VARCHAR | Libellé transaction |
| amount | FLOAT | Montant (toujours positif) |
| category | ENUM | loyer/courses/transport/... |
| date | DATE | Date de la transaction |
| is_recurring | BOOLEAN | Abonnement détecté |
| source | VARCHAR | manual ou csv_import |

## predictions
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| budget_id | FK budgets | |
| overdraft_date | DATE NULL | Date de découvert prévue |
| days_until_overdraft | INT NULL | Jours avant découvert |
| daily_spending_rate | FLOAT | €/jour de dépense |
| projected_end_balance | FLOAT | Solde projeté fin de mois |
| risk_score | FLOAT | Score 0-100 |
| risk_categories | JSON | Scores par catégorie |
| projection_data | JSON | [{day, date, balance}, ...] |
