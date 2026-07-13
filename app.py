from flask import Flask, render_template, request, redirect, url_for, session
from dashboard import dashboard_bp

app = Flask(__name__)
app.secret_key = "change-this-to-something-random"  # move to .env later
app.register_blueprint(dashboard_bp)

@app.route("/")
def home():
    return render_template("pages/home.html")

@app.route("/about")
def about():
    return render_template("pages/about.html")

@app.route("/contact")
def contact():
    return render_template("pages/contact.html")

@app.route("/features")
def features():
    return render_template("pages/features.html")

@app.route("/pricing")
def pricing():
    return render_template("pages/pricing.html")

@app.route("/market-insights")
def market_insights():
    return render_template("pages/market-insights.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        session["user_id"] = 1
        session["role"] = request.form.get("role", "owner")
        return redirect(url_for("dashboard.index"))
    return render_template("pages/login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)