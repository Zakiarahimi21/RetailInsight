from datetime import datetime

from flask import request, jsonify
from flask_login import login_required, current_user

from app.models import Customer
from app.services.analytics_service import build_lines_dataframe, resolve_period
from app.routes.analytics import analytics_bp


@analytics_bp.get("/customers")
@login_required
def customer_analytics():
    period = request.args.get("period", "30d")
    start, end, *_ = resolve_period(period, request.args.get("date_from"), request.args.get("date_to"))

    df = build_lines_dataframe(current_user.id, start, end)
    df = df.dropna(subset=["customer_id"]) if not df.empty else df

    total_customers = Customer.query.filter_by(user_id=current_user.id).count()
    new_customers = Customer.query.filter_by(user_id=current_user.id).filter(
        Customer.created_at >= start, Customer.created_at <= end
    ).count()

    segmentation = []
    top_customers = []
    returning_customers = 0
    avg_clv = 0

    if not df.empty and df["customer_id"].nunique() > 0:
        per_customer = (
            df.groupby(["customer_id", "customer_name"])
            .agg(
                orders=("transaction_id", "nunique"),
                spend=("line_total", "sum"),
                last_purchase=("date", "max"),
            )
            .reset_index()
        )

        returning_customers = int((per_customer["orders"] > 1).sum())
        avg_clv = round(per_customer["spend"].mean(), 2)

        # --- RFM-lite segmentation: rank by monetary value into tertiles ---
        per_customer["recency_days"] = (datetime.utcnow() - per_customer["last_purchase"]).dt.days
        per_customer = per_customer.sort_values("spend", ascending=False)

        n = len(per_customer)
        high_cut = max(1, round(n * 0.2))
        low_cut = max(high_cut + 1, round(n * 0.8))

        def segment(idx):
            if idx < high_cut:
                return "High Value"
            if idx < low_cut:
                return "Regular"
            return "Low Value"

        per_customer = per_customer.reset_index(drop=True)
        per_customer["segment"] = [segment(i) for i in per_customer.index]

        seg_counts = per_customer["segment"].value_counts()
        total = len(per_customer)
        segmentation = [
            {"segment": s, "count": int(seg_counts.get(s, 0)), "pct": round(seg_counts.get(s, 0) / total * 100, 1)}
            for s in ["High Value", "Regular", "Low Value"]
        ]

        top_customers = [
            {
                "customer": row["customer_name"],
                "orders": int(row["orders"]),
                "spend": round(row["spend"], 2),
                "segment": row["segment"],
            }
            for _, row in per_customer.head(10).iterrows()
        ]

    return jsonify({
        "kpis": {
            "total_customers": total_customers,
            "new_customers": new_customers,
            "returning_customers": returning_customers,
            "avg_clv": avg_clv,
        },
        "segmentation": segmentation,
        "top_customers": top_customers,
    })
