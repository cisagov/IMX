import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormModel } from '../../dynamic-form-component/form-model';
import { QuestionBase } from '../../dynamic-form-component/question-base';
import { ObjectQuestion } from '../../dynamic-form-component/question-types/question-object';
import { COMPONENT_MAP } from '../../models/component-map';
import { Content } from '../../models/content';
import { LANGUAGES } from '../../models/languages';
import { StixService } from '../../stix-service.service';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-contents-dialog',
    templateUrl: './contents-dialog.component.html',
    styleUrls: ['./contents-dialog.component.css'],
    standalone: false,
})
export class ContentsDialogComponent implements OnInit {
    @Input() public inputContent: Content = null;
    @Input() public form: UntypedFormGroup = null;

    component: any;
    componentMap = COMPONENT_MAP;
    contents: any = {};
    contentType: string = '';
    contentValue: string = '';
    currentContent = new Content();
    currentObjectRef = '';
    dictItems = {};
    dictKey: string = '';
    dictValue: string = '';
    errorMessage: string = '';
    isAddingContents: boolean = true;
    isParsingSuccessful: boolean = true;

    faTrash = faTrash;
    faPlus = faPlus;

    fieldNameOptions: QuestionBase<any>[] = [];
    lang: string = '';
    langOptions = LANGUAGES;
    listItems: string[] = [];
    listItemValue: string = '';
    newContents: Content[] = [];
    newaddButton: string = '';
    pristineObjectRefId = '';
    questionLabels: string[] = [];
    subscription: Subscription;
    editIndex: number = null;
    editList = false;

    constructor(
        public stixService: StixService,
        public activeModal: NgbActiveModal
    ) {}

    ngOnInit(): void {
        this.subscription = this.stixService.getData().subscribe((data) => {
            if (data.data) this.currentContent = data.data;

            if (!this.currentContent) this.currentContent = new Content();

            this.editIndex = data.index;
        });

        this.buildFieldNameDropdown();
        this.currentContent.fieldName = '';
        this.currentContent.contentType = '';
    }

    addNewContent(): void {
        this.setCurrentLanguage();
        if (this.stixService.contents.length === 0) {
            this.stixService.contents.push(this.currentContent);
        } else {
            this.stixService.contents.forEach((content, i) => {
                if (content.lang === this.currentContent.lang) this.stixService.contents.splice(i, 1);
            });
            this.stixService.contents.push(this.currentContent);
        }

        this.currentContent = new Content();
        this.currentContent.contentType = 'text';
        this.activeModal.dismiss('Cross click');
    }

    setCurrentLanguage() {
        let langSet = new Set();
        for (let field in this.currentContent.fields) {
            let lang = field.split('] ')[0].replace('[', '').trim();
            langSet.add(lang);
        }
        this.currentContent.lang = [...langSet].join(', ');
    }

    addField(): void {
        if (this.currentContent.contentType === 'list') this.currentContent.contentValue = this.listItems;
        else if (this.currentContent.contentType === 'dict') this.currentContent.contentValue = this.dictItems;

        // Clear Dict & List
        this.dictItems = {};
        this.listItems = [];

        if (this.currentContent.contentType === 'date') this.currentContent.contentValue = this.currentContent.contentValue + '';

        this.currentContent.fields[`[${this.currentContent.lang}] ` + this.currentContent.fieldName] = this.currentContent.contentValue;
        this.currentContent.contentValue = '';
    }

    addOrCancel(): void {
        if (this.isAddingContents) this.buildFieldNameDropdown();
    }

    buildFieldNameDropdown() {
        try {
            let objectRefId = this.form.getRawValue().object_ref;
            objectRefId = objectRefId.substr(0, objectRefId.indexOf('--'));

            let currentFormModel = this.componentMap.get(`${objectRefId}`) as FormModel;
            if (currentFormModel) {
                console.debug(`Found object indicator from object ref ID: ${objectRefId}`);

                const selectedObjRef = this.stixService.bundle.objects.find((obj) => obj.id === this.form.getRawValue().object_ref);
                const existingProperties = Object.keys(selectedObjRef);
                this.fieldNameOptions = currentFormModel.getQuestions().filter((prop) => existingProperties.includes(prop.key));
            }

            // Need to clear previous contents if ID changes
            if (this.pristineObjectRefId && this.pristineObjectRefId !== objectRefId) this.stixService.contents = [];

            this.pristineObjectRefId = objectRefId;
            this.isParsingSuccessful = true;
        } catch (e) {
            console.error(e);
            this.isParsingSuccessful = false;
        }
    }

    deleteContent(deleteContent: Content): void {
        this.stixService.contents = this.stixService.contents.filter((content) => content !== deleteContent);
    }

    getFieldKeys(): string[] {
        return Object.keys(this.currentContent.fields);
    }

    getKeys(obj: {}): string[] {
        return Object.keys(obj);
    }

    addDictItem(): void {
        this.dictItems[this.dictKey] = this.dictValue;
        this.dictKey = '';
        this.dictValue = '';
    }

    addToList(): void {
        this.listItems.push(this.listItemValue);
        this.listItemValue = '';
    }

    updateList(): void {
        this.listItems[this.editIndex] = this.listItemValue;
        this.listItemValue = '';
        this.editList = false;
    }

    editListItem(val: any): void {
        this.listItemValue = this.listItems[val];
        this.editIndex = val;
        this.editList = true;
        document.getElementById('contentValue').focus();
    }

    editDictItem(key: any, val: any): void {
        this.dictKey = key;
        this.dictValue = val;
        document.getElementById('contentValue').focus();
    }

    removeItem(val: any): void {
        if (this.currentContent.contentType === 'list') this.listItems.splice(val, 1);
        else if (this.currentContent.contentType === 'dict') delete this.dictItems[val];
    }

    isAddFieldDisabled(): boolean {
        if (
            !this.currentContent.fieldName ||
            !this.currentContent.lang ||
            this.currentContent.lang.includes(', ') ||
            this.currentContent.fieldName === 'none' ||
            !this.currentContent.contentType
        )
            return true;

        switch (this.currentContent.contentType) {
            case 'text':
            case 'number':
            case 'date':
                return !this.currentContent.contentValue;
            case 'list':
                return this.listItems.length < 1;
            case 'dict':
                return this.getKeys(this.dictItems).length < 1;
            default: {
                // Shouldn't be here ever
                console.warn(`Content Type '${this.currentContent.contentType}' was not found`);
                return false;
            }
        }
    }

    displayField(field: any): string {
        let displayString = '';

        if (field instanceof Array) {
            for (let i = 0; i < field.length; i++) {
                const element = field[i];
                displayString += `${element}, `;
            }
            displayString = `[ ${displayString.slice(0, -2)} ]`;
        } else if (field instanceof Object) {
            for (const key in field) {
                displayString += `${key}: ${field[key]}, `;
            }
            displayString = `{ ${displayString.slice(0, -2)} }`;
        } else displayString = field;

        return displayString;
    }

    isLangDisabled(): boolean {
        return Object.keys(this.currentContent.fields).length > 0;
    }

    editField(field: string): void {
        this.currentContent.lang = field.substring(1, field.indexOf(']'));
        this.currentContent.fieldName = field.substring(field.indexOf(']') + 2);

        let propValue = this.currentContent.fields[field];
        if (propValue instanceof Array) {
            this.currentContent.contentType = 'list';
            this.listItems = propValue;
        } else if (propValue instanceof Object) {
            this.currentContent.contentType = 'dict';
            this.dictItems = propValue;
        } else {
            this.currentContent.contentType = 'text';
            this.currentContent.contentValue = this.displayField(this.currentContent.fields[field]);
        }
        document.getElementById('contentValue').focus();
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

    closeModal() {
        this.setCurrentLanguage();
        this.activeModal.dismiss('Cross click');
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
