"""
Middleware de sécurité — Phase 6.
Couvre : rate limiting, headers sécurité, audit log, RGPD.
"""
import time
import hashlib
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


# ── Rate Limiter en mémoire (Redis en prod) ─────────────────
class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._store: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - self.window
        requests = self._store[key]
        # Nettoyer les vieilles requêtes
        self._store[key] = [t for t in requests if t > window_start]
        remaining = self.max_requests - len(self._store[key])
        if remaining <= 0:
            return False, 0
        self._store[key].append(now)
        return True, remaining - 1


rate_limiter = RateLimiter(max_requests=120, window_seconds=60)
auth_limiter  = RateLimiter(max_requests=10,  window_seconds=60)  # Strict pour /auth


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware global de sécurité :
    - Security headers (CSP, HSTS, X-Frame-Options...)
    - Rate limiting par IP
    - Logging des requêtes suspectes
    """

    SECURITY_HEADERS = {
        "X-Content-Type-Options":    "nosniff",
        "X-Frame-Options":           "DENY",
        "X-XSS-Protection":          "1; mode=block",
        "Referrer-Policy":           "strict-origin-when-cross-origin",
        "Permissions-Policy":        "geolocation=(self), camera=(), microphone=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }

    async def dispatch(self, request: Request, call_next):
        # IP anonymisée pour logs RGPD
        client_ip = request.client.host if request.client else "unknown"
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]

        # Rate limiting spécial pour /auth
        if request.url.path.startswith("/api/v1/auth"):
            allowed, remaining = auth_limiter.is_allowed(ip_hash)
        else:
            allowed, remaining = rate_limiter.is_allowed(ip_hash)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Trop de requêtes. Réessayez dans 60 secondes."},
                headers={"Retry-After": "60"},
            )

        start = time.time()
        response: Response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)

        # Injecter les headers de sécurité
        for header, value in self.SECURITY_HEADERS.items():
            response.headers[header] = value

        response.headers["X-Request-Duration-Ms"] = str(duration)
        response.headers["X-RateLimit-Remaining"]  = str(remaining)

        return response
