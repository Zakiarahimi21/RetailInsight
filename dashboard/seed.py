"""
Optional: populate MySQL with demo data so every dashboard page has
something to show before real point-of-sale data exists.

Run manually from the project root:
    python -m dashboard.seed
"""

import random
from datetime import datetime, timedelta
from dashboard.db import get_connection

PRODUCT_NAMES = [
    ("Cotton Saree", "Apparel", 22.00),
    ("Kids T-Shirt", "Apparel", 6.50),
    ("Ceramic Mug", "Home", 4.00),
    ("Basmati Rice 5kg", "Grocery", 9.00),
    ("Green Tea Box", "Grocery", 3.50),
    ("Leather Wallet", "Accessories", 15.00),
    ("Bamboo Toothbrush", "Health", 1.80),
    ("Scented Candle", "Home", 5.50),
]

CUSTOMER_NAMES = ["Rina Akter", "Mahfuz Hossain", "Sultana Khan", "Tanvir Ahmed", "Priya Das", "Kamal Uddin"]

CHANNELS = ["In-store", "Online", "Phone"]
STATUSES = ["Completed", "Completed", "Completed", "Pending", "Cancelled"]  # weighted toward Completed


def seed():
    conn = get_connection()
    if not conn:
        print("Could not connect to the database — check your .env values.")
        return
    cursor = conn.cursor()

    # Products
    product_ids = []
    for name, category, price in PRODUCT_NAMES:
        cursor.execute(
            "INSERT INTO products (name, category, unit_price, stock_quantity, reorder_level) VALUES (%s,%s,%s,%s,%s)",
            (name, category, price, random.randint(0, 60), 10),
        )
        product_ids.append(cursor.lastrowid)

    # Customers
    customer_ids = []
    for name in CUSTOMER_NAMES:
        email = name.lower().replace(" ", ".") + "@example.com"
        cursor.execute("INSERT INTO customers (name, email) VALUES (%s,%s)", (name, email))
        customer_ids.append(cursor.lastrowid)

    # Orders + order_items over the last 60 days
    for _ in range(150):
        order_date = datetime.now() - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
        customer_id = random.choice(customer_ids + [None])  # some walk-ins
        channel = random.choice(CHANNELS)
        status = random.choice(STATUSES)

        cursor.execute(
            "INSERT INTO orders (customer_id, total_amount, channel, status, order_date) VALUES (%s,%s,%s,%s,%s)",
            (customer_id, 0, channel, status, order_date),
        )
        order_id = cursor.lastrowid

        num_items = random.randint(1, 4)
        order_total = 0
        for _ in range(num_items):
            product_id = random.choice(product_ids)
            qty = random.randint(1, 5)
            unit_price = next(p[2] for p in PRODUCT_NAMES if product_ids[PRODUCT_NAMES.index(p)] == product_id)
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s,%s,%s,%s)",
                (order_id, product_id, qty, unit_price),
            )
            order_total += qty * unit_price

        cursor.execute("UPDATE orders SET total_amount = %s WHERE id = %s", (round(order_total, 2), order_id))

    conn.commit()
    cursor.close()
    conn.close()
    print("Seed complete: 8 products, 6 customers, 150 orders.")


if __name__ == "__main__":
    seed()