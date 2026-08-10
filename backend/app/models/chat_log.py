from datetime import datetime

from app.extensions import db


class ChatLog(db.Model):
    __tablename__ = "chat_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    role = db.Column(db.String(10), nullable=False)  # user | assistant
    message = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(20), nullable=True)  # ollama | rule_based (assistant messages only)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "role": self.role,
            "message": self.message,
            "source": self.source,
            "created_at": self.created_at.isoformat(),
        }
