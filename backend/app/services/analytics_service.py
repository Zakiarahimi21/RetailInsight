from datetime import datetime, timedelta

import pandas as pd

from app.models import Transaction, TransactionItem


def build_lines_dataframe(user_id, date_from=None, date_to=None):
    """One row per transaction line item, joined with transaction/customer/
    product context. This is the single source every analytics endpoint
    aggregates from, so every chart/KPI stays consistent with each other."""

    query = (
        TransactionItem.query
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.user_id == user_id)
    )
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    rows = []
    for item in query.all():
        t = item.transaction
        p = item.product
        transaction_date = t.transaction_date or t.created_at or datetime.utcnow()
        rows.append({
            "transaction_id": t.id,
            "invoice_no": t.invoice_no,
            "date": transaction_date,
            "customer_id": t.customer_id,
            "customer_name": t.customer.name if t.customer else None,
            "country": t.customer.country if t.customer else None,
            "product_id": p.id if p else None,
            "product_name": p.name if p else "Unknown Product",
            "category": p.category.name if (p and p.category) else "Uncategorized",
            "quantity": item.quantity,
            "unit_price": float(item.unit_price or 0),
            "line_total": float(item.line_total or 0),
            "line_profit": float(item.line_profit or 0),
        })

    columns = [
        "transaction_id", "invoice_no", "date", "customer_id", "customer_name",
        "country", "product_id", "product_name", "category", "quantity",
        "unit_price", "line_total", "line_profit",
    ]
    df = pd.DataFrame(rows, columns=columns)
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"])
    return df


def resolve_period(period: str | None, date_from: str | None, date_to: str | None):
    """Returns (start, end, prev_start, prev_end) as datetimes. Explicit
    date_from/date_to win; otherwise `period` (e.g. '7d', '30d', '90d',
    '365d') is used, defaulting to 30 days."""

    end = datetime.utcnow()
    if date_to:
        end = datetime.fromisoformat(date_to)

    if date_from:
        start = datetime.fromisoformat(date_from)
    elif period == "all":
        start = None
    else:
        days = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(period or "30d", 30)
        start = end - timedelta(days=days)

    if start is None:
        prev_start = None
        prev_end = None
    else:
        span = end - start
        prev_end = start
        prev_start = start - span

    return start, end, prev_start, prev_end


def pct_change(current, previous):
    if not previous:
        return None
    return round(((current - previous) / previous) * 100, 1)
