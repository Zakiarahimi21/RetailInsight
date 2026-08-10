export default function Pagination({ page, pages, total, onPageChange }) {
  if (!pages || pages <= 1) {
    return (
      <div className="ri-pagination">
        <span>{total} total</span>
      </div>
    );
  }

  return (
    <div className="ri-pagination">
      <span>Page {page} of {pages} · {total} total</span>
      <div className="ri-pagination-btns">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <i className="bi bi-chevron-left" />
        </button>
        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
}
