"""
Parseur CSV bancaire universel.
Supporte : Boursorama, BNP Paribas, Revolut, format générique.
"""
import pandas as pd
import io
from datetime import date
from typing import List, Tuple
from app.models.transaction import TransactionCategory


# Mots-clés par catégorie pour la classification automatique
CATEGORY_KEYWORDS: dict[TransactionCategory, list[str]] = {
    TransactionCategory.TRANSPORT: [
        "uber", "taxi", "navigo", "ratp", "sncf", "transilien", "blablacar",
        "lime", "bird", "voi", "tier", "dott", "velib", "autolib", "bolt"
    ],
    TransactionCategory.COURSES: [
        "lidl", "aldi", "carrefour", "leclerc", "monoprix", "franprix",
        "intermarche", "auchan", "casino", "picard", "biocoop", "naturalia",
        "supermarche", "supermarché", "epicerie", "épicerie"
    ],
    TransactionCategory.ABONNEMENTS: [
        "netflix", "spotify", "amazon prime", "disney", "canal+", "apple",
        "adobe", "microsoft", "google one", "icloud", "hbo", "deezer",
        "gym", "salle de sport", "fitness", "nrj mobile", "free mobile",
        "sfr", "bouygues", "orange", "vivendi"
    ],
    TransactionCategory.RESTO: [
        "restaurant", "brasserie", "bistro", "cafe", "café", "mcdonald",
        "kfc", "burger king", "pizza", "sushi", "deliveroo", "uber eats",
        "just eat", "domino", "paul", "eric kayser", "brioche doree"
    ],
    TransactionCategory.SANTE: [
        "pharmacie", "medecin", "médecin", "docteur", "hopital", "hôpital",
        "clinique", "laboratoire", "opticien", "dentiste", "kiné"
    ],
    TransactionCategory.LOYER: [
        "loyer", "charges", "edf", "engie", "total energie", "orange",
        "free", "sfr", "bouygues telecom", "eau", "ordures"
    ],
}


def detect_category(label: str) -> TransactionCategory:
    """Catégorise une transaction par mots-clés (NLP léger)."""
    label_lower = label.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in label_lower for kw in keywords):
            return category
    return TransactionCategory.AUTRE


def detect_separator(text: str) -> str:
    """Détecte automatiquement le séparateur CSV."""
    first_line = text.split("\n")[0]
    if first_line.count(";") > first_line.count(","):
        return ";"
    return ","


def parse_csv(
    file_content: bytes,
    encoding: str = "utf-8"
) -> Tuple[List[dict], int, int]:
    """
    Parse un fichier CSV bancaire et retourne les transactions.
    
    Returns:
        (transactions, imported_count, skipped_count)
    """
    try:
        text = file_content.decode(encoding)
    except UnicodeDecodeError:
        text = file_content.decode("latin-1")

    sep = detect_separator(text)
    df = pd.read_csv(io.StringIO(text), sep=sep, on_bad_lines="skip")

    transactions = []
    skipped = 0

    for _, row in df.iterrows():
        try:
            tx = _parse_row(row)
            if tx:
                transactions.append(tx)
            else:
                skipped += 1
        except Exception:
            skipped += 1

    return transactions, len(transactions), skipped


def _parse_row(row: pd.Series) -> dict | None:
    """Parse une ligne CSV en transaction."""
    cols = {col.lower().strip(): val for col, val in row.items()}

    # Trouver le montant (cherche colonnes négatives = dépenses)
    amount = None
    for col_name in ["montant", "amount", "débit", "debit", "valeur", "value"]:
        for key, val in cols.items():
            if col_name in key:
                try:
                    num = float(str(val).replace(",", ".").replace(" ", ""))
                    if num < 0:
                        amount = abs(num)
                        break
                except (ValueError, TypeError):
                    continue
        if amount:
            break

    if not amount or amount <= 0:
        return None

    # Trouver le libellé
    label = None
    for col_name in ["libelle", "label", "description", "intitule", "intitulé", "memo"]:
        for key, val in cols.items():
            if col_name in key and str(val).strip():
                label = str(val).strip()
                break
        if label:
            break

    if not label:
        label = "Transaction importée"

    # Trouver la date
    tx_date = date.today()
    for col_name in ["date", "jour", "day"]:
        for key, val in cols.items():
            if col_name in key:
                try:
                    tx_date = pd.to_datetime(str(val), dayfirst=True).date()
                    break
                except Exception:
                    continue
        break

    return {
        "label": label[:500],
        "amount": round(amount, 2),
        "category": detect_category(label),
        "date": tx_date,
        "is_recurring": _is_recurring(label),
        "source": "csv_import",
    }


def _is_recurring(label: str) -> bool:
    """Détecte si la transaction est probablement un abonnement récurrent."""
    recurring_keywords = [
        "abonnement", "subscription", "netflix", "spotify", "amazon prime",
        "disney", "apple", "adobe", "microsoft", "google", "gym", "salle",
        "sfr", "orange", "free", "bouygues", "edf", "engie", "loyer"
    ]
    return any(kw in label.lower() for kw in recurring_keywords)
