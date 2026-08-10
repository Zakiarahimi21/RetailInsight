from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models import Category

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
@login_required
def list_categories():
    categories = Category.query.filter_by(user_id=current_user.id).order_by(Category.name).all()
    return jsonify({"categories": [c.to_dict() for c in categories]})


@categories_bp.post("")
@login_required
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"errors": {"name": ["Category name is required."]}}), 400

    if Category.query.filter_by(user_id=current_user.id, name=name).first():
        return jsonify({"errors": {"name": ["This category already exists."]}}), 400

    category = Category(user_id=current_user.id, name=name, description=data.get("description"))
    db.session.add(category)
    db.session.commit()
    return jsonify({"category": category.to_dict()}), 201


@categories_bp.put("/<int:category_id>")
@login_required
def update_category(category_id):
    category = Category.query.filter_by(id=category_id, user_id=current_user.id).first_or_404()
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    if name:
        category.name = name
    if "description" in data:
        category.description = data.get("description")

    db.session.commit()
    return jsonify({"category": category.to_dict()})


@categories_bp.delete("/<int:category_id>")
@login_required
def delete_category(category_id):
    category = Category.query.filter_by(id=category_id, user_id=current_user.id).first_or_404()
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted."})
