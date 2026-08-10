from flask import request, jsonify
from flask_login import login_required, current_user

from app.models import Product
from app.services.analytics_service import build_lines_dataframe, resolve_period
from app.routes.analytics import analytics_bp


@analytics_bp.get("/products")
@login_required
def product_performance():
    period = request.args.get("period", "30d")
    start, end, *_ = resolve_period(period, request.args.get("date_from"), request.args.get("date_to"))

    df = build_lines_dataframe(current_user.id, start, end)

    total_products = Product.query.filter_by(user_id=current_user.id, is_active=True).count()
    out_of_stock = Product.query.filter_by(user_id=current_user.id, is_active=True, stock_quantity=0).count()

    top_selling_name = None
    least_selling_name = None
    table = []
    abc = []

    if not df.empty:
        by_product = (
            df.groupby(["product_id", "product_name", "category"])
            .agg(sold=("quantity", "sum"), revenue=("line_total", "sum"), profit=("line_profit", "sum"))
            .reset_index()
            .sort_values("revenue", ascending=False)
        )

        if not by_product.empty:
            top_selling_name = by_product.iloc[0]["product_name"]
            least_selling_name = by_product.iloc[-1]["product_name"]

        table = [
            {
                "product": row["product_name"],
                "category": row["category"],
                "sold": int(row["sold"]),
                "revenue": round(row["revenue"], 2),
                "profit": round(row["profit"], 2),
            }
            for _, row in by_product.head(15).iterrows()
        ]

        # --- ABC analysis: classify by cumulative revenue contribution ---
        by_product["cum_pct"] = by_product["revenue"].cumsum() / by_product["revenue"].sum() * 100

        def classify(pct):
            if pct <= 80:
                return "A"
            if pct <= 95:
                return "B"
            return "C"

        by_product["class"] = by_product["cum_pct"].apply(classify)
        counts = by_product["class"].value_counts().to_dict()
        abc = [{"class": c, "product_count": int(counts.get(c, 0))} for c in ["A", "B", "C"]]

    return jsonify({
        "kpis": {
            "total_products": total_products,
            "top_selling": top_selling_name,
            "least_selling": least_selling_name,
            "out_of_stock": out_of_stock,
        },
        "top_products": table,
        "abc_analysis": abc,
    })
