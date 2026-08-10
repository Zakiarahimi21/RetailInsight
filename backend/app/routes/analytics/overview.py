from flask import request, jsonify
from flask_login import login_required, current_user

from app.models import Transaction, ImportLog, Product
from app.services.analytics_service import build_lines_dataframe, resolve_period, pct_change
from app.routes.analytics import analytics_bp


@analytics_bp.get("/overview")
@login_required
def overview():
    period = request.args.get("period", "30d")
    start, end, prev_start, prev_end = resolve_period(
        period, request.args.get("date_from"), request.args.get("date_to")
    )

    df = build_lines_dataframe(current_user.id, start, end)

    def kpis(frame):
        if frame.empty:
            return {"revenue": 0, "orders": 0, "customers": 0, "profit": 0}
        return {
            "revenue": round(frame["line_total"].sum(), 2),
            "orders": frame["transaction_id"].nunique(),
            "customers": frame["customer_id"].dropna().nunique(),
            "profit": round(frame["line_profit"].sum(), 2),
        }

    cur = kpis(df)

    if prev_start is not None:
        prev_df = build_lines_dataframe(current_user.id, prev_start, prev_end)
        prev = kpis(prev_df)
        kpi_payload = {
            "total_revenue": {"value": cur["revenue"], "change_pct": pct_change(cur["revenue"], prev["revenue"])},
            "total_orders": {"value": cur["orders"], "change_pct": pct_change(cur["orders"], prev["orders"])},
            "total_customers": {"value": cur["customers"], "change_pct": pct_change(cur["customers"], prev["customers"])},
            "total_profit": {"value": cur["profit"], "change_pct": pct_change(cur["profit"], prev["profit"])},
        }
    else:
        # "All Time" has no meaningful prior period to compare against.
        kpi_payload = {
            "total_revenue": {"value": cur["revenue"], "change_pct": None},
            "total_orders": {"value": cur["orders"], "change_pct": None},
            "total_customers": {"value": cur["customers"], "change_pct": None},
            "total_profit": {"value": cur["profit"], "change_pct": None},
        }

    sales_over_time = []
    top_products = []
    sales_by_category = []
    sales_by_country = []

    if not df.empty:
        daily = df.groupby(df["date"].dt.date)["line_total"].sum().round(2)
        sales_over_time = [{"date": str(d), "revenue": v} for d, v in daily.items()]

        top = (
            df.groupby("product_name")
            .agg(revenue=("line_total", "sum"))
            .sort_values("revenue", ascending=False)
            .head(5)
        )
        top_products = [{"product": name, "revenue": round(v, 2)} for name, v in top["revenue"].items()]

        cat = df.groupby("category")["line_total"].sum().sort_values(ascending=False)
        total_rev = cat.sum() or 1
        sales_by_category = [
            {"category": name, "revenue": round(v, 2), "pct": round(v / total_rev * 100, 1)}
            for name, v in cat.items()
        ]

        country_df = df.dropna(subset=["country"])
        if not country_df.empty:
            country = country_df.groupby("country")["line_total"].sum().sort_values(ascending=False).head(6)
            sales_by_country = [{"country": name, "revenue": round(v, 2)} for name, v in country.items()]

    # --- Recent activity feed: latest transactions + imports, merged ---
    activities = []
    for t in Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.created_at.desc()).limit(5):
        activities.append({
            "type": "sale",
            "message": f"Sale recorded — {t.invoice_no or ('#' + str(t.id))} (${float(t.total):.2f})",
            "at": t.created_at.isoformat(),
        })
    for i in ImportLog.query.filter_by(user_id=current_user.id).order_by(ImportLog.created_at.desc()).limit(5):
        activities.append({
            "type": "import",
            "message": f"Imported {i.imported_count} rows from {i.file_name}",
            "at": i.created_at.isoformat(),
        })
    low_stock_count = Product.query.filter_by(user_id=current_user.id, is_active=True).filter(
        Product.stock_quantity <= Product.reorder_level
    ).count()
    if low_stock_count:
        activities.append({
            "type": "alert",
            "message": f"{low_stock_count} product(s) are low on stock",
            "at": None,
        })
    activities.sort(key=lambda a: a["at"] or "", reverse=True)

    return jsonify({
        "period": {"start": start.isoformat() if start else None, "end": end.isoformat()},
        "kpis": kpi_payload,
        "sales_over_time": sales_over_time,
        "top_products": top_products,
        "sales_by_category": sales_by_category,
        "sales_by_country": sales_by_country,
        "recent_activities": activities[:8],
    })
