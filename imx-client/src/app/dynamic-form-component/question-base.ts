export class QuestionBase<T> {
    value: T | undefined; // Predefined value (if any) for the input
    key: string; // Key in the data structure for the model
    label: string; // Human readable label used on the input
    required: boolean; // Validation - if the input is required
    order: number; // How the field inputs are ordered on the screen
    controlType: string; // Type of form filed
    type: string; // Type of input (i.e. text, number, etc.)
    options: { key: string; value: string }[]; // JSON of options
    arrOptions: string[]; // String array of options
    relString: string; // String used for Relationship and as needed for tracking on a per-question basis
    tooltip: string; // String for tooltips
    target: string; // String to populate dropdown for Hybrid Questions
    qtype: string; // Specifies the type of the encapsulating object
    readonly: boolean; // Whether or not field is readonly
    columnWidth: string; // Bootstrap columns determining how wide the specific input is
    columnOffset: string; // Bootstrap offset determining if a field is offset
    columnProperties: string; // Field used internally within question to combine width & offset
    placeholder: string; // Placeholder for input field
    multiple: boolean; // Used to determine if dropdowns are multiple select
    autoSelectDropdown: boolean;
    allowedRefsMap: string[]; // Map to show which cyber objects can be referenced by which attribute in this object
    allowedRefs: string[]; // Array that provides options that should be shown in the reference dropdown (Different values from allowedRefsMap)
    validatorFn?: Function; // Custom validation function for this question - must return { valid: true/false , errorMessage: 'message to display when validation fails' }
    marginRight: boolean; // If space needed on right for button
    favorite: boolean;
    size: string;
    nonGuidedCol?: string;
    revokedCol?: string;

    constructor(
        options: {
            value?: T;
            key?: string;
            label?: string;
            required?: boolean;
            order?: number;
            controlType?: string;
            type?: string;
            options?: { key: string; value: string }[];
            arrOptions?: string[];
            relString?: string;
            tooltip?: string;
            target?: string;
            qtype?: string;
            readonly?: boolean;
            columnWidth?: string;
            columnOffset?: string;
            placeholder?: string;
            multiple?: boolean;
            validator?: string;
            validatorMessage?: string;
            autoSelectDropdown?: boolean;
            allowedRefsMap?: string[];
            allowedRefs?: string[];
            validatorFn?: Function;
            marginRight?: boolean;
            favorite?: boolean;
            size?: string;
            nonGuidedCol?: string;
            revokedCol?: string;
        } = {}
    ) {
        Object.assign(this, options);
        this.value = options.value;
        this.key = options.key || '';
        this.label = options.label || '';
        this.required = !!options.required;
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
        this.type = options.type || '';
        this.options = options.options || [];
        this.arrOptions = options.arrOptions || [];
        this.relString = options.relString || '';
        this.tooltip = options.tooltip || '';
        this.target = options.target || '';
        this.qtype = options.qtype || '';
        this.readonly = options.readonly || false;
        this.columnWidth = options.columnWidth || 'col-12';
        this.columnOffset = options.columnOffset || '';
        this.columnProperties = this.columnWidth + ' ' + this.columnOffset;
        this.placeholder = options.placeholder || '';
        this.multiple = options.multiple || false;
        this.autoSelectDropdown = options.autoSelectDropdown || false;
        this.allowedRefsMap = options.allowedRefsMap || [];
        this.allowedRefs = options.allowedRefs || [];
        this.validatorFn = options.validatorFn;
        this.marginRight = options.marginRight;
        this.favorite = !!options.favorite;
        this.size = options.size;
        this.nonGuidedCol = options.nonGuidedCol;
        this.revokedCol = options.revokedCol;
    }
}
