/**
 * Tests de charge k6 — Phase 6
 * Objectif : < 300ms de réponse pour 95% des requêtes
 * Usage : k6 run tests/performance/load_test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Métriques custom ─────────────────────────────────────────
const errorRate    = new Rate('errors')
const authDuration = new Trend('auth_duration_ms')
const apiDuration  = new Trend('api_duration_ms')

// ── Configuration des scénarios ──────────────────────────────
export const options = {
  scenarios: {
    // Montée progressive (smoke test)
    smoke: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5  },
        { duration: '1m',  target: 10 },
        { duration: '30s', target: 0  },
      ],
    },
    // Charge nominale
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m',  target: 20 },
        { duration: '3m',  target: 20 },
        { duration: '1m',  target: 0  },
      ],
      startTime: '2m30s',
    },
    // Pic de charge
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0  },
      ],
      startTime: '7m30s',
    },
  },
  thresholds: {
    // Objectif : 95% < 300ms, 99% < 500ms
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    errors:            ['rate<0.01'],   // < 1% d'erreurs
    http_req_failed:   ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000'

// ── Helpers ──────────────────────────────────────────────────
function getAuthToken() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    new URLSearchParams({ username: 'test@coachbudget.fr', password: 'TestPassword123!' }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  authDuration.add(res.timings.duration)
  check(res, { 'login status 200': r => r.status === 200 })
  return res.json('access_token')
}

// ── Scénario principal ───────────────────────────────────────
export default function () {
  const token = getAuthToken()
  if (!token) { errorRate.add(1); return }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Health check
  const health = http.get(`${BASE_URL}/health`)
  check(health, { 'health ok': r => r.status === 200 })
  apiDuration.add(health.timings.duration)
  sleep(0.5)

  // Liste budgets
  const budgets = http.get(`${BASE_URL}/api/v1/budgets/`, { headers })
  check(budgets, {
    'budgets status 200': r => r.status === 200,
    'budgets < 300ms':    r => r.timings.duration < 300,
  })
  apiDuration.add(budgets.timings.duration)
  errorRate.add(budgets.status !== 200)
  sleep(1)

  // Comparaison prix
  const prices = http.get(`${BASE_URL}/api/v1/prices/compare`, { headers })
  check(prices, {
    'prices status 200': r => r.status === 200,
    'prices < 300ms':    r => r.timings.duration < 300,
  })
  apiDuration.add(prices.timings.duration)
  errorRate.add(prices.status !== 200)
  sleep(1)

  // Alternatives recommandations
  const recs = http.get(
    `${BASE_URL}/api/v1/recommendations/alternatives?categories=resto,transport`,
    { headers }
  )
  check(recs, {
    'recs status 200': r => r.status === 200,
    'recs < 300ms':    r => r.timings.duration < 300,
  })
  apiDuration.add(recs.timings.duration)
  errorRate.add(recs.status !== 200)
  sleep(1)

  // Meal prep
  const mealprep = http.get(`${BASE_URL}/api/v1/recommendations/meal-prep`, { headers })
  check(mealprep, { 'mealprep status 200': r => r.status === 200 })
  sleep(0.5)
}

// ── Résumé personnalisé ──────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0
  const errors = data.metrics.errors?.values?.rate ?? 0

  const passed = p95 < 300 && p99 < 500 && errors < 0.01

  return {
    stdout: `
╔══════════════════════════════════════════╗
║     RAPPORT DE PERFORMANCE — k6          ║
╠══════════════════════════════════════════╣
║  p(95) réponse : ${p95.toFixed(0).padEnd(6)} ms (cible < 300ms)  ║
║  p(99) réponse : ${p99.toFixed(0).padEnd(6)} ms (cible < 500ms)  ║
║  Taux d'erreur : ${(errors * 100).toFixed(2).padEnd(6)} %  (cible < 1%)     ║
╠══════════════════════════════════════════╣
║  Résultat : ${passed ? '✅ OBJECTIFS ATTEINTS     ' : '❌ OBJECTIFS NON ATTEINTS'}     ║
╚══════════════════════════════════════════╝
`,
    'tests/performance/results.json': JSON.stringify(data, null, 2),
  }
}
