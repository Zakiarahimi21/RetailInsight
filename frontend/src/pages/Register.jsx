import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  store_name: "",
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  agree_terms: false,
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setErrors(apiErrors || { general: ["Something went wrong. Please try again."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      heading="Create Your Account"
      subtext="Start your journey with RetailInsight — set up your store in under two minutes."
      icon="bi-bag-check"
    >
      <h2>Create Your Account</h2>
      <p>Start your journey with RetailInsight</p>

      {errors.general && <div className="ri-alert ri-alert-error">{errors.general[0]}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="ri-field">
          <label htmlFor="store_name">Store Name</label>
          <input
            id="store_name"
            name="store_name"
            placeholder="Enter your store name"
            value={form.store_name}
            onChange={onChange}
            required
          />
          {errors.store_name && <div className="ri-field-error">{errors.store_name[0]}</div>}
        </div>

        <div className="ri-field">
          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={onChange}
            required
          />
          {errors.full_name && <div className="ri-field-error">{errors.full_name[0]}</div>}
        </div>

        <div className="ri-field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={onChange}
            required
          />
          {errors.email && <div className="ri-field-error">{errors.email[0]}</div>}
        </div>

        <div className="ri-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={onChange}
            required
          />
          {errors.password && <div className="ri-field-error">{errors.password[0]}</div>}
        </div>

        <div className="ri-field">
          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            placeholder="Confirm your password"
            value={form.confirm_password}
            onChange={onChange}
            required
          />
          {errors.confirm_password && (
            <div className="ri-field-error">{errors.confirm_password[0]}</div>
          )}
        </div>

        <label className="ri-auth-checkbox">
          <input
            type="checkbox"
            name="agree_terms"
            checked={form.agree_terms}
            onChange={onChange}
          />
          I agree to the Terms & Conditions
        </label>
        {errors.agree_terms && <div className="ri-field-error">{errors.agree_terms[0]}</div>}

        <button className="ri-btn ri-btn-primary ri-btn-block" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="ri-auth-footer-link">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </AuthLayout>
  );
}
