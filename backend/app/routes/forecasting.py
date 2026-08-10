from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.services.forecasting_service import run_forecast, run_product_demand_forecast

forecasting_bp = Blueprint("forecasting", __name__, url_prefix="/api/forecasting")


@forecasting_bp.get("/revenue")
@login_required
def forecast_revenue():
    horizon = request.args.get("horizon_days", 30, type=int)
    horizon = max(7, min(horizon, 90))

    result = run_forecast(current_user.id, horizon_days=horizon)
    return jsonify(result)


@forecasting_bp.get("/products")
@login_required
def forecast_products():
    horizon = request.args.get("horizon_days", 30, type=int)
    horizon = max(7, min(horizon, 90))

    products = run_product_demand_forecast(current_user.id, horizon_days=horizon)
    return jsonify({"predicted_products": products})
