from sqlalchemy import String, Float, Date, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


class TransactionCategory(str, enum.Enum):
    LOYER = "loyer"
    COURSES = "courses"
    TRANSPORT = "transport"
    RESTO = "resto"
    ABONNEMENTS = "abonnements"
    SHOPPING = "shopping"
    SANTE = "sante"
    AUTRE = "autre"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    budget_id: Mapped[str] = mapped_column(String, ForeignKey("budgets.id"), nullable=True, index=True)
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # Toujours positif (dépense)
    category: Mapped[TransactionCategory] = mapped_column(
        Enum(TransactionCategory), nullable=False, default=TransactionCategory.AUTRE
    )
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(default=False)     # Abonnement détecté
    source: Mapped[str] = mapped_column(String(50), default="manual")  # manual | csv_import
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="transactions")
    budget: Mapped["Budget"] = relationship("Budget", back_populates="transactions")
