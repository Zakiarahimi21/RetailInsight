from flask import render_template, session, redirect, url_for, request, flash

from dashboard import dashboard_bp

@dashboard_bp.route("/settings", methods=["GET", "POST"])
def settings():
    if "user_id" not in session:
        return redirect(url_for("login"))

    if session.get("role") != "owner":
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        # Placeholder: persist to DB (users table) in a real implementation
        pass

    return render_template("dashboard/settings.html", role=session.get("role"))