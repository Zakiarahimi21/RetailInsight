from datetime import datetime

from app.extensions import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True, index=True)

    sku = db.Column(db.String(80), nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    unit_cost = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, default=10)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction_items = db.relationship("TransactionItem", backref="product", lazy="dynamic")

    @property
    def is_low_stock(self) -> bool:
        return self.stock_quantity <= self.reorder_level

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "category": self.category.name if self.category else None,
            "unit_price": float(self.unit_price),
            "unit_cost": float(self.unit_cost),
            "stock_quantity": self.stock_quantity,
            "reorder_level": self.reorder_level,
            "is_low_stock": self.is_low_stock,
            "is_active": self.is_active,
        }

    def __repr__(self):
        return f"<Product {self.name}>"
