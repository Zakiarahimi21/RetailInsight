from datetime import datetime

from app.extensions import db


class ReportLog(db.Model):
    __tablename__ = "report_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    report_type = db.Column(db.String(40), nullable=False)  # sales | monthly_sales | customer | inventory | executive
    file_format = db.Column(db.String(10), nullable=False)  # pdf | xlsx | csv
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "report_type": self.report_type,
            "file_format": self.file_format,
            "file_name": self.file_name,
            "created_at": self.created_at.isoformat(),
        }
