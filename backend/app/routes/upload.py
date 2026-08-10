import os
import threading
import uuid
from datetime import datetime

import pandas as pd
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user

from app.extensions import db
from app.models import Product, Customer, Transaction, TransactionItem, ImportLog
from app.utils.pagination import paginate

upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")

# Column names we auto-suggest a mapping for, keyed by our target field.
# Covers common POS/e-commerce exports and the demo Online Retail dataset.
AUTO_MAP_CANDIDATES = {
    "invoice_no": ["invoiceno", "invoice_no", "order_id", "orderid", "invoice"],
    "product_sku": ["stockcode", "sku", "product_id", "productid", "item_code"],
    "product_name": ["description", "product_name", "productname", "item", "product"],
    "quantity": ["quantity", "qty"],
    "unit_price": ["unitprice", "unit_price", "price"],
    "unit_cost": ["unitcost", "unit_cost", "cost"],
    "invoice_date": ["invoicedate", "invoice_date", "order_date", "date"],
    "customer_id": ["customerid", "customer_id"],
    "customer_name": ["customer_name", "customername", "customer"],
    "country": ["country"],
}

# Commit to the database every N processed rows. This is what makes
# progress durable (survives a server restart) and makes partial results
# show up in Analytics immediately, instead of only after 100% completion.
COMMIT_BATCH_SIZE = 250


def _read_dataframe(path, file_type, nrows=None):
    if file_type == "csv":
        return pd.read_csv(path, nrows=nrows, low_memory=False)
    return pd.read_excel(path, nrows=nrows)


def _row_value(row, column_lookup, column_name):
    if not column_name:
        return None
    index = column_lookup.get(column_name)
    if index is None:
        return None
    return row[index]


def _parse_date_or_none(raw_date):
    """Returns a real datetime, or None if the value is missing/unparseable
    (pd.to_datetime silently returns NaT for bad input, which is NOT a real
    datetime and will crash a DB insert if it slips through unchecked)."""
    parsed = pd.to_datetime(raw_date, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.to_pydatetime()


@upload_bp.post("/preview")
@login_required
def preview_upload():
    if "file" not in request.files:
        return jsonify({"errors": {"file": ["No file was uploaded."]}}), 400

    file = request.files["file"]
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ("csv", "xlsx", "xls"):
        return jsonify({"errors": {"file": ["Only CSV and Excel (.xlsx/.xls) files are supported."]}}), 400

    file_type = "csv" if ext == "csv" else "xlsx"
    upload_id = uuid.uuid4().hex
    stored_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"{upload_id}.{ext}")
    file.save(stored_path)

    try:
        full_df = _read_dataframe(stored_path, file_type)
        df = full_df.head(20)
        row_count = len(full_df)
    except Exception as exc:
        os.remove(stored_path)
        return jsonify({"errors": {"file": [f"Couldn't read this file: {exc}"]}}), 400

    columns = list(df.columns.astype(str))

    # Suggest a mapping based on fuzzy column-name matching
    suggested = {}
    normalized = {c.lower().replace(" ", "").replace("_", ""): c for c in columns}
    for target, candidates in AUTO_MAP_CANDIDATES.items():
        for cand in candidates:
            key = cand.replace("_", "")
            if key in normalized:
                suggested[target] = normalized[key]
                break

    preview_rows = df.fillna("").astype(str).to_dict(orient="records")

    return jsonify({
        "upload_id": upload_id,
        "file_name": filename,
        "file_type": file_type,
        "row_count": row_count,
        "columns": columns,
        "preview_rows": preview_rows,
        "suggested_mapping": suggested,
        "target_fields": list(AUTO_MAP_CANDIDATES.keys()),
    })


@upload_bp.post("/commit")
@login_required
def commit_upload():
    data = request.get_json(silent=True) or {}
    upload_id = data.get("upload_id")
    file_name = data.get("file_name", "import")
    file_type = data.get("file_type")
    mapping = data.get("mapping") or {}

    if not upload_id or not file_type:
        return jsonify({"errors": {"upload_id": ["Missing upload reference. Please re-upload the file."]}}), 400
    if "invoice_date" not in mapping or "quantity" not in mapping or "unit_price" not in mapping:
        return jsonify({"errors": {"mapping": ["Date, Quantity, and Unit Price must be mapped."]}}), 400
    if "product_name" not in mapping and "product_sku" not in mapping:
        return jsonify({"errors": {"mapping": ["Map either a Product Name or Product SKU column."]}}), 400

    ext = "csv" if file_type == "csv" else "xlsx"
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"{upload_id}.{ext}")
    if not os.path.exists(path):
        return jsonify({"errors": {"upload_id": ["Upload has expired. Please re-upload the file."]}}), 400

    try:
        row_count = len(_read_dataframe(path, file_type))
    except Exception as exc:
        return jsonify({"errors": {"file": [f"Couldn't read this file: {exc}"]}}), 400

    # Create the ImportLog row up front and commit it immediately, so its id
    # exists in the database right away — the frontend polls THIS row for
    # progress (via GET /upload/progress/<id>), not an in-memory job store.
    # That makes progress durable: even if the server process restarts
    # mid-import, the row (and everything committed before the restart)
    # stays exactly as it was, instead of vanishing with a dead process-local
    # dict.
    import_log = ImportLog(
        user_id=current_user.id, file_name=file_name, file_type=file_type,
        row_count=row_count, status="processing",
    )
    db.session.add(import_log)
    db.session.commit()

    app = current_app._get_current_object()
    user_id = current_user.id
    import_log_id = import_log.id

    def run_import():
        with app.app_context():
            try:
                _do_import(app, user_id, import_log_id, path, file_type, mapping)
            finally:
                if os.path.exists(path):
                    os.remove(path)

    threading.Thread(target=run_import, daemon=True).start()

    return jsonify({"import": import_log.to_dict()}), 202


def _do_import(app, user_id, import_log_id, path, file_type, mapping):
    df = _read_dataframe(path, file_type)
    total_rows = len(df)
    columns = [str(col) for col in df.columns]
    column_lookup = {column: index for index, column in enumerate(columns)}

    import_log = db.session.get(ImportLog, import_log_id)

    existing_invoices = {
        t.invoice_no for t in Transaction.query.filter_by(user_id=user_id) if t.invoice_no
    }
    existing_products = {}
    for product in Product.query.filter_by(user_id=user_id).all():
        if product.sku:
            existing_products[("sku", product.sku)] = product
        if product.name:
            existing_products[("name", product.name)] = product
    existing_customers = {
        customer.name: customer for customer in Customer.query.filter_by(user_id=user_id).all() if customer.name
    }

    product_cache = {}
    customer_cache = {}
    txn_cache = {}
    imported = 0
    skipped = 0
    since_last_commit = 0

    try:
        for row_index, row in enumerate(df.itertuples(index=False, name=None)):
            invoice_no = (
                str(_row_value(row, column_lookup, mapping.get("invoice_no")) or "").strip()
                if mapping.get("invoice_no") else None
            )

            if invoice_no and invoice_no in existing_invoices:
                skipped += 1
                continue

            try:
                qty_raw = _row_value(row, column_lookup, mapping["quantity"])
                price_raw = _row_value(row, column_lookup, mapping["unit_price"])
                if pd.isna(qty_raw) or pd.isna(price_raw):
                    raise ValueError("missing quantity/price")
                qty = int(float(qty_raw))
                unit_price = float(price_raw)
                unit_cost_raw = _row_value(row, column_lookup, mapping.get("unit_cost")) if mapping.get("unit_cost") else 0
                unit_cost = float(unit_cost_raw) if (mapping.get("unit_cost") and not pd.isna(unit_cost_raw)) else 0
            except (ValueError, TypeError):
                skipped += 1
                continue

            if qty == 0:
                skipped += 1
                continue

            raw_date = _row_value(row, column_lookup, mapping["invoice_date"])
            txn_date = _parse_date_or_none(raw_date)
            if txn_date is None:
                # Missing/unparseable date — skip rather than silently
                # writing an invalid date that would crash later at flush.
                skipped += 1
                continue

            sku = str(_row_value(row, column_lookup, mapping.get("product_sku")) or "").strip() if mapping.get("product_sku") else None
            name = str(_row_value(row, column_lookup, mapping.get("product_name")) or "").strip() if mapping.get("product_name") else (sku or "Unnamed Product")
            name = name or "Unnamed Product"
            product_key = sku or name
            product_lookup_key = ("sku", sku) if sku else ("name", name)

            if product_key not in product_cache:
                product = existing_products.get(product_lookup_key)
                if not product:
                    product = Product(
                        user_id=user_id, sku=sku or None, name=name,
                        unit_price=unit_price, unit_cost=unit_cost, stock_quantity=0,
                    )
                    db.session.add(product)
                    db.session.flush()
                    existing_products[product_lookup_key] = product
                product_cache[product_key] = product
            product = product_cache[product_key]

            customer = None
            cust_key = None
            customer_id_value = _row_value(row, column_lookup, mapping.get("customer_id"))
            customer_name_value = _row_value(row, column_lookup, mapping.get("customer_name"))
            if mapping.get("customer_id") and str(customer_id_value or "").strip() and not pd.isna(customer_id_value):
                cust_key = f"id:{customer_id_value}"
            elif mapping.get("customer_name") and str(customer_name_value or "").strip():
                cust_key = f"name:{customer_name_value}"

            if cust_key:
                if cust_key not in customer_cache:
                    cust_name = str(customer_name_value or f"Customer {customer_id_value or ''}").strip()
                    country = str(_row_value(row, column_lookup, mapping.get("country")) or "").strip() if mapping.get("country") else None
                    customer = existing_customers.get(cust_name)
                    if not customer:
                        customer = Customer(user_id=user_id, name=cust_name, country=country or None)
                        db.session.add(customer)
                        db.session.flush()
                        existing_customers[cust_name] = customer
                    customer_cache[cust_key] = customer
                customer = customer_cache[cust_key]

            group_key = invoice_no or f"row-{row_index}"
            if group_key not in txn_cache:
                txn = Transaction(
                    user_id=user_id,
                    customer_id=customer.id if customer else None,
                    invoice_no=invoice_no,
                    transaction_date=txn_date,
                    source="csv_import" if file_type == "csv" else "excel_import",
                    import_log_id=import_log_id,
                )
                db.session.add(txn)
                db.session.flush()
                txn_cache[group_key] = txn
            txn = txn_cache[group_key]

            line_total = qty * unit_price
            line_profit = (unit_price - (unit_cost or float(product.unit_cost or 0))) * qty
            item = TransactionItem(
                transaction_id=txn.id, product_id=product.id,
                quantity=qty, unit_price=unit_price, unit_cost=unit_cost or float(product.unit_cost or 0),
            )
            db.session.add(item)
            txn.subtotal = float(txn.subtotal or 0) + line_total
            txn.profit = float(txn.profit or 0) + line_profit
            txn.total = float(txn.subtotal or 0) - float(txn.discount or 0)
            imported += 1
            since_last_commit += 1

            if since_last_commit >= COMMIT_BATCH_SIZE:
                import_log.imported_count = imported
                import_log.skipped_count = skipped
                db.session.commit()
                since_last_commit = 0

        import_log.imported_count = imported
        import_log.skipped_count = skipped
        import_log.status = "completed"
        db.session.commit()

    except Exception as exc:
        db.session.rollback()
        # Anything already committed in earlier batches is safe and stays —
        # only the current uncommitted batch is lost.
        import_log = db.session.get(ImportLog, import_log_id)
        import_log.status = "failed"
        import_log.error_message = str(exc)[:500]
        import_log.imported_count = imported - since_last_commit
        import_log.skipped_count = skipped
        db.session.commit()


@upload_bp.get("/progress/<int:import_id>")
@login_required
def get_import_progress(import_id):
    import_log = ImportLog.query.filter_by(id=import_id, user_id=current_user.id).first_or_404()
    return jsonify(import_log.to_dict())


@upload_bp.get("/active")
@login_required
def active_import():
    """Any import still processing for this user — lets the frontend resume
    watching an import that was already running before a page refresh."""
    import_log = (
        ImportLog.query.filter_by(user_id=current_user.id, status="processing")
        .order_by(ImportLog.created_at.desc())
        .first()
    )
    return jsonify({"import": import_log.to_dict() if import_log else None})


@upload_bp.get("/history")
@login_required
def import_history():
    query = ImportLog.query.filter_by(user_id=current_user.id).order_by(ImportLog.created_at.desc())
    result = paginate(query)
    result["items"] = [i.to_dict() for i in result["items"]]
    return jsonify(result)


@upload_bp.delete("/<int:import_id>")
@login_required
def undo_import(import_id):
    """Undo an import: deletes every transaction it created and restocks products."""
    import_log = ImportLog.query.filter_by(id=import_id, user_id=current_user.id).first_or_404()

    for txn in import_log.transactions:
        for item in txn.items:
            if item.product:
                item.product.stock_quantity += item.quantity
        db.session.delete(txn)

    import_log.status = "undone"
    db.session.commit()
    return jsonify({"message": "Import undone. All rows it created were removed."})
