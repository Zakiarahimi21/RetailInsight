import enum
from datetime import datetime

from flask import current_app
from flask_login import UserMixin
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


class UserRole(enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    store_name = db.Column(db.String(150), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.ADMIN, nullable=False)

    is_active_account = db.Column(db.Boolean, default=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)

    # Relationships (populated in later stages as models are added)
    products = db.relationship("Product", backref="owner", lazy="dynamic")
    customers = db.relationship("Customer", backref="owner", lazy="dynamic")
    transactions = db.relationship("Transaction", backref="owner", lazy="dynamic")
    categories = db.relationship("Category", backref="owner", lazy="dynamic")

    # --- Flask-Login required property ---
    def get_id(self):
        return str(self.id)

    @property
    def is_active(self):
        return self.is_active_account

    # --- Password helpers ---
    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    # --- Token helpers (email verification / password reset) ---
    def _serializer(self) -> URLSafeTimedSerializer:
        return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

    def get_reset_token(self) -> str:
        return self._serializer().dumps(self.email, salt="password-reset")

    @staticmethod
    def verify_reset_token(token: str, max_age: int = 3600):
        try:
            email = User._static_serializer().loads(
                token, salt="password-reset", max_age=max_age
            )
        except Exception:
            return None
        return User.query.filter_by(email=email).first()

    @staticmethod
    def _static_serializer() -> URLSafeTimedSerializer:
        return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "store_name": self.store_name,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role.value,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.email}>"
