// Reveal animation is handled globally; this file is reserved for
// future feature-page-only interactivity (e.g. expandable "learn more" panels).

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-expanded"));
  });
});