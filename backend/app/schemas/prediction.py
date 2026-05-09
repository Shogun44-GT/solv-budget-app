from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class ProjectionPoint(BaseModel):
    day: int
    date: date
    balance: float


class PredictionRead(BaseModel):
    id: str
    budget_id: str
    overdraft_date: Optional[date]
    days_until_overdraft: Optional[int]
    daily_spending_rate: float
    projected_end_balance: float
    risk_score: float
    risk_categories: dict
    projection_data: List[ProjectionPoint]
    computed_at: datetime

    model_config = {"from_attributes": True}


class WhatIfRequest(BaseModel):
    budget_id: str
    reductions: dict  # {"transport": 50, "resto": 30}  → % de réduction


class WhatIfResponse(BaseModel):
    original: PredictionRead
    simulated_end_balance: float
    simulated_overdraft_date: Optional[date]
    total_savings: float
    projection_data: List[ProjectionPoint]
