from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all

@dashboard_bp.route("/reports")
def reports():
    if "user_id" not in session:
        return redirect(url_for("login"))

    summary = fetch_all("""
        SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
               SUM(total_amount) AS revenue,
               COUNT(*) AS orders
        FROM orders
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
    """)

    return render_template(
        "dashboard/reports.html",
        role=session.get("role", "staff"),
        summary=summary,
    )