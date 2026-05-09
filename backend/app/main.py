from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security_middleware import SecurityMiddleware
from app.api.v1 import auth, budgets, transactions, predictions, prices, recommendations, gdpr


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.APP_ENV == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="4.0.0",
    description="Coach Budget IA — Prédiction budgétaire intelligente · RGPD compliant",
    lifespan=lifespan,
    docs_url="/docs"  if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── Middlewares (ordre important) ────────────────────────────
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/api/v1")
app.include_router(budgets.router,         prefix="/api/v1")
app.include_router(transactions.router,    prefix="/api/v1")
app.include_router(predictions.router,     prefix="/api/v1")
app.include_router(prices.router,          prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(gdpr.router,            prefix="/api/v1")


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status":  "ok",
        "app":     settings.APP_NAME,
        "version": "4.0.0",
        "env":     settings.APP_ENV,
        "gdpr":    "compliant",
    }
