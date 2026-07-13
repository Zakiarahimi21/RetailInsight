// Contact form — wire this endpoint to your Formspree or Web3Forms form ID
const CONTACT_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending...";
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        status.textContent = "Thanks — we'll reply within a day.";
        form.reset();
      } else {
        status.textContent = "Something went wrong. Try emailing us directly.";
      }
    } catch (err) {
      status.textContent = "Network error — please try again.";
    }
  });
});