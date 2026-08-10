export default function Modal({ title, onClose, children }) {
  return (
    <div className="ri-modal-backdrop" onClick={onClose}>
      <div className="ri-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
