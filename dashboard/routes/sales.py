from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all

@dashboard_bp.route("/sales")
def sales():
    if "user_id" not in session:
        return redirect(url_for("login"))

    daily_sales = fetch_all("""
        SELECT DATE(order_date) AS day, SUM(total_amount) AS total, COUNT(*) AS orders
        FROM orders
        WHERE order_date >= CURDATE() - INTERVAL 30 DAY
        GROUP BY DATE(order_date)
        ORDER BY day
    """)

    channel_split = fetch_all("""
        SELECT channel, SUM(total_amount) AS total
        FROM orders
        WHERE order_date >= CURDATE() - INTERVAL 30 DAY
        GROUP BY channel
    """)

    all_orders = fetch_all("""
        SELECT o.id, c.name AS customer_name, o.total_amount, o.order_date, o.channel, o.status
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.order_date DESC
        LIMIT 50
    """)

    return render_template(
        "dashboard/sales.html",
        role=session.get("role", "staff"),
        daily_sales=daily_sales,
        channel_split=channel_split,
        all_orders=all_orders,
    )