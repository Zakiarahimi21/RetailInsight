import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <>
      <div className="ri-page-header"><h1>Settings</h1><p>Account and store configuration.</p></div>

      <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
        <h3 style={{ marginTop: 0 }}>Store</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--ri-text-muted)" }}>Store Name</div>
            <div style={{ fontWeight: 600 }}>{user?.store_name}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--ri-text-muted)" }}>Owner</div>
            <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--ri-text-muted)" }}>Role</div>
            <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{user?.role}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--ri-text-muted)" }}>Account Created</div>
            <div style={{ fontWeight: 600 }}>{user?.created_at && new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <p style={{ color: "var(--ri-text-muted)", marginTop: "1rem", marginBottom: 0 }}>
          To edit your store name, full name, or password, head to the Profile page.
        </p>
      </div>

      <div className="ri-card">
        <h3 style={{ marginTop: 0 }}>AI Assistant</h3>
        <p style={{ color: "var(--ri-text-muted)" }}>
          RetailInsight's AI Assistant runs entirely locally through Ollama. If Ollama isn't
          installed or running, the assistant automatically falls back to a rule-based
          engine built on your real data — you'll always get an answer either way.
        </p>
        <p style={{ color: "var(--ri-text-muted)", marginBottom: 0 }}>
          Check current status any time on the AI Assistant page.
        </p>
      </div>
    </>
  );
}
