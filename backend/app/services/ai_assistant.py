import re

import requests

from app.models import Product
from app.services.analytics_service import build_lines_dataframe, resolve_period
from app.services.report_data import build_inventory_report

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"
OLLAMA_TIMEOUT = 20


def ollama_status():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        if r.status_code == 200:
            models = [m["name"] for m in r.json().get("models", [])]
            return {"available": True, "models": models}
    except requests.exceptions.RequestException:
        pass
    return {"available": False, "models": []}


def _business_context(user_id):
    """A compact text snapshot of the store's current numbers, fed to the
    LLM as context so answers are grounded in the user's real data."""
    start, end, *_ = resolve_period("30d", None, None)
    df = build_lines_dataframe(user_id, start, end)

    if df.empty:
        return "This store has no recorded sales in the last 30 days."

    revenue = round(df["line_total"].sum(), 2)
    orders = df["transaction_id"].nunique()
    top = df.groupby("product_name")["line_total"].sum().sort_values(ascending=False).head(5)
    top_lines = "\n".join(f"- {name}: ${v:,.2f}" for name, v in top.items())

    low_stock = Product.query.filter_by(user_id=user_id, is_active=True).filter(
        Product.stock_quantity <= Product.reorder_level
    ).all()
    low_stock_lines = "\n".join(f"- {p.name} ({p.stock_quantity} left)" for p in low_stock[:10]) or "None"

    return (
        f"Last 30 days: ${revenue:,.2f} revenue across {orders} orders.\n\n"
        f"Top 5 products by revenue:\n{top_lines}\n\n"
        f"Products at or below reorder level:\n{low_stock_lines}"
    )


def ask_ollama(user_id, question):
    context = _business_context(user_id)
    prompt = (
        "You are a business analyst assistant for a small retail store, built into a BI "
        "dashboard called RetailInsight. Answer the owner's question using ONLY the data "
        "below. Be concise (3-5 sentences), concrete, and practical. If the data doesn't "
        "answer the question, say so plainly.\n\n"
        f"--- STORE DATA (last 30 days) ---\n{context}\n--- END DATA ---\n\n"
        f"Question: {question}"
    )
    resp = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=OLLAMA_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


# ---------------------------------------------------------------------------
# Rule-based fallback: pattern-matches common questions directly against the
# same data, so the assistant is fully functional with zero local LLM setup.
# ---------------------------------------------------------------------------

def _fmt_money(v):
    return f"${v:,.2f}"


def _answer_top_products(user_id):
    start, end, *_ = resolve_period("30d", None, None)
    df = build_lines_dataframe(user_id, start, end)
    if df.empty:
        return "There's no sales data yet in the last 30 days, so I can't identify top products."
    top = df.groupby("product_name")["line_total"].sum().sort_values(ascending=False).head(5)
    lines = [f"{i+1}. {name} — {_fmt_money(v)}" for i, (name, v) in enumerate(top.items())]
    return "Your top products by revenue over the last 30 days:\n" + "\n".join(lines)


def _answer_sales_decrease(user_id):
    start, end, prev_start, prev_end = resolve_period("30d", None, None)
    df = build_lines_dataframe(user_id, start, end)
    prev_df = build_lines_dataframe(user_id, prev_start, prev_end)
    cur = df["line_total"].sum() if not df.empty else 0
    prev = prev_df["line_total"].sum() if not prev_df.empty else 0

    if prev == 0:
        return "There isn't enough sales history from the prior period to compare against yet."
    change = round((cur - prev) / prev * 100, 1)
    if change >= 0:
        return f"Actually, revenue is up {change}% vs the previous 30-day period (${cur:,.2f} vs ${prev:,.2f}), not down."
    return (
        f"Revenue is down {abs(change)}% vs the previous period (${cur:,.2f} vs ${prev:,.2f}). "
        f"Check the Sales Trends page for a day-by-day breakdown to spot when the drop started, "
        f"and Product Performance to see which products lost the most ground."
    )


def _answer_reorder(user_id):
    inv = build_inventory_report(user_id)
    low = [row for row in inv["table"] if row["Status"] != "OK"]
    if not low:
        return "Nothing needs reordering right now — all your products are above their reorder level."
    lines = [f"- {row['Product']} ({row['Stock']} left, reorder level {row['Reorder Level']})" for row in low[:10]]
    return "These products are at or below their reorder level:\n" + "\n".join(lines)


def _answer_executive_summary(user_id):
    start, end, *_ = resolve_period("30d", None, None)
    df = build_lines_dataframe(user_id, start, end)
    if df.empty:
        return "There's no sales data yet to summarize. Import or add some transactions first."
    revenue = df["line_total"].sum()
    profit = df["line_profit"].sum()
    orders = df["transaction_id"].nunique()
    customers = df["customer_id"].dropna().nunique()
    top_product = df.groupby("product_name")["line_total"].sum().idxmax()
    return (
        f"Over the last 30 days: {_fmt_money(revenue)} in revenue, {_fmt_money(profit)} in profit, "
        f"across {orders} orders from {customers} customers. Your best-selling product was {top_product}. "
        f"Use the Reports page to generate a full PDF/Excel version of this summary."
    )


RULES = [
    (r"top.*(product|seller|selling)", _answer_top_products),
    (r"(why|reason).*(sales|revenue).*(decrease|drop|down|fall)", _answer_sales_decrease),
    (r"reorder|restock|low stock|out of stock", _answer_reorder),
    (r"executive (summary|report)|summarize|summary", _answer_executive_summary),
]


def rule_based_answer(user_id, question):
    q = question.lower()
    for pattern, handler in RULES:
        if re.search(pattern, q):
            return handler(user_id)
    return (
        "I can help with things like: \"What are my top products?\", \"Why did sales decrease?\", "
        "\"What should I reorder?\", or \"Generate an executive summary.\" "
        "Try rephrasing your question along those lines, or check the Reports and Analytics pages directly."
    )


def answer_question(user_id, question):
    status = ollama_status()
    if status["available"]:
        try:
            answer = ask_ollama(user_id, question)
            if answer:
                return {"response": answer, "source": "ollama"}
        except requests.exceptions.RequestException:
            pass
    return {"response": rule_based_answer(user_id, question), "source": "rule_based"}
