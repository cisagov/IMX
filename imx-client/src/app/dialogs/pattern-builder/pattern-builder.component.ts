import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faSave, faArrowRight, faArrowLeft, faBan, faPlus, faUndo, faTrash } from '@fortawesome/free-solid-svg-icons';
import { StixPattern } from './pattern-builder-deps/stix-pattern';
import { ComparisonExpression } from './pattern-builder-deps/comparison-expression';
import { ObservationExpression } from './pattern-builder-deps/observation-expression';
import { StixService } from 'src/app/stix-service.service';
import { StixExpression } from './pattern-builder-deps/stix-expression';
import { Bundle } from '../../models/bundle';
import { COMPONENT_MAP } from 'src/app/models/component-map';
import { FormModel } from 'src/app/dynamic-form-component/form-model';
import { QuestionBase } from 'src/app/dynamic-form-component/question-base';
import { HashArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-hash-array';
import { OpenVocabArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-ov-array';
import { ProtocolArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-protocol-array';
import { ReferenceArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-reference-array';
import { StringArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-string-array';
import { TooltipStringArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-tooltip-string-array';
import { RefArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-ref-array';
import { HybridArrayQuestion } from 'src/app/dynamic-form-component/question-types/question-hybrid-array';
import { StringDictQuestion } from 'src/app/dynamic-form-component/question-types/question-string-dict';
import { STIX_OBJECTS } from 'src/app/models/stix-objects';
import { GuidedService } from 'src/app/guided.service';

export interface patternBulderData {
    page: number;
}

@Component({
    selector: 'app-pattern-builder',
    templateUrl: './pattern-builder.component.html',
    styleUrls: ['./pattern-builder.component.css'],
    standalone: false,
})
export class PatternBuilderComponent implements OnInit {
    faSave = faSave;
    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faBan = faBan;
    faPlus = faPlus;
    faUndo = faUndo;
    faTrash = faTrash;

    pageSize: number;
    page: number;

    currPropertyName: string = null;
    selectedComparisonOperator: string = '=';
    selectedObservationOperator: string = 'AND';
    validationMessage: string = '';
    propertyNames: string[] = [];

    question: any = {
        readonly: true,
    };
    currObjectPath: any = null;
    comparisonConstant: any = null;

    scoBundleObjectSelected = null;

    filteredBundleObj = [];
    scoBundleObjects = [];
    fullScoBundleObjects = [];
    addedObjects = [];

    selectedStixPatternBuilder: StixPattern = null;
    comparisonExpressions: ComparisonExpression[] = [];
    comparisonExpressionObjectTypes: string[] = [];
    observationExpressions: ObservationExpression[] = [];
    patternExpressions: ObservationExpression[] = [];
    observationExpressionBuilder: ObservationExpression = null;
    observationExpressionError: string = '';
    bundle: Bundle;

    OBSERVATION_EXPRESSION_QUALIFIERS = ['', 'WITHIN', 'REPEATS', 'START'];
    OBSERVATION_EXPRESSION_OPERATORS = ['AND', 'OR', 'FOLLOWEDBY'];
    COMPARISON_EXPRESSION_OPERATORS = ['AND', 'OR'];
    COMPARISON_EXPRESSION_OPERATOR_DIFF = ['OR'];
    COMPARISON_OPERATORS = ['=', '!=', '>', '<', '<=', '>=', 'IN', 'LIKE', 'MATCHES'];
    objectPaths = STIX_OBJECTS[1]['objects'];

    guidedCartSCOItems: any[] = [];

    observedDataObjects = [];
    observedDataObjectSelected = null;
    observedDataObjectsRefs = [];

    selectedCyberObservableObject = null;

    constructor(
        public stixService: StixService,
        private guidedService: GuidedService,
        public dialogRef: MatDialogRef<PatternBuilderComponent>,
        @Inject(MAT_DIALOG_DATA) public data: patternBulderData
    ) {
        this.resetStixPatternBuilder();
    }

    ngOnInit(): void {
        this.bundle = this.stixService.bundle;

        if (this.scoBundleObjects.length === 0) {
            this.objectPaths.forEach((object) => {
                const bundleObj = this.bundle.objects.find((bundleObj) => bundleObj && bundleObj.type === object.type);
                if (bundleObj && !this.scoBundleObjects.some((x) => x.type === object.type)) {
                    let tmpBundleObj = Object.assign({}, bundleObj);
                    tmpBundleObj['displayName'] = object.displayName;
                    this.scoBundleObjects.push(tmpBundleObj);
                } else {
                    this.scoBundleObjects.push(object);
                }
            });

            this.fullScoBundleObjects = [...this.scoBundleObjects];
        }

        this.observedDataObjects = this.bundle.objects.filter((o) => o.type === 'observed-data');

        if (this.stixService.guidedUI) {
            const scoObjects = this.objectPaths.reduce((arr, obj) => {
                arr.push(obj.type);
                return arr;
            }, []);

            for (const page in this.guidedService.cart) {
                const guidedPage = this.guidedService.cart[page];

                for (const type in guidedPage) {
                    const guidedType = guidedPage[type];

                    for (const item of guidedType) {
                        if (scoObjects.includes(item.type)) this.guidedCartSCOItems.push(item);
                    }
                }
            }
        }
    }

    clearObservedDataObj() {
        this.observedDataObjectSelected = null;
        this.observedDataObjectsRefs = [];
        this.scoBundleObjects = [...this.fullScoBundleObjects];
    }

    setObservedDataObj(event: any) {
        if (event.target.value === 'undefined') {
            this.clearObservedDataObj();
        }

        this.observedDataObjectsRefs = [];
        this.observedDataObjectSelected.object_refs.forEach((objRef) => {
            let bundleObj = this.bundle.objects.find((o) => objRef === o.id);
            if (bundleObj) {
                this.observedDataObjectsRefs.push(bundleObj);
            }
        });

        this.observedDataObjectsRefs.forEach((objRef) => {
            for (const key in objRef) {
                if (objRef.hasOwnProperty(key) && key.includes('_ref')) {
                    let bundleObj = this.bundle.objects.find((o) => objRef[key] === o.id);
                    if (bundleObj) {
                        this.observedDataObjectsRefs.push(bundleObj);
                    }
                }
            }
        });

        let tempScoBundleObjects = [];
        this.scoBundleObjects.forEach((scoObj) => {
            if (this.observedDataObjectsRefs.some((o) => o.type === scoObj.type)) {
                tempScoBundleObjects.push(scoObj);
            }
        });
        if (tempScoBundleObjects && tempScoBundleObjects.length > 0) {
            this.scoBundleObjects = [...tempScoBundleObjects];
        }
    }

    /** Add selected comparison expression to the builder view for construction */
    addComparisonExpression(): void {
        this.comparisonExpressions.push(
            new ComparisonExpression(`${this.currObjectPath.type}:${this.currPropertyName}`, this.selectedComparisonOperator, this.comparisonConstant)
        );
        this.addedObjects.push(this.scoBundleObjectSelected.id);
    }

    /**
     * This will add the comparison expression to the array once the user has added the appropriate operators
     *
     * @param comparisonExpression constructed comparison expression
     */
    addComparisonExpressionToObservationExpression(comparisonExpression: StixExpression): void {
        if (!this.observationExpressionBuilder) this.observationExpressionBuilder = new ObservationExpression();

        this.observationExpressionBuilder.addExpression(comparisonExpression);

        this.comparisonExpressionObjectTypes.push(
            comparisonExpression['objectPathValue'].substring(0, comparisonExpression['objectPathValue'].indexOf(':'))
        );
        let currentComparisonExpression = this.observationExpressionBuilder;
        // I think more efficient than using while loop on nextObservation
        for (let i = 0; i < this.comparisonExpressionObjectTypes.length - 2; i++) {
            currentComparisonExpression = currentComparisonExpression.nextObservation!;
        }
        if (
            this.comparisonExpressionObjectTypes.length > 1 &&
            this.comparisonExpressionObjectTypes[this.comparisonExpressionObjectTypes.length - 1] !=
                this.comparisonExpressionObjectTypes[this.comparisonExpressionObjectTypes.length - 2]
        ) {
            currentComparisonExpression.comparisonOperator = 'OR';
        }
    }

    /**
     * Add selected observation expression to the builder view for construction
     */
    addObservationExpression(): void {
        if (this.observationExpressionEnabled()) {
            this.observationExpressions.push(this.observationExpressionBuilder);
        }
    }

    /**
     * Final step - add observation expression to the stix builder for the final qualifiers prior to completion
     *
     * @param observationExpression previously constructed observation expression
     */
    addObservationExpressionToStixPattern(observationExpression: ObservationExpression): void {
        this.selectedStixPatternBuilder = new StixPattern();
        this.selectedStixPatternBuilder.observationExpression = observationExpression;
    }

    /**
     * Add selected observation expression to the builder view for construction
     */
    addPatternExpression(): void {
        this.patternExpressions.push(this.observationExpressionBuilder);
    }

    private buildPropertyNames(question: QuestionBase<any>, baseType: string): string[] {
        let refValues = [];
        // Only include single quotes if the property has a dash ('-') or full stop ('.')
        let formattedQuestion = question.key;
        if (question.key.includes('-') || question.key.includes('.')) formattedQuestion = `'${formattedQuestion}'`;

        if (baseType) formattedQuestion = `${baseType}.${formattedQuestion}`;

        if (this.scoBundleObjectSelected) {
            switch (question.constructor) {
                case HashArrayQuestion: {
                    let typedQuestion = question as HashArrayQuestion;
                    for (let j = 0; j < typedQuestion.hashes.length; j++) {
                        if (this.scoBundleObjectSelected.hashes[typedQuestion.hashes[j]] === undefined) continue;
                        // Only include single quotes if the property has a dash ('-') or full stop ('.')
                        if (typedQuestion.hashes[j].includes('-') || typedQuestion.hashes[j].includes('-'))
                            refValues.push(`${formattedQuestion}.${typedQuestion.hashes[j]}`);
                        else refValues.push(`${formattedQuestion}.${typedQuestion.hashes[j]}`);
                    }

                    break;
                }
                case OpenVocabArrayQuestion:
                case ProtocolArrayQuestion: {
                    let typedQuestion = question as ProtocolArrayQuestion;

                    for (let j = 0; j < typedQuestion.options.length; j++) {
                        if (!this.scoBundleObjectSelected.protocols.includes(typedQuestion.options[j].key)) continue;
                        let formattedOption = typedQuestion.options[j].key;
                        if (formattedOption.includes('-') || formattedOption.includes('.')) formattedOption = `'${formattedOption}'`;

                        refValues.push(`${formattedQuestion}[${j}].${formattedOption}`);
                    }

                    break;
                }
                case ReferenceArrayQuestion:
                case StringArrayQuestion:
                case TooltipStringArrayQuestion: {
                    let typedQuestion = question as TooltipStringArrayQuestion;
                    this.scoBundleObjectSelected[typedQuestion.key].forEach((elem, index) => {
                        refValues.push(`${formattedQuestion}.${elem}`);
                    });

                    break;
                }
                case RefArrayQuestion: {
                    let typedQuestion = question as RefArrayQuestion;
                    for (let j = 0; j < this.scoBundleObjectSelected[typedQuestion.key].length; j++) {
                        let formattedOption = this.scoBundleObjectSelected[typedQuestion.key][j];
                        refValues.push(`${formattedQuestion}.${formattedOption}`);
                    }

                    break;
                }
                case ReferenceArrayQuestion:
                case HybridArrayQuestion: {
                    // No values are in the array so we are using the preselector for all items
                    let typedQuestion = question as HybridArrayQuestion;
                    this.scoBundleObjectSelected[typedQuestion.key].forEach((elem) => {
                        refValues.push(`${formattedQuestion}.${elem}`);
                    });

                    break;
                }
                case StringDictQuestion: {
                    let typedQuestion = question as StringDictQuestion;
                    const currSelected = this.scoBundleObjectSelected[typedQuestion.key];
                    for (const key in currSelected) {
                        refValues.push(`${formattedQuestion}.${key}`);
                    }
                    break;
                }
                default:
                    refValues.push(`${formattedQuestion}`);
            }
        } else {
            refValues.push(`${formattedQuestion}`);
        }
        return refValues;
    }

    cancelModal(): void {
        this.dialogRef.close();
    }

    clickContinue() {
        this.selectedStixPatternBuilder = null;
    }

    deleteExpression(compExpIndex = null, observExpIndex = null, patternExpIndex = null) {
        if (compExpIndex !== null) {
            this.comparisonExpressions.splice(compExpIndex, 1);
            this.addedObjects.splice(compExpIndex, 1);
        }

        if (observExpIndex !== null) {
            this.observationExpressions.splice(observExpIndex, 1);
        }

        if (patternExpIndex !== null) {
            this.patternExpressions.splice(patternExpIndex, 1);
        }
    }

    disableContinue(): boolean {
        switch (this.page) {
            case 1:
                return this.comparisonExpressions.length === 0 && this.observationExpressions.length === 0;
            case 2:
                return this.observationExpressions.length === 0;
            case 3:
                return this.patternExpressions.length === 0;
            default:
                return false;
        }
    }

    disableSaveStixPattern(): boolean {
        if (this.selectedStixPatternBuilder) {
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'START' &&
                (this.selectedStixPatternBuilder.getQualifier.startDate === undefined ||
                    this.selectedStixPatternBuilder.getQualifier.endDate === undefined)
            ) {
                return true;
            }
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'WITHIN' &&
                this.selectedStixPatternBuilder.getQualifier.seconds === undefined
            ) {
                return true;
            }
            if (
                this.selectedStixPatternBuilder.qualifierForDropdown === 'REPEATS' &&
                this.selectedStixPatternBuilder.getQualifier.times === undefined
            ) {
                return true;
            }
        }

        if (this.page == this.pageSize && !this.selectedStixPatternBuilder) {
            return true;
        }

        return false;
    }

    getPropertyNames(): string[] {
        return this.propertyNames;
    }

    mapBundleObjToSCOObj(event) {
        const objectPath = this.objectPaths.find((obj) => obj.type === this.selectedCyberObservableObject.type);
        this.filteredBundleObj = this.bundle.objects.filter((elem) => elem.type === objectPath?.type);

        if (this.stixService.guidedUI) {
            this.guidedCartSCOItems.forEach((elem) => {
                if (elem.type === objectPath.type) {
                    const cleanedElem: any = this.guidedService.cleanItem(elem);
                    delete cleanedElem.cartId;
                    this.guidedService.cleanObject(cleanedElem);
                    this.filteredBundleObj.push(cleanedElem);
                }
            });
        }

        this.scoBundleObjectSelected = this.filteredBundleObj.length === 1 ? this.filteredBundleObj[0] : null;
        this.comparisonConstant = null;
        this.propertyNames = [];
        this.currPropertyName = '';
        this.updatePropertyNames(objectPath);
    }

    set observationQualifierData1(data1: string) {
        this.selectedStixPatternBuilder.setQualifierData(this.selectedStixPatternBuilder.qualifierForDropdown, data1, 1);
    }

    set observationQualifierData2(data2: string) {
        this.selectedStixPatternBuilder.setQualifierData(this.selectedStixPatternBuilder.qualifierForDropdown, data2, 2);
    }

    getComparisonOperator(index: number) {
        if (
            this.comparisonExpressionObjectTypes[index + 1] &&
            this.comparisonExpressionObjectTypes[index] == this.comparisonExpressionObjectTypes[index + 1]
        ) {
            return this.COMPARISON_EXPRESSION_OPERATORS;
        }
        return this.COMPARISON_EXPRESSION_OPERATOR_DIFF;
    }

    observationExpressionEnabled(): boolean {
        let expArr = this.observationExpressionBuilder.getExpressionArray();
        for (let i = 0; i < expArr.length - 1; i++) {
            let exp = expArr[i];
            if (exp.comparisonOperator == 'AND') {
                let typeOne = exp.comparisonExpression['objectPathValue'].substring(0, exp.comparisonExpression['objectPathValue'].indexOf(':'));
                let typeTwo = exp.nextObservation?.comparisonExpression['objectPathValue'].substring(
                    0,
                    exp.nextObservation?.comparisonExpression['objectPathValue'].indexOf(':')
                );
                if (typeOne != typeTwo) {
                    this.observationExpressionError =
                        'All comparison expression operands of an AND observable expression must match the same type of SCO.';
                    return false;
                }
            }
        }
        this.observationExpressionError = '';
        return true;
    }

    populatePropertyNames(): string[] {
        let propertyNames = [];
        if (this.currObjectPath) {
            const currentObject = COMPONENT_MAP.get(this.currObjectPath.type) as FormModel;
            let questions = currentObject.getQuestions();
            for (let i = 0; i < questions.length; i++) {
                if (
                    questions[i].key === 'type' ||
                    questions[i].key === 'id' ||
                    questions[i].key === 'spec_version' ||
                    questions[i].key === 'defanged' ||
                    questions[i].key.includes('_ref') ||
                    (questions[0].value === 'email-message' && questions[i].key === 'body')
                )
                    continue;
                let propertyName = this.buildPropertyNames(questions[i], '')[0];
                if (!propertyNames.includes(propertyName)) {
                    propertyNames = propertyNames.concat(propertyName);
                }
            }
        }
        return propertyNames;
    }

    resetStixPatternBuilder(): void {
        this.page = 1;
        this.pageSize = 4;
        this.selectedStixPatternBuilder = null;
        this.comparisonExpressions = [];
        this.observationExpressions = [];
        this.patternExpressions = [];
        this.observationExpressionBuilder = null;
        this.currObjectPath = null;
        this.comparisonConstant = null;
        this.selectedComparisonOperator = '=';
        this.selectedObservationOperator = 'AND';
        this.validationMessage = '';
        this.scoBundleObjectSelected = null;
    }

    saveStixPattern(): void {
        this.dialogRef.close({ pattern: this.selectedStixPatternBuilder.getDisplayForStixPattern().trim(), addedObjects: this.addedObjects });
    }

    setPropertyNames(): void {
        if (!this.scoBundleObjectSelected) {
            this.propertyNames = this.populatePropertyNames();
            return;
        }

        let propertyNames = [];

        if (this.currObjectPath) {
            const currentObject = COMPONENT_MAP.get(this.currObjectPath.type) as FormModel;
            let questions = currentObject.getQuestions();
            for (let i = 0; i < questions.length; i++) {
                const bundleKey = questions[i].key === 'url_value' ? 'value' : questions[i].key;
                if (this.scoBundleObjectSelected[bundleKey] === undefined) continue;

                if (
                    questions[i].key === 'type' ||
                    questions[i].key === 'id' ||
                    questions[i].key === 'spec_version' ||
                    questions[i].key === 'defanged'
                )
                    continue;

                if (questions[0].value === 'email-message')
                    if (
                        questions[i].key === 'body' ||
                        questions[i].key === 'body_multipart' ||
                        questions[i].key === 'additional_header_fields' ||
                        questions[i].key === 'raw_email_ref'
                    )
                        continue;

                if (questions[0].value === 'windows-registry-key') if (questions[i].key === 'values') continue;

                if (questions[0].value === 'software') if (questions[i].key === 'languages') continue;

                if (questions[0].value !== 'email-message' && questions[i].key.includes('_ref')) continue;

                if (questions[0].value === 'network-traffic')
                    if (questions[i].key === 'start' || questions[i].key === 'end' || questions[i].key === 'is_active') continue;

                let propertyName = this.buildPropertyNames(questions[i], '');
                if (!propertyNames.includes(propertyName)) {
                    propertyNames = propertyNames.concat(propertyName);
                }
            }
        }

        this.propertyNames = propertyNames;
    }

    showSetOperator() {
        if (
            (this.currObjectPath.type === 'ipv4-addr' && this.currPropertyName === 'value') ||
            (this.currObjectPath.type === 'ipv6-addr' && this.currPropertyName === 'value') ||
            (this.currObjectPath.type === 'network-traffic' && this.currPropertyName === 'dst_ref.value') ||
            (this.currObjectPath.type === 'network-traffic' && this.currPropertyName === 'src_ref.value') ||
            (this.currObjectPath.type === 'domain-name' && this.currPropertyName === 'resolves_to_refs.value')
        ) {
            return true;
        }

        return false;
    }

    typeInBundle() {
        return this.currObjectPath ? this.filteredBundleObj.some((x) => x.type === this.currObjectPath.type) : false;
    }

    updateExpressionConstant(event, component = null) {
        if (component !== null) {
            this.scoBundleObjectSelected = component;
        }
        this.setPropertyNames();
        let firstPropertyName = this.currPropertyName,
            secondPropertyName: string;
        if (this.currPropertyName?.includes('.')) {
            [firstPropertyName, secondPropertyName] = this.currPropertyName.split('.');
            if (firstPropertyName.includes('[')) firstPropertyName = firstPropertyName.split('[')[0];
        }

        const firstBundleKey = firstPropertyName === 'url_value' ? 'value' : firstPropertyName;
        if (this.scoBundleObjectSelected[firstBundleKey] === undefined) {
            this.currPropertyName = this.getPropertyNames()[0];
            firstPropertyName = this.currPropertyName;
            secondPropertyName = '';

            if (this.currPropertyName?.includes('.')) {
                [firstPropertyName, secondPropertyName] = this.currPropertyName.split('.');
                if (firstPropertyName.includes('[')) firstPropertyName = firstPropertyName.split('[')[0];
            }
        }

        if (this.scoBundleObjectSelected && firstPropertyName) {
            const resolvedKey = firstPropertyName === 'url_value' ? 'value' : firstPropertyName;
            if (Array.isArray(this.scoBundleObjectSelected[resolvedKey])) {
                this.comparisonConstant = secondPropertyName ? secondPropertyName : JSON.stringify(this.scoBundleObjectSelected[resolvedKey]);
                return;
            }
            const currBundleKey = this.currPropertyName === 'url_value' ? 'value' : this.currPropertyName;
            this.comparisonConstant = secondPropertyName
                ? this.scoBundleObjectSelected[resolvedKey][secondPropertyName]
                : this.scoBundleObjectSelected[currBundleKey];
        }
    }

    updatePropertyNames(objectPath: any): void {
        this.currObjectPath = objectPath;
        this.setPropertyNames();
        let propertyNames = this.getPropertyNames();
        if (propertyNames.length > 1) {
            this.currPropertyName = propertyNames[0];
            const propBundleKey = propertyNames[0] === 'url_value' ? 'value' : propertyNames[0];
            this.comparisonConstant = this.scoBundleObjectSelected[propBundleKey];
        }
    }
}
