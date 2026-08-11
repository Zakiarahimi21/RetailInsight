from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models import Transaction, TransactionItem, Product, Customer
from app.utils.pagination import paginate

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@transactions_bp.get("")
@login_required
def list_transactions():
    query = Transaction.query.filter_by(user_id=current_user.id)

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    search = request.args.get("search", "").strip()
    if search:
        query = query.filter(Transaction.invoice_no.ilike(f"%{search}%"))

    query = query.order_by(Transaction.transaction_date.desc())
    result = paginate(query)
    result["items"] = [t.to_dict() for t in result["items"]]
    return jsonify(result)


@transactions_bp.get("/<int:transaction_id>")
@login_required
def get_transaction(transaction_id):
    txn = Transaction.query.filter_by(id=transaction_id, user_id=current_user.id).first_or_404()
    return jsonify({"transaction": txn.to_dict()})


def _resolve_customer(data):
    customer_id = data.get("customer_id")
    if customer_id is not None and customer_id != "":
        try:
            customer_id = int(customer_id)
        except (TypeError, ValueError):
            return jsonify({"errors": {"customer_id": ["Customer ID must be a number."]}}), 400

        customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first()
        if not customer:
            return jsonify({"errors": {"customer_id": ["Customer not found."]}}), 400
        return customer

    if data.get("customer_name"):
        customer = Customer(
            user_id=current_user.id,
            name=data["customer_name"],
            email=data.get("customer_email"),
            country=data.get("customer_country"),
        )
        db.session.add(customer)
        db.session.flush()
        return customer
    return None


@transactions_bp.post("")
@login_required
def create_transaction():
    data = request.get_json(silent=True) or {}
    items_data = data.get("items") or []

    if not items_data:
        return jsonify({"errors": {"items": ["At least one line item is required."]}}), 400

    customer_result = _resolve_customer(data)
    if isinstance(customer_result, tuple):
        return customer_result
    customer = customer_result

    try:
        txn_date = datetime.fromisoformat(data.get("transaction_date")) if data.get("transaction_date") else datetime.utcnow()
    except ValueError:
        return jsonify({"errors": {"transaction_date": ["Invalid date format."]}}), 400

    txn = Transaction(
        user_id=current_user.id,
        customer_id=customer.id if customer else None,
        invoice_no=data.get("invoice_no"),
        transaction_date=txn_date,
        discount=data.get("discount", 0),
        source="manual",
    )
    db.session.add(txn)
    db.session.flush()

    for item in items_data:
        product = None
        product_id_value = item.get("product_id")
        product_sku_value = item.get("product_sku")

        if product_id_value not in (None, ""):
            try:
                product_id_value = int(product_id_value)
                product = Product.query.filter_by(id=product_id_value, user_id=current_user.id).first()
            except (TypeError, ValueError):
                product = None

        if not product and product_sku_value:
            product = Product.query.filter_by(sku=product_sku_value, user_id=current_user.id).first()
            if not product and str(product_sku_value).isdigit():
                product = Product.query.filter_by(id=int(product_sku_value), user_id=current_user.id).first()

        if not product:
            db.session.rollback()
            identifier = product_id_value if product_id_value not in (None, "") else product_sku_value or "unknown"
            return jsonify({"errors": {"items": [f"Product {identifier} not found."]}}), 400

        quantity = int(item.get("quantity", 1))
        unit_price = item.get("unit_price", product.unit_price)

        txn_item = TransactionItem(
            transaction_id=txn.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            unit_cost=product.unit_cost,
        )
        db.session.add(txn_item)

        # Manual sales draw down stock
        product.stock_quantity = max(0, product.stock_quantity - quantity)

    db.session.flush()
    txn.items  # ensure relationship is loaded before recalculating
    db.session.refresh(txn)
    txn.recalculate_totals()
    db.session.commit()

    return jsonify({"transaction": txn.to_dict()}), 201


@transactions_bp.delete("/<int:transaction_id>")
@login_required
def delete_transaction(transaction_id):
    txn = Transaction.query.filter_by(id=transaction_id, user_id=current_user.id).first_or_404()

    # Restock on delete
    for item in txn.items:
        if item.product:
            item.product.stock_quantity += item.quantity

    db.session.delete(txn)
    db.session.commit()
    return jsonify({"message": "Transaction deleted."})
