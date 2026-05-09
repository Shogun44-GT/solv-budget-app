-- Initialisation PostgreSQL pour Coach Budget IA
-- Ce fichier est exécuté au premier démarrage du container

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour recherche full-text

-- Les tables sont créées par Alembic (alembic upgrade head)
