import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || "", store_name: user?.store_name || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await updateProfile(form);
      setProfileMsg("Profile updated.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwMsg("");
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm);
      setPwMsg("Password changed.");
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (err) {
      setPwErrors(err.response?.data?.errors || {});
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <div className="ri-page-header"><h1>Profile</h1><p>Manage your account details.</p></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
        <div className="ri-card">
          <h3 style={{ marginTop: 0 }}>Account Details</h3>
          {profileMsg && <div className="ri-alert ri-alert-success">{profileMsg}</div>}
          <form onSubmit={saveProfile}>
            <div className="ri-field">
              <label>Full Name</label>
              <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Store Name</label>
              <input value={form.store_name} onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Email</label>
              <input value={user?.email} disabled style={{ background: "#f4f9f6", color: "var(--ri-text-muted)" }} />
            </div>
            <button className="ri-btn ri-btn-primary" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="ri-card">
          <h3 style={{ marginTop: 0 }}>Change Password</h3>
          {pwMsg && <div className="ri-alert ri-alert-success">{pwMsg}</div>}
          <form onSubmit={savePassword}>
            <div className="ri-field">
              <label>Current Password</label>
              <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))} required />
              {pwErrors.current_password && <div className="ri-field-error">{pwErrors.current_password[0]}</div>}
            </div>
            <div className="ri-field">
              <label>New Password</label>
              <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} required />
              {pwErrors.new_password && <div className="ri-field-error">{pwErrors.new_password[0]}</div>}
            </div>
            <div className="ri-field">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm_new_password} onChange={(e) => setPwForm((f) => ({ ...f, confirm_new_password: e.target.value }))} required />
              {pwErrors.confirm_new_password && <div className="ri-field-error">{pwErrors.confirm_new_password[0]}</div>}
            </div>
            <button className="ri-btn ri-btn-primary" disabled={savingPw}>
              {savingPw ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
