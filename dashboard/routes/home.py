from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all, fetch_one

@dashboard_bp.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("login"))

    role = session.get("role", "staff")

    # --- Stat cards ---
    stats = fetch_one("""
        SELECT
            COALESCE(SUM(total_amount), 0) AS revenue,
            COUNT(*) AS orders
        FROM orders
        WHERE order_date >= CURDATE() - INTERVAL 30 DAY
    """) or {"revenue": 0, "orders": 0}

    customer_count = fetch_one("SELECT COUNT(*) AS total FROM customers") or {"total": 0}

    # --- Sales overview (last 7 days) ---
    sales_trend = fetch_all("""
        SELECT DATE(order_date) AS day, SUM(total_amount) AS total
        FROM orders
        WHERE order_date >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(order_date)
        ORDER BY day
    """)

    # --- Sales by channel ---
    channel_split = fetch_all("""
        SELECT channel, SUM(total_amount) AS total
        FROM orders
        GROUP BY channel
    """)

    # --- Top products ---
    top_products = fetch_all("""
        SELECT p.name, SUM(oi.quantity) AS units_sold, SUM(oi.quantity * oi.unit_price) AS revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY p.id
        ORDER BY revenue DESC
        LIMIT 5
    """)

    # --- Recent orders ---
    recent_orders = fetch_all("""
        SELECT o.id, c.name AS customer_name, o.total_amount, o.order_date, o.channel
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.order_date DESC
        LIMIT 6
    """)

    return render_template(
        "dashboard/index.html",
        role=role,
        stats=stats,
        customer_count=customer_count,
        sales_trend=sales_trend,
        channel_split=channel_split,
        top_products=top_products,
        recent_orders=recent_orders,
    )