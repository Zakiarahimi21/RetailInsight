// Multi-language toggle — swaps text on elements with [data-i18n="key"]

let currentLang = "en";
let translations = {};

async function loadTranslations() {
  const res = await fetch("/static/translations.json");
  translations = await res.json();
}

function applyLanguage(lang) {
  currentLang = lang;
  const dict = translations[lang] || {};
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.langToggle === lang);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations();
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.langToggle));
  });
});