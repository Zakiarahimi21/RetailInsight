from flask import request, jsonify
from flask_login import login_required, current_user

from app.services.analytics_service import build_lines_dataframe, resolve_period, pct_change
from app.routes.analytics import analytics_bp

WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@analytics_bp.get("/trends")
@login_required
def sales_trends():
    period = request.args.get("period", "90d")
    start, end, prev_start, prev_end = resolve_period(
        period, request.args.get("date_from"), request.args.get("date_to")
    )

    df = build_lines_dataframe(current_user.id, start, end)
    cur_revenue = round(df["line_total"].sum(), 2) if not df.empty else 0

    if prev_start is not None:
        prev_df = build_lines_dataframe(current_user.id, prev_start, prev_end)
        prev_revenue = round(prev_df["line_total"].sum(), 2) if not prev_df.empty else 0
        change_pct = pct_change(cur_revenue, prev_revenue)
    else:
        # "All Time" has no meaningful prior period to compare against.
        prev_revenue = None
        change_pct = None

    daily_series = []
    moving_avg = []
    heatmap = []

    if not df.empty:
        daily = df.groupby(df["date"].dt.date)["line_total"].sum().sort_index()
        daily_series = [{"date": str(d), "revenue": round(v, 2)} for d, v in daily.items()]

        ma = daily.rolling(window=7, min_periods=1).mean().round(2)
        moving_avg = [{"date": str(d), "moving_avg": v} for d, v in ma.items()]

        # Weekday x week-of-month style heatmap simplified to weekday totals,
        # normalized so the frontend can shade intensity 0-1.
        weekday_totals = df.groupby(df["date"].dt.weekday)["line_total"].sum()
        max_val = weekday_totals.max() or 1
        heatmap = [
            {
                "day": WEEKDAY_NAMES[i],
                "revenue": round(weekday_totals.get(i, 0), 2),
                "intensity": round(weekday_totals.get(i, 0) / max_val, 2),
            }
            for i in range(7)
        ]

    return jsonify({
        "growth": {
            "current_revenue": cur_revenue,
            "previous_revenue": prev_revenue,
            "change_pct": change_pct,
        },
        "daily_revenue": daily_series,
        "moving_average_7d": moving_avg,
        "weekday_heatmap": heatmap,
    })
