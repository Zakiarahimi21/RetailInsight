import os
import uuid

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_login import login_required, current_user

from app.extensions import db
from app.models import ReportLog
from app.services.report_data import build_report_data, REPORT_TYPES
from app.services.report_files import generate_pdf, generate_excel, generate_csv
from app.utils.pagination import paginate

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.get("/types")
@login_required
def report_types():
    return jsonify({"types": [{"key": k, "label": v} for k, v in REPORT_TYPES.items()]})


@reports_bp.post("/generate")
@login_required
def generate_report():
    data = request.get_json(silent=True) or {}
    report_type = data.get("report_type")
    file_format = data.get("format", "pdf")
    period = data.get("period", "30d")

    if report_type not in REPORT_TYPES:
        return jsonify({"errors": {"report_type": ["Unknown report type."]}}), 400
    if file_format not in ("pdf", "xlsx", "csv"):
        return jsonify({"errors": {"format": ["Format must be pdf, xlsx, or csv."]}}), 400

    report_data = build_report_data(
        report_type, current_user.id, period=period,
        date_from=data.get("date_from"), date_to=data.get("date_to"),
    )

    file_id = uuid.uuid4().hex[:10]
    safe_title = REPORT_TYPES[report_type].replace(" ", "_")
    file_name = f"{safe_title}_{file_id}.{file_format}"
    out_path = os.path.join(current_app.config["EXPORT_FOLDER"], file_name)

    if file_format == "pdf":
        generate_pdf(report_data, current_user.store_name, out_path)
    elif file_format == "xlsx":
        generate_excel(report_data, current_user.store_name, out_path)
    else:
        generate_csv(report_data, out_path)

    log = ReportLog(
        user_id=current_user.id, report_type=report_type, file_format=file_format,
        file_name=file_name, file_path=out_path,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"report": log.to_dict()}), 201


@reports_bp.get("/history")
@login_required
def report_history():
    query = ReportLog.query.filter_by(user_id=current_user.id).order_by(ReportLog.created_at.desc())
    result = paginate(query)
    result["items"] = [r.to_dict() for r in result["items"]]
    return jsonify(result)


@reports_bp.get("/<int:report_id>/download")
@login_required
def download_report(report_id):
    log = ReportLog.query.filter_by(id=report_id, user_id=current_user.id).first_or_404()
    directory = os.path.dirname(log.file_path)
    filename = os.path.basename(log.file_path)
    return send_from_directory(directory, filename, as_attachment=True, download_name=log.file_name)


@reports_bp.delete("/<int:report_id>")
@login_required
def delete_report(report_id):
    log = ReportLog.query.filter_by(id=report_id, user_id=current_user.id).first_or_404()
    if os.path.exists(log.file_path):
        os.remove(log.file_path)
    db.session.delete(log)
    db.session.commit()
    return jsonify({"message": "Report deleted."})
