import re

from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.extensions import db, csrf, limiter
from app.models import ContactMessage
from app.utils.pagination import paginate

contact_bp = Blueprint("contact", __name__, url_prefix="/api/contact")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@contact_bp.post("")
@csrf.exempt  # public form, no session exists for anonymous visitors
@limiter.limit("5 per hour")
def submit_contact_message():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    subject = (data.get("subject") or "").strip()
    message = (data.get("message") or "").strip()

    errors = {}
    if not name:
        errors["name"] = ["Name is required."]
    if not email or not EMAIL_RE.match(email):
        errors["email"] = ["A valid email is required."]
    if not subject:
        errors["subject"] = ["Subject is required."]
    if not message:
        errors["message"] = ["Message is required."]
    elif len(message) > 5000:
        errors["message"] = ["Message is too long (max 5000 characters)."]

    if errors:
        return jsonify({"errors": errors}), 400

    contact_message = ContactMessage(
        name=name[:150], email=email[:150], subject=subject[:200], message=message,
    )
    db.session.add(contact_message)
    db.session.commit()

    return jsonify({"message": "Your message has been received. We'll get back to you soon."}), 201


@contact_bp.get("")
@login_required
def list_contact_messages():
    query = ContactMessage.query.order_by(ContactMessage.created_at.desc())
    result = paginate(query)
    result["items"] = [m.to_dict() for m in result["items"]]
    result["unread_count"] = ContactMessage.query.filter_by(is_read=False).count()
    return jsonify(result)


@contact_bp.post("/<int:message_id>/mark-read")
@login_required
def mark_read(message_id):
    contact_message = ContactMessage.query.get_or_404(message_id)
    contact_message.is_read = True
    db.session.commit()
    return jsonify({"message": contact_message.to_dict()})
