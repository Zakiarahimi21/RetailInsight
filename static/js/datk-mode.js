// Dark mode toggle — persists via data-theme attribute + in-memory state.
// Note: this app avoids localStorage per artifact/browser-storage rules elsewhere,
// but in your own Flask deployment (outside Claude.ai) localStorage is safe to use —
// swap the marked lines below to persist across page loads/sessions.

(function () {
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    // window.localStorage.setItem("ri-theme", theme); // ← enable in your real deployment
  }

  document.addEventListener("DOMContentLoaded", () => {
    // const saved = window.localStorage.getItem("ri-theme"); // ← enable in your real deployment
    // if (saved) applyTheme(saved);

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") || "light";
        applyTheme(current === "light" ? "dark" : "light");
      });
    });
  });
})();