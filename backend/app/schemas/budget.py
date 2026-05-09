from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BudgetCreate(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    total_amount: float = Field(gt=0)
    category_limits: Optional[dict] = {}


class BudgetRead(BaseModel):
    id: str
    month: int
    year: int
    total_amount: float
    category_limits: dict
    created_at: datetime

    model_config = {"from_attributes": True}
