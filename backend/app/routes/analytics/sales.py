from flask import request, jsonify
from flask_login import login_required, current_user

from app.services.analytics_service import build_lines_dataframe, resolve_period
from app.routes.analytics import analytics_bp

WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@analytics_bp.get("/sales")
@login_required
def sales_analytics():
    period = request.args.get("period", "30d")
    start, end, *_ = resolve_period(period, request.args.get("date_from"), request.args.get("date_to"))
    granularity = request.args.get("granularity", "day")  # day | week | month

    df = build_lines_dataframe(current_user.id, start, end)

    if df.empty:
        return jsonify({
            "kpis": {"total_revenue": 0, "total_sales": 0, "avg_order_value": 0, "total_orders": 0},
            "revenue_over_time": [],
            "sales_by_category": [],
            "sales_by_weekday": [],
        })

    total_orders = df["transaction_id"].nunique()
    total_revenue = round(df["line_total"].sum(), 2)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

    if granularity == "week":
        grouped = df.groupby(df["date"].dt.to_period("W").apply(lambda p: str(p.start_time.date())))
    elif granularity == "month":
        grouped = df.groupby(df["date"].dt.to_period("M").astype(str))
    else:
        grouped = df.groupby(df["date"].dt.date.astype(str))

    revenue_series = grouped["line_total"].sum().round(2)
    revenue_over_time = [{"date": d, "revenue": v} for d, v in revenue_series.items()]

    cat = df.groupby("category")["line_total"].sum().sort_values(ascending=False)
    sales_by_category = [{"category": name, "revenue": round(v, 2)} for name, v in cat.items()]

    weekday_sales = df.groupby(df["date"].dt.weekday)["line_total"].sum()
    sales_by_weekday = [
        {"day": WEEKDAY_NAMES[i], "revenue": round(weekday_sales.get(i, 0), 2)}
        for i in range(7)
    ]

    return jsonify({
        "kpis": {
            "total_revenue": total_revenue,
            "total_sales": total_revenue,
            "avg_order_value": avg_order_value,
            "total_orders": total_orders,
        },
        "revenue_over_time": revenue_over_time,
        "sales_by_category": sales_by_category,
        "sales_by_weekday": sales_by_weekday,
    })
