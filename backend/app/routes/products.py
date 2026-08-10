from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models import Product, Category
from app.utils.pagination import paginate

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


@products_bp.get("")
@login_required
def list_products():
    query = Product.query.filter_by(user_id=current_user.id)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Product.name.ilike(like), Product.sku.ilike(like)))

    category_id = request.args.get("category_id", type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)

    if request.args.get("low_stock") == "true":
        query = query.filter(Product.stock_quantity <= Product.reorder_level)

    query = query.order_by(Product.name)
    result = paginate(query)
    result["items"] = [p.to_dict() for p in result["items"]]
    return jsonify(result)


@products_bp.post("")
@login_required
def create_product():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"errors": {"name": ["Product name is required."]}}), 400

    if data.get("category_id"):
        cat = Category.query.filter_by(id=data["category_id"], user_id=current_user.id).first()
        if not cat:
            return jsonify({"errors": {"category_id": ["Invalid category."]}}), 400

    product = Product(
        user_id=current_user.id,
        sku=data.get("sku"),
        name=name,
        category_id=data.get("category_id"),
        unit_price=data.get("unit_price", 0),
        unit_cost=data.get("unit_cost", 0),
        stock_quantity=data.get("stock_quantity", 0),
        reorder_level=data.get("reorder_level", 10),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"product": product.to_dict()}), 201


@products_bp.put("/<int:product_id>")
@login_required
def update_product(product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first_or_404()
    data = request.get_json(silent=True) or {}

    for field in ["sku", "name", "unit_price", "unit_cost", "stock_quantity", "reorder_level",
                  "category_id", "is_active"]:
        if field in data:
            setattr(product, field, data[field])

    db.session.commit()
    return jsonify({"product": product.to_dict()})


@products_bp.delete("/<int:product_id>")
@login_required
def delete_product(product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first_or_404()
    # Soft delete if it has transaction history, hard delete otherwise
    if product.transaction_items.first() is not None:
        product.is_active = False
        db.session.commit()
        return jsonify({"message": "Product deactivated (has transaction history)."})

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted."})
