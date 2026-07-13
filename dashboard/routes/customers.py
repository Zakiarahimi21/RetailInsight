from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all

@dashboard_bp.route("/customers")
def customers():
    if "user_id" not in session:
        return redirect(url_for("login"))

    customers = fetch_all("""
        SELECT c.id, c.name, c.email,
               COUNT(o.id) AS total_orders,
               COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
               MAX(o.order_date) AS last_order
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY lifetime_value DESC
    """)

    repeat_rate = fetch_all("""
        SELECT
            SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) AS repeat_customers,
            COUNT(*) AS total_customers
        FROM (
            SELECT customer_id, COUNT(*) AS order_count
            FROM orders
            GROUP BY customer_id
        ) sub
    """)

    return render_template(
        "dashboard/customers.html",
        role=session.get("role", "staff"),
        customers=customers,
        repeat_rate=repeat_rate[0] if repeat_rate else {"repeat_customers": 0, "total_customers": 0},
    )