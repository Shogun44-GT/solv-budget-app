#!/bin/bash
# Script de démarrage rapide — Coach Budget IA
set -e

echo "╔══════════════════════════════════════╗"
echo "║      Coach Budget IA — Démarrage     ║"
echo "╚══════════════════════════════════════╝"

# Vérifications
if [ ! -f ".env" ]; then
    echo "⚠️  .env manquant — copie depuis .env.example"
    cp .env.example .env
    echo "🔑 Génère tes clés secrètes :"
    echo "   SECRET_KEY=$(openssl rand -hex 32)"
    echo "   JWT_SECRET_KEY=$(openssl rand -hex 32)"
    echo "➡️  Édite .env et renseigne ANTHROPIC_API_KEY, puis relance ./start.sh"
    exit 1
fi

echo "🐳 Démarrage des services Docker..."
docker-compose up -d

echo "⏳ Attente PostgreSQL..."
sleep 5

echo "🗄️  Application des migrations..."
docker-compose exec backend alembic upgrade head

echo ""
echo "✅ Coach Budget IA est prêt !"
echo ""
echo "   Frontend  → http://localhost:5173"
echo "   API       → http://localhost:8000"
echo "   Swagger   → http://localhost:8000/docs"
echo ""
echo "Pour arrêter : docker-compose down"
