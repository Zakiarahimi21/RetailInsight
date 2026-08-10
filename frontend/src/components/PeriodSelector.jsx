const OPTIONS = [
  { value: "7d", label: "This Week" },
  { value: "30d", label: "This Month" },
  { value: "90d", label: "Last 90 Days" },
  { value: "365d", label: "This Year" },
  { value: "all", label: "All Time" },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "0.6rem 1rem",
        borderRadius: 999,
        border: "1.5px solid #d9e6e0",
        fontSize: "0.85rem",
        fontWeight: 600,
        background: "var(--ri-white)",
        color: "var(--ri-primary)",
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
