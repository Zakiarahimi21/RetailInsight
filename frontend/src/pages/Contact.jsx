import { useState } from "react";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";
import { contactApi } from "../api/resources";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await contactApi.submit(form);
      setSent(true);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      } else if (err.response?.status === 429) {
        setErrors({ general: ["Too many messages sent recently — please try again in a bit."] });
      } else {
        setErrors({ general: ["Something went wrong. Please try again."] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PublicNav />

      <section className="ri-contact-wrap">
        <div className="ri-contact-info">
          <h2>Get In Touch</h2>
          <p>Have questions or need help? We're here for you.</p>

          <div className="ri-contact-info-row">
            <i className="bi bi-envelope" />
            <div>
              <span className="label">Email</span>
              <span className="value">support@retailinsight.local</span>
            </div>
          </div>
          <div className="ri-contact-info-row">
            <i className="bi bi-telephone" />
            <div>
              <span className="label">Phone</span>
              <span className="value">+92 300 1234567</span>
            </div>
          </div>
          <div className="ri-contact-info-row">
            <i className="bi bi-geo-alt" />
            <div>
              <span className="label">Location</span>
              <span className="value">Lahore, Pakistan</span>
            </div>
          </div>

          <span style={{ fontSize: "0.8rem", color: "#a9c7bc" }}>Follow Us</span>
          <div className="ri-contact-socials">
            <a href="#"><i className="bi bi-facebook" /></a>
            <a href="#"><i className="bi bi-twitter" /></a>
            <a href="#"><i className="bi bi-linkedin" /></a>
            <a href="#"><i className="bi bi-instagram" /></a>
          </div>
        </div>

        <div className="ri-contact-form-side">
          <h2>Send a Message</h2>

          {sent ? (
            <div className="ri-alert ri-alert-success">
              Thanks — your message has been received. We'll get back to you soon.
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {errors.general && <div className="ri-alert ri-alert-error">{errors.general[0]}</div>}
              <div className="ri-field">
                <label>Your Name</label>
                <input name="name" value={form.name} onChange={onChange} required />
                {errors.name && <div className="ri-field-error">{errors.name[0]}</div>}
              </div>
              <div className="ri-field">
                <label>Your Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required />
                {errors.email && <div className="ri-field-error">{errors.email[0]}</div>}
              </div>
              <div className="ri-field">
                <label>Subject</label>
                <input name="subject" value={form.subject} onChange={onChange} required />
                {errors.subject && <div className="ri-field-error">{errors.subject[0]}</div>}
              </div>
              <div className="ri-field">
                <label>Your Message</label>
                <textarea name="message" value={form.message} onChange={onChange} required />
                {errors.message && <div className="ri-field-error">{errors.message[0]}</div>}
              </div>
              <button className="ri-btn ri-btn-primary ri-btn-block" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
