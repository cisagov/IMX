import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { ObjectQuestion } from '../dynamic-form-component/question-types/question-object';
import { COMPONENT_MAP } from '../models/component-map';
import { Content } from '../models/content';
import { LANGUAGES } from '../models/languages';
import { StixService } from '../stix-service.service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-contents',
    templateUrl: './contents.component.html',
    styleUrls: ['./contents.component.css'],
    standalone: false,
})
export class ContentsComponent {
    @Input() currentComponent: FormModel = null;
    @Input() form: UntypedFormGroup = null;

    component: any;
    componentMap = COMPONENT_MAP;
    contents: any = {};
    contentType: string = '';
    contentValue: string = '';
    currentContent = new Content();
    currentObjectRef = '';
    dictItems = [];
    dictKey: string = '';
    dictValue: string = '';
    errorMessage: string = '';
    isAddingContents: boolean = false;
    isParsingSuccessful: boolean = true;
    faTrash = faTrash;
    fieldNameOptions: QuestionBase<any>[] = [];
    lang: string = '';
    langOptions = LANGUAGES;
    listItems: string[] = [];
    listItemValue: string = '';
    newContents: Content[] = [];
    newaddButton: string = '';
    pristineObjectRefId = '';
    questionLabels: string[] = [];

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public stixService: StixService
    ) {}

    addNewContent(): void {
        this.stixService.contents.push(this.currentContent);
        this.currentContent = new Content();
        this.currentContent.contentType = 'text';
    }

    addField(): void {
        if (this.currentContent.contentType === 'list') this.currentContent.contentValue = this.listItems;
        else if (this.currentContent.contentType === 'dict') this.currentContent.contentValue = this.dictItems;

        // Clear Arrays
        this.dictItems = this.listItems = [];

        if (this.currentContent.contentType === 'date') this.currentContent.contentValue = this.currentContent.contentValue + '';

        this.currentContent.fields[this.currentContent.fieldName] = this.currentContent.contentValue;

        this.currentContent.fieldName = this.fieldNameOptions[0].key;
        this.currentContent.contentValue = '';
    }

    addOrCancel(): void {
        this.isAddingContents = !this.isAddingContents;
        this.currentContent = new Content();

        if (this.isAddingContents) this.buildFieldNameDropdown();
    }

    buildFieldNameDropdown() {
        try {
            let objectRefId = this.form.getRawValue().object_ref;
            objectRefId = objectRefId.substr(0, objectRefId.indexOf('--'));

            let currentFormModel = this.componentMap.get(`${objectRefId}`) as FormModel;
            if (currentFormModel) console.debug(`Found object indicator from object ref ID: ${objectRefId}`);

            this.fieldNameOptions = currentFormModel.getQuestions();

            // Need to clear previous contents if ID changes
            if (this.pristineObjectRefId && this.pristineObjectRefId !== objectRefId) this.stixService.contents = [];

            this.pristineObjectRefId = objectRefId;

            if (this.fieldNameOptions.length > 0) {
                this.currentContent.fieldName = this.fieldNameOptions[0].key;
                this.currentContent.contentType = 'text';
            }

            this.isParsingSuccessful = true;
        } catch (e) {
            this.isParsingSuccessful = false;
        }

        // Needed to avoid the expression changed after detected error
        this.changeDetectorRef.detectChanges();
    }

    deleteContent(deleteContent: Content): void {
        this.stixService.contents = this.stixService.contents.filter((content) => content !== deleteContent);
    }

    deleteField(type): void {
        // delete this.currentContent.contents[type];
    }

    getFieldKeys(): string[] {
        return Object.keys(this.currentContent.fields);
    }

    getKeys(obj: {}): string[] {
        return Object.keys(obj);
    }

    addDictItem(): void {
        this.dictItems.push({ key: this.dictKey, value: this.dictValue });
        this.dictKey = '';
        this.dictValue = '';
    }

    addToList(): void {
        this.listItems.push(this.listItemValue);
        this.listItemValue = '';
    }

    removeItem(val: any): void {
        if (this.currentContent.contentType === 'list') this.listItems.splice(val, 1);
        else if (this.currentContent.contentType === 'dict') this.dictItems = this.dictItems.filter((dictItem) => dictItem.key !== val);
    }

    isAddFieldDisabled(): boolean {
        if (!this.currentContent.fieldName || !this.currentContent.lang) return true;

        switch (this.currentContent.contentType) {
            case 'text':
            case 'number':
            case 'date':
                return !this.currentContent.contentValue;
            case 'list':
                return this.listItems.length < 1;
            case 'dict':
                return this.dictItems.length < 1;
            default: {
                // Shouldn't be here ever
                console.warn(`Content Type '${this.currentContent.contentType}' was not found`);
                return false;
            }
        }
    }

    displayField(field: any): string {
        let displayString = '';

        if (field instanceof Array || field instanceof Object) {
            for (let i = 0; i < field.length; i++) {
                const element = field[i];
                if (element instanceof Object) displayString += `{ "Key": "${element.key}", "Value": "${element.value}" },`;
                else displayString += `${element},`;
            }

            displayString = displayString.slice(0, -1);
        } else displayString = field;

        return displayString;
    }

    isLangDisabled(): boolean {
        return Object.keys(this.currentContent.fields).length > 0;
    }

    removeField(field: string): void {
        delete this.currentContent.fields[field];
    }

    isAddDisabled(): boolean {
        if (this.currentObjectRef && this.currentObjectRef !== this.form.getRawValue().object_ref) {
            this.currentObjectRef = this.form.getRawValue().object_ref;
            this.buildFieldNameDropdown();
        } else if (!this.currentObjectRef) this.currentObjectRef = this.form.getRawValue().object_ref;

        return !ObjectQuestion.validatorFn(this.form.getRawValue()).valid;
    }

    getContentsDisplay(content: Content): any {
        return JSON.parse(`{ ${content.toString()} }`);
    }
}
