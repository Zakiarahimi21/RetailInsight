"""
Person B's login/signup logic — sets session['user_id'] and session['role']
using the same names Person A's dashboard routes check for.
"""

from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from dashboard.db import fetch_one, get_connection

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        form_type = request.form.get("form_type", "login")

        if form_type == "signup":
            shop_name = request.form["shop_name"]
            email = request.form["email"]
            password = request.form["password"]
            role = request.form.get("role", "owner")

            existing = fetch_one("SELECT id FROM users WHERE email = %s", (email,))
            if existing:
                flash("An account with that email already exists.")
                return redirect(url_for("login"))

            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (shop_name, email, password_hash, role) VALUES (%s,%s,%s,%s)",
                (shop_name, email, generate_password_hash(password), role),
            )
            conn.commit()
            user_id = cursor.lastrowid
            cursor.close()
            conn.close()

            session["user_id"] = user_id
            session["role"] = role
            return redirect(url_for("dashboard.index"))

        # form_type == "login"
        email = request.form["email"]
        password = request.form["password"]
        user = fetch_one("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))

        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            session["role"] = user["role"]
            return redirect(url_for("dashboard.index"))

        flash("Incorrect email or password.")
        return redirect(url_for("login"))

    return render_template("pages/login.html")


@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))