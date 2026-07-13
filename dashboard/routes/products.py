from flask import render_template, session, redirect, url_for
from dashboard import dashboard_bp
from dashboard.db import fetch_all

@dashboard_bp.route("/products")
def products():
    if "user_id" not in session:
        return redirect(url_for("login"))

    top_products = fetch_all("""
        SELECT p.id, p.name, p.category, p.stock_quantity,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.quantity * oi.unit_price) AS revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY p.id
        ORDER BY revenue DESC
    """)

    low_stock = fetch_all("""
        SELECT name, stock_quantity, reorder_level
        FROM products
        WHERE stock_quantity <= reorder_level
        ORDER BY stock_quantity ASC
    """)

    return render_template(
        "dashboard/products.html",
        role=session.get("role", "staff"),
        top_products=top_products,
        low_stock=low_stock,
    )