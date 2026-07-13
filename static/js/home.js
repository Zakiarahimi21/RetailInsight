// Home page interactivity — testimonial carousel

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".testimonial-slide");
  const dots = document.querySelectorAll(".dot");
  let current = 0;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    current = index;
  }

  dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i)));

  if (slides.length) {
    setInterval(() => showSlide((current + 1) % slides.length), 5000);
  }

  // Newsletter form (footer) — swap the URL for your Formspree/Web3Forms endpoint
  const newsletterForm = document.querySelector("[data-newsletter-form]");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = newsletterForm.querySelector("button");
      const original = btn.textContent;
      btn.textContent = "Subscribed ✓";
      newsletterForm.reset();
      setTimeout(() => (btn.textContent = original), 2500);
    });
  }
});