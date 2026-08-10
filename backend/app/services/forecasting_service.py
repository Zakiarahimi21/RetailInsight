import warnings
from datetime import timedelta

import numpy as np
import pandas as pd

from app.services.analytics_service import build_lines_dataframe

warnings.filterwarnings("ignore")

MIN_DAYS_REQUIRED = 14
BACKTEST_HORIZON = 7


def _daily_revenue_series(user_id, lookback_days=180):
    """Full daily revenue series (gaps filled with 0) for the last N days
    that actually have data, used as the training set for every model."""
    end = pd.Timestamp.utcnow().tz_localize(None)
    start = end - timedelta(days=lookback_days)
    df = build_lines_dataframe(user_id, start, end)

    if df.empty:
        return pd.Series(dtype=float)

    daily = df.groupby(df["date"].dt.date)["line_total"].sum()
    daily.index = pd.to_datetime(daily.index)
    full_index = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    return daily.reindex(full_index, fill_value=0.0)


def _make_features(dates):
    """Turns a DatetimeIndex into numeric features for the ML models:
    day offset from series start, day-of-week, and weekend flag."""
    df = pd.DataFrame({"date": dates})
    df["day_index"] = (df["date"] - df["date"].min()).dt.days
    df["weekday"] = df["date"].dt.weekday
    df["is_weekend"] = (df["weekday"] >= 5).astype(int)
    return df[["day_index", "weekday", "is_weekend"]]


def _fit_predict_linear(train_series, horizon_dates):
    from sklearn.linear_model import LinearRegression

    X = _make_features(train_series.index)
    y = train_series.values
    model = LinearRegression().fit(X, y)

    X_future = _make_features(pd.DatetimeIndex(horizon_dates))
    # day_index must continue from the training series' origin
    X_future["day_index"] = (pd.DatetimeIndex(horizon_dates) - train_series.index.min()).days
    preds = model.predict(X_future)
    return np.clip(preds, 0, None)


def _fit_predict_random_forest(train_series, horizon_dates):
    from sklearn.ensemble import RandomForestRegressor

    X = _make_features(train_series.index)
    y = train_series.values
    model = RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42).fit(X, y)

    X_future = _make_features(pd.DatetimeIndex(horizon_dates))
    X_future["day_index"] = (pd.DatetimeIndex(horizon_dates) - train_series.index.min()).days
    preds = model.predict(X_future)
    return np.clip(preds, 0, None)


def _fit_predict_arima(train_series, horizon_dates):
    from statsmodels.tsa.arima.model import ARIMA

    series = train_series.asfreq("D").fillna(0)
    last_error = None
    for order in [(2, 1, 2), (1, 1, 1), (1, 0, 0)]:
        try:
            model = ARIMA(series, order=order).fit()
            preds = model.forecast(steps=len(horizon_dates))
            return np.clip(preds.values, 0, None)
        except Exception as exc:  # try a simpler order next
            last_error = exc
            continue
    raise RuntimeError(f"ARIMA failed to converge: {last_error}")


def _fit_predict_prophet(train_series, horizon_dates):
    from prophet import Prophet

    df = pd.DataFrame({"ds": train_series.index, "y": train_series.values})
    model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(df)

    future = pd.DataFrame({"ds": horizon_dates})
    forecast = model.predict(future)
    return np.clip(forecast["yhat"].values, 0, None)


MODELS = {
    "linear_regression": _fit_predict_linear,
    "random_forest": _fit_predict_random_forest,
    "arima": _fit_predict_arima,
    "prophet": _fit_predict_prophet,
}


def _mae(actual, predicted):
    return float(np.mean(np.abs(np.array(actual) - np.array(predicted))))


def _generate_insight(series, forecast_series, best_model, confidence):
    recent_avg = float(series.tail(14).mean()) if len(series) >= 14 else float(series.mean())
    forecast_avg = float(np.mean([f["predicted_revenue"] for f in forecast_series]))
    change_pct = round(((forecast_avg - recent_avg) / recent_avg) * 100, 1) if recent_avg else 0

    direction = "increase" if change_pct > 2 else ("decrease" if change_pct < -2 else "stay roughly flat")
    confidence_word = "high" if confidence >= 75 else ("moderate" if confidence >= 50 else "low")

    return (
        f"Based on your recent sales pattern, daily revenue is expected to {direction} "
        f"by about {abs(change_pct)}% over the next period compared to the last 14 days. "
        f"This forecast uses {best_model.replace('_', ' ')} (the best-performing model on "
        f"your recent data) with {confidence_word} confidence ({confidence}%)."
    )


def run_forecast(user_id, horizon_days=30):
    series = _daily_revenue_series(user_id)

    if len(series) < MIN_DAYS_REQUIRED:
        return {
            "status": "insufficient_data",
            "days_available": int(len(series)),
            "days_required": MIN_DAYS_REQUIRED,
        }

    # --- Backtest: hold out the last BACKTEST_HORIZON days, see who predicts them best ---
    backtest_horizon = min(BACKTEST_HORIZON, max(3, len(series) // 5))
    train = series.iloc[:-backtest_horizon]
    holdout = series.iloc[-backtest_horizon:]

    comparison = []
    errors = {}
    for name, fn in MODELS.items():
        try:
            preds = fn(train, holdout.index)
            error = _mae(holdout.values, preds)
            errors[name] = error
            comparison.append({"model": name, "mae": round(error, 2), "available": True})
        except Exception as exc:
            comparison.append({"model": name, "mae": None, "available": False, "reason": str(exc)[:120]})

    if not errors:
        return {"status": "all_models_failed", "comparison": comparison}

    best_model = min(errors, key=errors.get)

    # --- Refit the winning model on the FULL series and forecast forward ---
    future_dates = pd.date_range(series.index.max() + timedelta(days=1), periods=horizon_days, freq="D")
    forecast_values = MODELS[best_model](series, future_dates)

    avg_error = errors[best_model]
    avg_actual = float(holdout.mean()) or 1
    confidence = max(0, round(100 - min(100, (avg_error / avg_actual) * 100), 1))

    forecast_series = [
        {"date": str(d.date()), "predicted_revenue": round(float(v), 2)}
        for d, v in zip(future_dates, forecast_values)
    ]

    actual_series = [{"date": str(d.date()), "revenue": round(float(v), 2)} for d, v in series.items()]

    return {
        "status": "ok",
        "best_model": best_model,
        "confidence_pct": confidence,
        "model_comparison": sorted(comparison, key=lambda c: (c["mae"] is None, c["mae"])),
        "actual_history": actual_series,
        "forecast": forecast_series,
        "predicted_total_revenue": round(sum(f["predicted_revenue"] for f in forecast_series), 2),
        "insight": _generate_insight(series, forecast_series, best_model, confidence),
    }


def run_product_demand_forecast(user_id, horizon_days=30, top_n=6):
    """Lighter-weight per-product forecast: linear trend on daily quantity
    sold per product, used for the 'predicted top products' panel."""
    end = pd.Timestamp.utcnow().tz_localize(None)
    start = end - timedelta(days=90)
    df = build_lines_dataframe(user_id, start, end)

    if df.empty:
        return []

    from sklearn.linear_model import LinearRegression

    results = []
    for product_name, group in df.groupby("product_name"):
        daily = group.groupby(group["date"].dt.date)["quantity"].sum()
        if len(daily) < 5:
            # Not enough history to trend — forecast flat at the recent average
            avg_daily = daily.mean() if len(daily) else 0
            predicted = round(avg_daily * horizon_days)
        else:
            X = np.arange(len(daily)).reshape(-1, 1)
            y = daily.values
            model = LinearRegression().fit(X, y)
            future_X = np.arange(len(daily), len(daily) + horizon_days).reshape(-1, 1)
            predicted = round(max(0, model.predict(future_X).sum()))

        results.append({"product": product_name, "predicted_units": int(predicted)})

    results.sort(key=lambda r: r["predicted_units"], reverse=True)
    return results[:top_n]
