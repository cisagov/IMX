import all_schemas from '../../bundle/schemas.json';

//EXTENSION DEFINITIONS
import extension_schemas from '../../schemas/common/extension-definitions/extension-definitions.json';

//PREDEFINED
import archiveFile from '../../schemas/common/extension-definitions/predefined/stix1x-archive-file.json';

//COMMON
import binary from '../../schemas/common/binary.json';
import bundle from '../../schemas/common/bundle.json';
import core from '../../schemas/common/core.json';
import coc from '../../schemas/common/cyber-observable-core.json';
import dictionary from '../../schemas/common/dictionary.json';
import extDef from '../../schemas/common/extension-definition.json';
import extension from '../../schemas/common/extension.json';
import externalRef from '../../schemas/common/external-reference.json';
import granularMarking from '../../schemas/common/granular-marking.json';
import hashesType from '../../schemas/common/hashes-type.json';
import hex from '../../schemas/common/hex.json';
import identifier from '../../schemas/common/identifier.json';
import killChainPhase from '../../schemas/common/kill-chain-phase.json';
import languageContent from '../../schemas/common/language-content.json';
import markingDefinition from '../../schemas/common/marking-definition.json';
import properties from '../../schemas/common/properties.json';
import timestamp from '../../schemas/common/timestamp.json';
import urlRegex from '../../schemas/common/url-regex.json';


//OBSERVABLE
import artifact from '../../schemas/observables/artifact.json';
import autonomousSystem from '../../schemas/observables/autonomous-system.json';
import directory from '../../schemas/observables/directory.json';
import domainName from '../../schemas/observables/domain-name.json';
import emailAddr from '../../schemas/observables/email-addr.json';
import emailMessage from '../../schemas/observables/email-message.json';
import file from '../../schemas/observables/file.json';
import ipv4Addr from '../../schemas/observables/ipv4-addr.json';
import ipv6Addr from '../../schemas/observables/ipv6-addr.json';
import macAddr from '../../schemas/observables/mac-addr.json';
import mutex from '../../schemas/observables/mutex.json';
import networkTraffic from '../../schemas/observables/network-traffic.json';
import process from '../../schemas/observables/process.json';
import software from '../../schemas/observables/software.json';
import url from '../../schemas/observables/url.json';
import userAccount from '../../schemas/observables/user-account.json';
import windowsRegistryKey from '../../schemas/observables/windows-registry-key.json';
import x509Certificate from '../../schemas/observables/x509-certificate.json';

//SDO
import attackPattern from '../../schemas/sdos/attack-pattern.json';
import campaign from '../../schemas/sdos/campaign.json';
import courseOfAction from '../../schemas/sdos/course-of-action.json';
import grouping from '../../schemas/sdos/grouping.json';
import identity from '../../schemas/sdos/identity.json';
import incident from '../../schemas/sdos/incident.json';
import indicator from '../../schemas/sdos/indicator.json';
import infrastructure from '../../schemas/sdos/infrastructure.json';
import intrusionSet from '../../schemas/sdos/intrusion-set.json';
import location from '../../schemas/sdos/location.json';
import malwareAnalysis from '../../schemas/sdos/malware-analysis.json';
import malware from '../../schemas/sdos/malware.json';
import note from '../../schemas/sdos/note.json';
import observedData from '../../schemas/sdos/observed-data.json';
import opinion from '../../schemas/sdos/opinion.json';
import report from '../../schemas/sdos/report.json';
import threatActor from '../../schemas/sdos/threat-actor.json';
import tool from '../../schemas/sdos/tool.json';
import vulnerability from '../../schemas/sdos/vulnerability.json';

//SRO
import relationship from '../../schemas/sros/relationship.json';
import sighting from '../../schemas/sros/sighting.json';

const Validator = require('jsonschema').Validator;

/**
 * Validates STIX object against appropriate schemas
 * @param object STIX 2.1 Object to be validated against schema
 * @returns Array of errors. If properly structured STIX object with no validation error, errors array will be empty.
 */
export function validateStix(object) {
    let report = { errors: [] };

    const v = new Validator();
    initializeValidator(v);

    if (all_schemas[object.type]) {
        let schema = all_schemas[object.type]; // Locates schema of appropriate type
        if (schema['allOf'].length < 2) {
            // Adds in the common props if they have not already been combined
            if (all_schemas['SDOs_SROs'].includes(object.type))
                schema['allOf'] = (all_schemas['common_props'] as unknown as (typeof schema)['allOf']).concat(schema['allOf']);
            else if (all_schemas['SCOs'].includes(object.type))
                //Really just a sanity check
                schema['allOf'] = (all_schemas['sco_common_props'] as unknown as (typeof schema)['allOf']).concat(schema['allOf']);
        }

        validate(object, schema, report, v);
    }

    const extensionResult = validateExtension(object, v);

    if (extensionResult.errors) {
        report.errors = [...report.errors, ...extensionResult.errors]
    }

    return report;
}


/**
 * Validates STIX Object against extension-definition specific schemas.
 * @param object STIX 2.1 Object to be validated against schema
 * @returns Array of errors. If properly structured STIX object with no validation error, errors array will be empty.
 */
export function validateExtension(object, v = null) {
    let report = { errors: [] }

    if (v == null) {
        v = new Validator();

        initializeValidator(v);
    }

    if (object.extensions) {
        for (const extId in object.extensions) {
            if (extension_schemas[extId])
                validate(object, extension_schemas[extId], report, v)
        }
    }

    return report;
}

/**
 * Helper function to validate STIX Object to specific schema, and cocatenates the errors to previous report object in-place.
 * @param object STIX 2.1 Object to be validated against schema
 * @param schema Schema to validate
 * @param report the Report object to be modified in-place
 */
function validate(object, schema, report, v) {

    const validateResult = v.validate(object, schema);

    if (validateResult.errors) {
        report.errors = [...report.errors, ...validateResult.errors];
    }
}

/**
 * Add default STIX object schemas to the validator object.
 * @param v Validator class to add Schemas to
 */
function initializeValidator(v) {
    //EXTENSIONS
    for (const key in extension_schemas) {
        const schema = extension_schemas[key];

        v.addSchema(schema, schema['$id']);
    }

    //PREDEFINED
    addSchema(v, archiveFile);

    //COMMON
    addSchema(v, binary)
    addSchema(v, bundle)
    addSchema(v, core)
    addSchema(v, coc)
    addSchema(v, dictionary)
    addSchema(v, extDef)
    addSchema(v, extension)
    addSchema(v, externalRef)
    addSchema(v, granularMarking)
    addSchema(v, hashesType)
    addSchema(v, hex)
    addSchema(v, identifier)
    addSchema(v, killChainPhase)
    addSchema(v, languageContent)
    addSchema(v, markingDefinition)
    addSchema(v, properties)
    addSchema(v, timestamp)
    addSchema(v, urlRegex)

    //OBSERVABLES
    addSchema(v, artifact)
    addSchema(v, autonomousSystem)
    addSchema(v, directory)
    addSchema(v, domainName)
    addSchema(v, emailAddr)
    addSchema(v, emailMessage)
    addSchema(v, file)
    addSchema(v, ipv4Addr)
    addSchema(v, ipv6Addr)
    addSchema(v, macAddr)
    addSchema(v, mutex)
    addSchema(v, networkTraffic)
    addSchema(v, process)
    addSchema(v, software)
    addSchema(v, url)
    addSchema(v, userAccount)
    addSchema(v, windowsRegistryKey)
    addSchema(v, x509Certificate)


    //SDOS
    addSchema(v, attackPattern)
    addSchema(v, campaign)
    addSchema(v, courseOfAction)
    addSchema(v, grouping)
    addSchema(v, identity)
    addSchema(v, incident)
    addSchema(v, indicator)
    addSchema(v, infrastructure)
    addSchema(v, intrusionSet)
    addSchema(v, location)
    addSchema(v, malwareAnalysis)
    addSchema(v, malware)
    addSchema(v, note)
    addSchema(v, observedData)
    addSchema(v, opinion)
    addSchema(v, report)
    addSchema(v, threatActor)
    addSchema(v, tool)
    addSchema(v, vulnerability)

    //SROS
    addSchema(v, relationship)
    addSchema(v, sighting)
}

function addSchema(v, schema) {
    v.addSchema(schema, schema['$id']);
}
