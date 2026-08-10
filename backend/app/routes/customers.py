from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models import Customer
from app.utils.pagination import paginate

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")


@customers_bp.get("")
@login_required
def list_customers():
    query = Customer.query.filter_by(user_id=current_user.id)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Customer.name.ilike(like), Customer.email.ilike(like)))

    country = request.args.get("country", "").strip()
    if country:
        query = query.filter_by(country=country)

    query = query.order_by(Customer.name)
    result = paginate(query)
    result["items"] = [c.to_dict() for c in result["items"]]
    return jsonify(result)


@customers_bp.post("")
@login_required
def create_customer():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"errors": {"name": ["Customer name is required."]}}), 400

    customer = Customer(
        user_id=current_user.id,
        name=name,
        email=data.get("email"),
        phone=data.get("phone"),
        country=data.get("country"),
        city=data.get("city"),
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify({"customer": customer.to_dict()}), 201


@customers_bp.put("/<int:customer_id>")
@login_required
def update_customer(customer_id):
    customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first_or_404()
    data = request.get_json(silent=True) or {}

    for field in ["name", "email", "phone", "country", "city"]:
        if field in data:
            setattr(customer, field, data[field])

    db.session.commit()
    return jsonify({"customer": customer.to_dict()})


@customers_bp.delete("/<int:customer_id>")
@login_required
def delete_customer(customer_id):
    customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first_or_404()
    if customer.transactions.first() is not None:
        return jsonify({"errors": {"customer": ["Can't delete a customer with existing transactions."]}}), 400

    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted."})
