from datetime import datetime, timedelta

from app.models import Product
from app.services.analytics_service import build_lines_dataframe


REPORT_TYPES = {
    "sales_report": "Sales Report",
    "monthly_sales": "Monthly Sales Report",
    "customer_report": "Customer Report",
    "inventory_report": "Inventory Report",
    "executive_report": "Executive Summary",
}


def _period_bounds(period, date_from, date_to):
    end = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
    if date_from:
        start = datetime.fromisoformat(date_from)
    else:
        days = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(period or "30d", 30)
        start = end - timedelta(days=days)
    return start, end


def build_sales_report(user_id, period=None, date_from=None, date_to=None):
    start, end = _period_bounds(period, date_from, date_to)
    df = build_lines_dataframe(user_id, start, end)

    summary = {
        "Total Revenue": round(df["line_total"].sum(), 2) if not df.empty else 0,
        "Total Profit": round(df["line_profit"].sum(), 2) if not df.empty else 0,
        "Total Orders": int(df["transaction_id"].nunique()) if not df.empty else 0,
        "Total Units Sold": int(df["quantity"].sum()) if not df.empty else 0,
    }

    transactions = []
    if not df.empty:
        grouped = df.groupby(["transaction_id", "invoice_no", "date", "customer_name"]).agg(
            items=("quantity", "sum"), total=("line_total", "sum")
        ).reset_index().sort_values("date", ascending=False)
        transactions = [
            {
                "Invoice": row["invoice_no"] or f"#{row['transaction_id']}",
                "Date": row["date"].strftime("%Y-%m-%d"),
                "Customer": row["customer_name"] or "—",
                "Items": int(row["items"]),
                "Total": round(row["total"], 2),
            }
            for _, row in grouped.iterrows()
        ]

    return {
        "title": "Sales Report",
        "period": f"{start.date()} to {end.date()}",
        "summary": summary,
        "table_title": "Transactions",
        "table": transactions,
    }


def build_monthly_sales_report(user_id):
    today = datetime.utcnow()
    start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    df = build_lines_dataframe(user_id, start, today)

    summary = {
        "Total Revenue": round(df["line_total"].sum(), 2) if not df.empty else 0,
        "Total Profit": round(df["line_profit"].sum(), 2) if not df.empty else 0,
        "Total Orders": int(df["transaction_id"].nunique()) if not df.empty else 0,
    }

    daily = []
    if not df.empty:
        grouped = df.groupby(df["date"].dt.date)["line_total"].sum().sort_index()
        daily = [{"Date": str(d), "Revenue": round(v, 2)} for d, v in grouped.items()]

    return {
        "title": "Monthly Sales Report",
        "period": f"{start.date()} to {today.date()}",
        "summary": summary,
        "table_title": "Daily Revenue",
        "table": daily,
    }


def build_customer_report(user_id, period=None, date_from=None, date_to=None):
    start, end = _period_bounds(period, date_from, date_to)
    df = build_lines_dataframe(user_id, start, end)
    df = df.dropna(subset=["customer_id"]) if not df.empty else df

    summary = {
        "Unique Customers": int(df["customer_id"].nunique()) if not df.empty else 0,
        "Total Revenue": round(df["line_total"].sum(), 2) if not df.empty else 0,
    }

    table = []
    if not df.empty:
        per_customer = (
            df.groupby("customer_name")
            .agg(orders=("transaction_id", "nunique"), spend=("line_total", "sum"))
            .reset_index()
            .sort_values("spend", ascending=False)
        )
        table = [
            {"Customer": row["customer_name"], "Orders": int(row["orders"]), "Total Spend": round(row["spend"], 2)}
            for _, row in per_customer.iterrows()
        ]

    return {
        "title": "Customer Report",
        "period": f"{start.date()} to {end.date()}",
        "summary": summary,
        "table_title": "Customers by Spend",
        "table": table,
    }


def build_inventory_report(user_id):
    products = Product.query.filter_by(user_id=user_id, is_active=True).order_by(Product.name).all()

    summary = {
        "Total Products": len(products),
        "Low Stock": sum(1 for p in products if p.is_low_stock),
        "Out of Stock": sum(1 for p in products if p.stock_quantity == 0),
    }

    table = [
        {
            "Product": p.name,
            "SKU": p.sku or "—",
            "Category": p.category.name if p.category else "—",
            "Stock": p.stock_quantity,
            "Reorder Level": p.reorder_level,
            "Status": "Out of Stock" if p.stock_quantity == 0 else ("Low Stock" if p.is_low_stock else "OK"),
        }
        for p in products
    ]

    return {
        "title": "Inventory Report",
        "period": f"as of {datetime.utcnow().date()}",
        "summary": summary,
        "table_title": "Products",
        "table": table,
    }


def build_executive_report(user_id, period=None, date_from=None, date_to=None):
    start, end = _period_bounds(period, date_from, date_to)
    df = build_lines_dataframe(user_id, start, end)

    summary = {
        "Total Revenue": round(df["line_total"].sum(), 2) if not df.empty else 0,
        "Total Profit": round(df["line_profit"].sum(), 2) if not df.empty else 0,
        "Total Orders": int(df["transaction_id"].nunique()) if not df.empty else 0,
        "Unique Customers": int(df["customer_id"].dropna().nunique()) if not df.empty else 0,
    }

    top_products = []
    if not df.empty:
        top = df.groupby("product_name")["line_total"].sum().sort_values(ascending=False).head(10)
        top_products = [{"Product": name, "Revenue": round(v, 2)} for name, v in top.items()]

    return {
        "title": "Executive Summary",
        "period": f"{start.date()} to {end.date()}",
        "summary": summary,
        "table_title": "Top Products",
        "table": top_products,
    }


BUILDERS = {
    "sales_report": build_sales_report,
    "monthly_sales": lambda user_id, **kw: build_monthly_sales_report(user_id),
    "customer_report": build_customer_report,
    "inventory_report": lambda user_id, **kw: build_inventory_report(user_id),
    "executive_report": build_executive_report,
}


def build_report_data(report_type, user_id, period=None, date_from=None, date_to=None):
    builder = BUILDERS.get(report_type)
    if not builder:
        raise ValueError(f"Unknown report type: {report_type}")
    return builder(user_id, period=period, date_from=date_from, date_to=date_to)
