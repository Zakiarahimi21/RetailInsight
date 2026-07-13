// Shared dashboard interactivity — sidebar/table behaviors

document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.querySelector("[data-export-trigger]");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      // Actual PDF/Excel generation lives on the Reports page (jsPDF/SheetJS).
      window.location.href = "/dashboard/reports";
    });
  }

  // Sortable-feeling table rows (visual only — swap for real sort if needed)
  document.querySelectorAll(".dash-table th").forEach((th) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => th.classList.toggle("is-sorted"));
  });
});