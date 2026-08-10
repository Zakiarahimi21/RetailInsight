from datetime import datetime

from app.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    products = db.relationship("Product", backref="category", lazy="dynamic")

    __table_args__ = (
        db.UniqueConstraint("user_id", "name", name="uq_category_per_user"),
    )

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "description": self.description}

    def __repr__(self):
        return f"<Category {self.name}>"
