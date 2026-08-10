from datetime import datetime

from app.extensions import db


class ImportLog(db.Model):
    __tablename__ = "import_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(10), nullable=False)  # csv | xlsx
    row_count = db.Column(db.Integer, nullable=False, default=0)
    imported_count = db.Column(db.Integer, nullable=False, default=0)
    skipped_count = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="completed")  # processing | completed | failed | undone
    error_message = db.Column(db.String(500), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    transactions = db.relationship("Transaction", backref="import_log", lazy="dynamic")

    def to_dict(self) -> dict:
        if self.status == "completed":
            percent = 100
        elif self.row_count:
            percent = min(99, round(self.imported_count / self.row_count * 100))
        else:
            percent = 0
        return {
            "id": self.id,
            "file_name": self.file_name,
            "file_type": self.file_type,
            "row_count": self.row_count,
            "imported_count": self.imported_count,
            "skipped_count": self.skipped_count,
            "status": self.status,
            "percent": percent,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
        }
