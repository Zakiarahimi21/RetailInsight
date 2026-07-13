from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

@dashboard_bp.route("/forecast")
def forecast():
    if "user_id" not in session:
        return redirect(url_for("login"))

    history = fetch_all("""
        SELECT DATE(order_date) AS day, SUM(total_amount) AS total
        FROM orders
        WHERE order_date >= CURDATE() - INTERVAL 60 DAY
        GROUP BY DATE(order_date)
        ORDER BY day
    """)

    forecast_points = []
    projected_next_week = 0

    if len(history) >= 7:
        df = pd.DataFrame(history)
        df["day_index"] = range(len(df))
        X = df[["day_index"]]
        y = df["total"]

        model = LinearRegression()
        model.fit(X, y)

        future_index = np.array(range(len(df), len(df) + 7)).reshape(-1, 1)
        predictions = model.predict(future_index)
        predictions = [max(0, round(float(p), 2)) for p in predictions]
        projected_next_week = round(sum(predictions), 2)

        forecast_points = [
            {"day": f"Day {i+1}", "predicted": p} for i, p in enumerate(predictions)
        ]

    return render_template(
        "dashboard/forecast.html",
        role=session.get("role", "staff"),
        history=history,
        forecast_points=forecast_points,
        projected_next_week=projected_next_week,
        has_enough_data=len(history) >= 7,
    )