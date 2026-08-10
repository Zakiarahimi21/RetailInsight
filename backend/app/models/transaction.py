from datetime import datetime

from app.extensions import db


class Transaction(db.Model):
    """An order / sale. Line items live in TransactionItem so a single
    transaction can contain multiple products (matches real POS/e-commerce
    data and the demo Online Retail dataset)."""

    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=True, index=True)

    invoice_no = db.Column(db.String(50), nullable=True, index=True)
    transaction_date = db.Column(db.DateTime, nullable=False, index=True)

    subtotal = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    total = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    profit = db.Column(db.Numeric(14, 2), nullable=False, default=0)

    source = db.Column(db.String(30), default="manual")  # manual | csv_import | excel_import
    import_log_id = db.Column(db.Integer, db.ForeignKey("import_logs.id"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    items = db.relationship(
        "TransactionItem", backref="transaction", lazy="dynamic",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        db.Index("ix_txn_user_date", "user_id", "transaction_date"),
    )

    def recalculate_totals(self) -> None:
        subtotal = sum((item.line_total for item in self.items), 0.0)
        profit = sum((item.line_profit for item in self.items), 0.0)
        self.subtotal = subtotal
        self.total = subtotal - float(self.discount or 0)
        self.profit = profit

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "invoice_no": self.invoice_no,
            "customer": self.customer.name if self.customer else None,
            "transaction_date": self.transaction_date.isoformat(),
            "subtotal": float(self.subtotal),
            "discount": float(self.discount),
            "total": float(self.total),
            "profit": float(self.profit),
            "items": [i.to_dict() for i in self.items],
        }

    def __repr__(self):
        return f"<Transaction {self.invoice_no or self.id}>"


class TransactionItem(db.Model):
    __tablename__ = "transaction_items"

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey("transactions.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)

    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    unit_cost = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    @property
    def line_total(self):
        return float(self.unit_price or 0) * self.quantity

    @property
    def line_profit(self):
        return (float(self.unit_price or 0) - float(self.unit_cost or 0)) * self.quantity

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "product": self.product.name if self.product else None,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "line_total": float(self.line_total),
            "line_profit": float(self.line_profit),
        }
