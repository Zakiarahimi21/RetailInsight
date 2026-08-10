from flask import Blueprint

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

# Each of these modules adds routes onto analytics_bp via @analytics_bp.get/post
from app.routes.analytics import overview  # noqa: E402,F401
from app.routes.analytics import sales  # noqa: E402,F401
from app.routes.analytics import products  # noqa: E402,F401
from app.routes.analytics import customers  # noqa: E402,F401
from app.routes.analytics import trends  # noqa: E402,F401
