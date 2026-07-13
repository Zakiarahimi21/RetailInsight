// Calls a Flask route that hits the AI API and returns a one-sentence trend summary.
// Until that route exists, this falls back to a locally computed insight from SALES_TREND.

document.addEventListener("DOMContentLoaded", async () => {
  const el = document.querySelector("[data-ai-insight-text]");
  if (!el) return;

  try {
    const res = await fetch("/dashboard/api/insight");
    if (res.ok) {
      const data = await res.json();
      el.textContent = data.insight;
      return;
    }
    throw new Error("Insight endpoint not available yet");
  } catch (err) {
    // Local fallback so the card never looks broken during development
    const trend = typeof SALES_TREND !== "undefined" ? SALES_TREND : [];
    if (trend.length >= 2) {
      const first = trend[0].total;
      const last = trend[trend.length - 1].total;
      const change = (((last - first) / (first || 1)) * 100).toFixed(1);
      el.textContent = change >= 0
        ? `Revenue trended up ${change}% across the last ${trend.length} days — your strongest days were mid-to-late week.`
        : `Revenue dipped ${Math.abs(change)}% across the last ${trend.length} days — worth checking stock levels or promotions.`;
    } else {
      el.textContent = "Connect your database to see a live weekly trend summary here.";
    }
  }
});