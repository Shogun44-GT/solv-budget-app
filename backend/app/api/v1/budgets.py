from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetRead

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("/", response_model=BudgetRead, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    budget = Budget(
        user_id=current_user.id,
        month=data.month,
        year=data.year,
        total_amount=data.total_amount,
        category_limits=data.category_limits or {},
    )
    db.add(budget)
    await db.flush()
    return BudgetRead.model_validate(budget)


@router.get("/", response_model=list[BudgetRead])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc())
    )
    return [BudgetRead.model_validate(b) for b in result.scalars().all()]


@router.get("/{budget_id}", response_model=BudgetRead)
async def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    return BudgetRead.model_validate(budget)
