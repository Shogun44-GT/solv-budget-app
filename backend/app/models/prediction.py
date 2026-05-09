from sqlalchemy import String, Float, Date, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_id: Mapped[str] = mapped_column(String, ForeignKey("budgets.id"), nullable=False, index=True)
    overdraft_date: Mapped[Date] = mapped_column(Date, nullable=True)  # None = pas de découvert
    days_until_overdraft: Mapped[int] = mapped_column(Integer, nullable=True)
    daily_spending_rate: Mapped[float] = mapped_column(Float, nullable=False)
    projected_end_balance: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    risk_categories: Mapped[dict] = mapped_column(JSON, default=dict)  # {"resto": 85, ...}
    projection_data: Mapped[dict] = mapped_column(JSON, default=dict)  # [{jour, solde}, ...]
    computed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relations
    budget: Mapped["Budget"] = relationship("Budget", back_populates="predictions")
