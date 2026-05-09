from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import Optional
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionRead, CSVImportResponse
from app.services.csv_parser import parse_csv

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionRead, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = Transaction(user_id=current_user.id, **data.model_dump())
    db.add(tx)
    await db.flush()
    return TransactionRead.model_validate(tx)


@router.get("/", response_model=list[TransactionRead])
async def list_transactions(
    budget_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    if budget_id:
        query = query.where(Transaction.budget_id == budget_id)
    result = await db.execute(query.order_by(Transaction.date.desc()))
    return [TransactionRead.model_validate(t) for t in result.scalars().all()]


@router.post("/import-csv", response_model=CSVImportResponse)
async def import_csv(
    file: UploadFile = File(...),
    budget_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Fichier CSV requis")

    content = await file.read()
    parsed_txs, imported, skipped = parse_csv(content)

    saved = []
    category_totals: dict = {}

    for tx_data in parsed_txs:
        tx = Transaction(
            user_id=current_user.id,
            budget_id=budget_id,
            **tx_data,
        )
        db.add(tx)
        cat = tx_data["category"].value
        category_totals[cat] = category_totals.get(cat, 0) + tx_data["amount"]
        saved.append(tx)

    await db.flush()

    return CSVImportResponse(
        imported=imported,
        skipped=skipped,
        transactions=[TransactionRead.model_validate(t) for t in saved],
        category_totals={k: round(v, 2) for k, v in category_totals.items()},
    )


@router.delete("/by-budget/{budget_id}", status_code=200)
async def delete_transactions_by_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Supprime toutes les transactions d'un budget (pour réimporter un CSV)."""
    result = await db.execute(
        delete(Transaction).where(
            Transaction.budget_id == budget_id,
            Transaction.user_id == current_user.id,
        )
    )
    return {"deleted": result.rowcount}


@router.get("/ghost-subscriptions", response_model=list[TransactionRead])
async def get_ghost_subscriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retourne les abonnements récurrents potentiellement oubliés.
    Exclut les charges fixes non annulables (loyer, courses, resto, shopping, santé)."""
    from app.models.transaction import TransactionCategory
    EXCLUDED = [
        TransactionCategory.LOYER,
        TransactionCategory.COURSES,
        TransactionCategory.RESTO,
        TransactionCategory.SHOPPING,
        TransactionCategory.SANTE,
    ]
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.is_recurring == True,
            Transaction.category.notin_(EXCLUDED),
        ).order_by(Transaction.amount.desc())
    )
    return [TransactionRead.model_validate(t) for t in result.scalars().all()]
