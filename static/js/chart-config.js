// Chart.js setup for the Dashboard — reads SALES_TREND / CHANNEL_SPLIT
// injected as JSON by templates/dashboard/index.html

document.addEventListener("DOMContentLoaded", () => {
  const styles = getComputedStyle(document.documentElement);
  const forest = styles.getPropertyValue("--forest-700").trim() || "#375534";
  const sage = styles.getPropertyValue("--sage-500").trim() || "#6B9071";
  const sageLight = styles.getPropertyValue("--sage-300").trim() || "#AEC3B0";
  const cream = styles.getPropertyValue("--cream-100").trim() || "#E3EED4";

  const trend = (typeof SALES_TREND !== "undefined" && SALES_TREND.length)
    ? SALES_TREND
    : [ // fallback demo data if the DB isn't connected yet
        { day: "Mon", total: 320 }, { day: "Tue", total: 410 }, { day: "Wed", total: 380 },
        { day: "Thu", total: 460 }, { day: "Fri", total: 540 }, { day: "Sat", total: 610 }, { day: "Sun", total: 470 },
      ];

  const channels = (typeof CHANNEL_SPLIT !== "undefined" && CHANNEL_SPLIT.length)
    ? CHANNEL_SPLIT
    : [
        { channel: "In-store", total: 62 }, { channel: "Online", total: 28 }, { channel: "Phone", total: 10 },
      ];

  const salesCtx = document.getElementById("salesOverviewChart");
  if (salesCtx) {
    new Chart(salesCtx, {
      type: "line",
      data: {
        labels: trend.map((r) => r.day),
        datasets: [{
          label: "Revenue",
          data: trend.map((r) => r.total),
          borderColor: forest,
          backgroundColor: "rgba(107,144,113,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: forest,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { callback: (v) => "$" + v } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  const channelCtx = document.getElementById("channelChart");
  if (channelCtx) {
    new Chart(channelCtx, {
      type: "doughnut",
      data: {
        labels: channels.map((c) => c.channel),
        datasets: [{
          data: channels.map((c) => c.total),
          backgroundColor: [forest, sage, sageLight, cream],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } },
        cutout: "68%",
      },
    });
  }
});