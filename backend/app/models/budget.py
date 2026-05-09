from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)   # 1-12
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    category_limits: Mapped[dict] = mapped_column(JSON, default=dict)  # {"courses": 300, ...}
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="budgets")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="budget")
    predictions: Mapped[list["Prediction"]] = relationship("Prediction", back_populates="budget", cascade="all, delete-orphan")
