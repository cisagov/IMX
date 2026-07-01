from flask import Blueprint, current_app, request
from misp_stix_converter import (
    MISPtoSTIX21Parser,
    InternalSTIX2toMISPParser,
    ExternalSTIX2toMISPParser,
)
import json
from stix2 import parse

misp_stix_bp = Blueprint("misp_stix", __name__)


@misp_stix_bp.post("/misp-to-stix")
def misp_to_stix():
    source = request.get_json()
    parser21 = MISPtoSTIX21Parser()

    if "Event" in source:
        parser21.parse_misp_event(source)
    elif "Object" in source:
        parser21.parse_misp_object(source)
        abort(
            400, description="Currently not equipped to support MISP Object type Object"
        )
    elif "Attribute" in source:
        parser21.parse_misp_attribute(source)
    elif "Galaxy" in source:
        parser21.parse_misp_galaxy(source)
        abort(
            400, description="Currently not equipped to support MISP Object type Galaxy"
        )
    else:
        current_app.logger.info(source)
        abort(400, description="Source does not include known MISP object type")

    current_app.logger.info(parser21.bundle)
    bundle21 = str(parser21.bundle)
    return bundle21


@misp_stix_bp.post("/stix-to-misp")
def stix_to_misp():
    source = request.get_json()

    if not source:
        abort(400, description="Missing JSON Body")

    if "bundle" not in source:
        abort(400, description="Missing Bundle in Body")

    if "title" not in source:
        abort(400, description="Missing Title in Body")

    if "producer" not in source:
        abort(400, description="Missing Producer in Body")

    source_string = json.dumps(source["bundle"])

    bundle = json.loads(source_string)

    parser = (
        InternalSTIX2toMISPParser()
        if 'misp:tool="MISP-STIX-Converter"' in source_string
        else ExternalSTIX2toMISPParser()
    )

    parser.load_stix_bundle(parse(bundle, allow_custom=True))
    misp_event = parser.parse_stix_bundle(
        title=source["title"], producer=source["producer"]
    )
    current_app.logger.info(str(misp_event))

    for misp_event in parser.misp_events:
        current_app.logger.info(f"{misp_event}")

    return str(parser.misp_event.to_json(indent=4))
