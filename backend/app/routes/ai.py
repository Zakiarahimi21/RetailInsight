from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models import ChatLog
from app.services.ai_assistant import answer_question, ollama_status

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.get("/status")
@login_required
def status():
    return jsonify(ollama_status())


@ai_bp.get("/history")
@login_required
def history():
    logs = (
        ChatLog.query.filter_by(user_id=current_user.id)
        .order_by(ChatLog.created_at.asc())
        .limit(100)
        .all()
    )
    return jsonify({"messages": [l.to_dict() for l in logs]})


@ai_bp.post("/ask")
@login_required
def ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("message") or "").strip()
    if not question:
        return jsonify({"errors": {"message": ["Please enter a question."]}}), 400

    db.session.add(ChatLog(user_id=current_user.id, role="user", message=question))

    result = answer_question(current_user.id, question)

    db.session.add(ChatLog(
        user_id=current_user.id, role="assistant",
        message=result["response"], source=result["source"],
    ))
    db.session.commit()

    return jsonify(result)
