export const CONSTANT_TYPES = [
    { displayName: 'boolean', inputType: 'boolean', comparableDataTypes: ['boolean'], validator: null },
    { displayName: 'binary', inputType: 'binary', comparableDataTypes: ['binary', 'hex', 'string'], validator: null },
    { displayName: 'hex', inputType: 'text', comparableDataTypes: ['binary', 'hex', 'string'], validator: null },
    { displayName: 'integer', inputType: 'number', comparableDataTypes: ['integer', 'float'], validator: null },
    { displayName: 'float', inputType: 'number', comparableDataTypes: ['integer', 'float'], validator: null },
    { displayName: 'string', inputType: 'text', comparableDataTypes: ['string', 'binary', 'hex'], validator: null },
    { displayName: 'timestamp', inputType: 'timestamp', comparableDataTypes: ['timestamp'], validator: null },
];
