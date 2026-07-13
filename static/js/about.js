// Optional: staggered fade-in for timeline items beyond the default .reveal behavior
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".timeline-item");
  items.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.1}s`;
  });
});