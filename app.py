from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = "change-this-to-something-random"  # move to .env later

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
    return render_template("pages/features.html")  # comes in Part 2

@app.route("/pricing")
def pricing():
    return render_template("pages/pricing.html")  # comes in Part 2

@app.route("/market-insights")
def market_insights():
    return render_template("pages/market-insights.html")  # comes in Part 2

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Placeholder auth — Person B will replace with real DB check in auth/routes.py
        session["user_id"] = 1
        session["role"] = request.form.get("role", "owner")
        return redirect(url_for("home"))
    return render_template("pages/login.html")

if __name__ == "__main__":
    app.run(debug=True)