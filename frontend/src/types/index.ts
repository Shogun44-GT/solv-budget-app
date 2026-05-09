// ── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string | null
  city: string | null
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// ── Budget ───────────────────────────────────────────────────
export interface Budget {
  id: string
  month: number
  year: number
  total_amount: number
  category_limits: Record<string, number>
  created_at: string
}

// ── Transaction ──────────────────────────────────────────────
export type TransactionCategory =
  | 'loyer' | 'courses' | 'transport' | 'resto'
  | 'abonnements' | 'shopping' | 'sante' | 'autre'

export interface Transaction {
  id: string
  label: string
  amount: number
  category: TransactionCategory
  date: string
  is_recurring: boolean
  source: 'manual' | 'csv_import'
  created_at: string
}

export interface CSVImportResponse {
  imported: number
  skipped: number
  transactions: Transaction[]
  category_totals: Record<string, number>
}

// ── Prediction ───────────────────────────────────────────────
export interface ProjectionPoint {
  day: number
  date: string
  balance: number
}

export interface Prediction {
  overdraft_date: string | null
  days_until_overdraft: number | null
  daily_spending_rate: number
  projected_end_balance: number
  risk_score: number
  risk_categories: Record<string, number>
  projection_data: ProjectionPoint[]
}

export interface PredictionResponse {
  prediction: Prediction
  category_totals: Record<string, number>
  recommendations: Record<string, Recommendation[]>
}

export interface Recommendation {
  label: string
  saving_euros: number
  description: string
}

export interface WhatIfResponse {
  original: Prediction
  simulated_end_balance: number
  simulated_overdraft_date: string | null
  total_savings: number
  projection_data: ProjectionPoint[]
}

// ── UI ────────────────────────────────────────────────────────
export type RiskLevel = 'safe' | 'warning' | 'critical'

export const CATEGORY_META: Record<TransactionCategory, { label: string; icon: string; color: string }> = {
  loyer:       { label: 'Loyer / Charges',        icon: '🏠', color: '#94a3b8' },
  courses:     { label: 'Courses alimentaires',   icon: '🛒', color: '#34d399' },
  transport:   { label: 'Transport',              icon: '🚗', color: '#60a5fa' },
  resto:       { label: 'Restaurants / Livraison',icon: '🍔', color: '#f97316' },
  abonnements: { label: 'Abonnements',            icon: '📱', color: '#a78bfa' },
  shopping:    { label: 'Shopping / Divers',      icon: '🛍️', color: '#f472b6' },
  sante:       { label: 'Santé / Pharmacie',      icon: '💊', color: '#2dd4bf' },
  autre:       { label: 'Autre',                  icon: '📦', color: '#64748b' },
}
