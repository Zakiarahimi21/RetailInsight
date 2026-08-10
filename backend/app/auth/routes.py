from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from werkzeug.datastructures import MultiDict

from app.extensions import db, mail, limiter, csrf
from app.models import User, UserRole
from app.auth.forms import (
    RegisterForm,
    LoginForm,
    ForgotPasswordForm,
    ResetPasswordForm,
    ChangePasswordForm,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _form_from_json(form_class):
    """Build a Flask-WTF form from a JSON request body (CSRF is validated
    separately via the X-CSRFToken header + double-submit cookie, so we
    skip the form's built-in CSRF field check here)."""
    data = request.get_json(silent=True) or {}
    return form_class(formdata=MultiDict(data), meta={"csrf": False})


@auth_bp.get("/csrf-token")
def get_csrf_token():
    from flask_wtf.csrf import generate_csrf
    return jsonify({"csrf_token": generate_csrf()})


@auth_bp.post("/register")
@csrf.exempt  # no session exists yet pre-auth, so no CSRF to protect
@limiter.limit("10 per hour")
def register():
    form = _form_from_json(RegisterForm)
    if not form.validate():
        return jsonify({"errors": form.errors}), 400

    user = User(
        store_name=form.store_name.data.strip(),
        full_name=form.full_name.data.strip(),
        email=form.email.data.lower().strip(),
        role=UserRole.ADMIN,  # first user for a store is the admin/owner
    )
    user.set_password(form.password.data)

    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify({"message": "Account created.", "user": user.to_dict()}), 201


@auth_bp.post("/login")
@csrf.exempt  # no session exists yet pre-auth, so no CSRF to protect
@limiter.limit("15 per hour")
def login():
    form = _form_from_json(LoginForm)
    if not form.validate():
        return jsonify({"errors": form.errors}), 400

    user = User.query.filter_by(email=form.email.data.lower().strip()).first()

    if user is None or not user.check_password(form.password.data):
        return jsonify({"errors": {"email": ["Invalid email or password."]}}), 401

    if not user.is_active_account:
        return jsonify({"errors": {"email": ["This account has been deactivated."]}}), 403

    login_user(user, remember=bool(form.remember_me.data))
    user.last_login_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Logged in.", "user": user.to_dict()})


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out."})


@auth_bp.get("/me")
@login_required
def me():
    return jsonify({"user": current_user.to_dict()})


@auth_bp.post("/forgot-password")
@csrf.exempt  # no session exists yet pre-auth, so no CSRF to protect
@limiter.limit("5 per hour")
def forgot_password():
    form = _form_from_json(ForgotPasswordForm)
    if not form.validate():
        return jsonify({"errors": form.errors}), 400

    user = User.query.filter_by(email=form.email.data.lower().strip()).first()

    # Always return success (don't leak whether an email is registered)
    if user:
        token = user.get_reset_token()
        reset_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password/{token}"
        try:
            msg = Message(
                subject="Reset your RetailInsight password",
                recipients=[user.email],
                body=(
                    f"Hi {user.full_name},\n\n"
                    f"Click the link below to reset your RetailInsight password. "
                    f"This link expires in 1 hour.\n\n{reset_url}\n\n"
                    f"If you didn't request this, you can ignore this email."
                ),
            )
            mail.send(msg)
        except Exception as exc:  # mail server not configured yet, etc.
            current_app.logger.warning("Could not send reset email: %s", exc)

    return jsonify({"message": "If that email exists, a reset link has been sent."})


@auth_bp.post("/reset-password/<token>")
@csrf.exempt  # no session exists yet pre-auth, so no CSRF to protect
@limiter.limit("10 per hour")
def reset_password(token):
    user = User.verify_reset_token(token, max_age=current_app.config["RESET_TOKEN_MAX_AGE"])
    if user is None:
        return jsonify({"errors": {"token": ["This reset link is invalid or has expired."]}}), 400

    form = _form_from_json(ResetPasswordForm)
    if not form.validate():
        return jsonify({"errors": form.errors}), 400

    user.set_password(form.password.data)
    db.session.commit()
    return jsonify({"message": "Password has been reset. You can now log in."})


@auth_bp.put("/profile")
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}

    store_name = (data.get("store_name") or "").strip()
    full_name = (data.get("full_name") or "").strip()

    if store_name:
        current_user.store_name = store_name
    if full_name:
        current_user.full_name = full_name

    db.session.commit()
    return jsonify({"user": current_user.to_dict()})


@auth_bp.post("/change-password")
@login_required
def change_password():
    form = _form_from_json(ChangePasswordForm)
    if not form.validate():
        return jsonify({"errors": form.errors}), 400

    if not current_user.check_password(form.current_password.data):
        return jsonify({"errors": {"current_password": ["Current password is incorrect."]}}), 400

    current_user.set_password(form.new_password.data)
    db.session.commit()
    return jsonify({"message": "Password changed successfully."})
