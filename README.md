# RetailInsight

RetailInsight is a full-stack retail analytics platform designed to help businesses understand their sales, customers, products, inventory, and overall performance through a centralized dashboard.

The platform combines business intelligence, data visualization, forecasting, reporting, and AI-assisted insights to turn retail data into practical business information.

## Key Features

* Interactive dashboard with revenue, sales, profit, orders, and customer insights
* Sales, product, customer, and trend analytics
* Product, category, customer, and transaction management
* CSV and Excel data import with preview and validation
* Revenue and product demand forecasting
* Automated PDF, Excel, and CSV reports
* AI-powered business assistant with local Ollama support and rule-based fallback
* User authentication, password management, and protected application routes
* Responsive interface designed for practical day-to-day business use

## Technology Stack

**Frontend:** React, Vite, React Router, Axios, Bootstrap, Chart.js

**Backend:** Python, Flask, SQLAlchemy, Flask-Migrate, Flask-Login, Flask-WTF, Flask-Limiter

**Database:** MySQL

**Data and Analytics:** Pandas, NumPy, scikit-learn, statsmodels, Prophet

**Reporting:** ReportLab, OpenPyXL

**AI:** Ollama with support for local language models

## Project Structure

```text
RetailInsight/
├── backend/
│   ├── app/
│   ├── migrations/
│   ├── exports/
│   ├── requirements.txt
│   └── run.py
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites

* Python 3.12+
* Node.js 20+
* MySQL 8.x
* npm

### Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` and configure the MySQL database and application settings.

Then run:

```bash
flask db upgrade
python run.py
```

The backend runs by default at:

```text
http://localhost:5000
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

## Forecasting

RetailInsight evaluates multiple forecasting approaches, including Linear Regression, Random Forest, ARIMA, and Prophet. Models are compared using historical data, and the best-performing available model is selected for forecasting.

## AI Assistant

The built-in AI Assistant provides business-oriented insights based on the application's retail data. When Ollama is configured, responses can be generated using a local language model. A rule-based fallback is also available when Ollama is not running.

## Security

The application includes password hashing, session-based authentication, CSRF protection, rate limiting, protected routes, secure cookie configuration, and environment-based configuration for sensitive credentials.

For production deployment, HTTPS, strong secrets, restricted CORS origins, secure database credentials, and appropriate server configuration should be used.

## Authors

**Zakia Rahimi**
**Khatera Nazari**

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full license text.

```
```
