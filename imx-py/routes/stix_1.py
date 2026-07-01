from flask import Blueprint, current_app, request, Response, abort
from werkzeug.exceptions import BadRequest


from controllers.doc_factory import produce_doc, produce_csv, produce_xml

import json

stix_1_bp = Blueprint("stix_1", __name__)

VALID_FORMATS = {"txt", "csv", "xml", "ais", "json"}


@stix_1_bp.post("/stix_1")
def stix_1():

    try:
        if request.is_json:
            payload = request.get_json()
            fmt = payload.get("format")
            data = payload.get("data")
        else:
            fmt = request.form.get("format")
            raw_data = request.form.get("data")

            if not raw_data:
                about(400, description="Missing form field 'data'")

            data = json.loads(raw_data)
    except BadRequest:
        abort(400, description="Request body invalid")

    if not fmt or fmt not in VALID_FORMATS:
        current_app.logger.info("fmt failed VALID_FORMATS")
        abort(400, description="Invalid or missing 'format'")

    if not isinstance(data, list):
        current_app.logger.info("data failed isinstance list")
        abort(400, description="'data' must be a JSON array")

    if fmt == "txt":
        output = produce_doc(data)
        return Response(output, mimetype="text/plain")
    elif fmt == "csv":
        output = produce_csv(data)
        return Response(output, mimetype="text/csv")
    elif fmt in ("xml", "ais"):
        try:
            output = produce_xml(data, fmt)
            return Response(output, mimetype="application/xml")
        except ValueError as e:
            abort(400, description=f"{e}")
    elif fmt == "json":
        output = produce_xml(data, "xml")
        return Response(output, mimetype="application/json")

    current_app.logger.info("unknown error stix_1")
    abort(500, description="Unhandled format")
