from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from app.models.transaction import TransactionCategory


class TransactionCreate(BaseModel):
    label: str = Field(min_length=1, max_length=500)
    amount: float = Field(gt=0)
    category: TransactionCategory
    date: date
    budget_id: Optional[str] = None
    is_recurring: bool = False


class TransactionRead(BaseModel):
    id: str
    label: str
    amount: float
    category: TransactionCategory
    date: date
    is_recurring: bool
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CSVImportRequest(BaseModel):
    budget_id: Optional[str] = None


class CSVImportResponse(BaseModel):
    imported: int
    skipped: int
    transactions: List[TransactionRead]
    category_totals: dict
