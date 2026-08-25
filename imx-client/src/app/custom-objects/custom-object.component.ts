import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { Content } from '../models/content';
import { StixService } from '../stix-service.service';
import { EnvService } from '../env-service/env.service';
import { faTrash, faPlus, faEdit, faBan, faFileImport, faPlusCircle, faStickyNote } from '@fortawesome/free-solid-svg-icons';

import { LANGUAGES } from '../models/languages';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { v4 as uuid } from 'uuid';
import { SDO_SRO } from './S[DR]O_Common_Properties';
import { SCO } from './SCO_Common_Properties';
import { NoteDialogComponent } from '../add-component/note-dialog-component/note-dialog-component.component';
import { db } from '../db.service';

@Component({
    selector: 'app-custom-object',
    templateUrl: './custom-object.component.html',
    styleUrls: ['./custom-object.component.css'],
    standalone: false,
})
export class CustomObjectComponent implements OnInit {
    @Input() objectPropertyTypeSelectionInput: any;
    @Input() queryParams: any;

    faPlus = faPlus;
    faEdit = faEdit;
    faPlusCircle = faPlusCircle;
    faBan = faBan;
    faFileImport = faFileImport;
    faNote = faStickyNote;

    contents: any = {};
    contentType: string = '';
    contentValue: string = '';
    currentContent = new Content();
    currentObjectRef = '';
    dictItems = [];
    dictKey: string = '';
    dictValue: string = '';
    errorMessage: string = '';
    fieldNameOptions: QuestionBase<any>[] = [];
    lang: string = '';
    langOptions = LANGUAGES;
    listItems: string[] = [];
    listItemValue: string = '';

    isLoadingItem = false;

    //Custom Object Creation
    newObj = false;
    newObjTypes: string[][] = [];
    parent = '';
    uuid = '--' + uuid();
    displayType = '';
    extTypes: string[] = ['new-sdo', 'new-sro', 'new-sco'];

    question = { key: 'question' };
    modalRef: any;

    objectRegex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
    sdo_sro_props: string[] = SDO_SRO;
    sco_props: string[] = SCO;

    currentObject = new Map();
    customObjType = ''; // new-sdo/sro/sco
    capitalizedCustomObjType = ''; // SDO/SRO/SCO
    currType = ''; // Capitalized Object Type
    parentObject = ''; // deprecated
    editedObject: any;
    revocation: boolean = false;

    currentCollection = new Map();
    editedCollection: any;
    modalProps = new Map();
    modalError = new Map();

    // Imported data
    languages = LANGUAGES; // Key/Value List of Supported Langauges
    ids: any[] = [{ id: this.envService.env.defaultIdentity.id, name: this.envService.env.defaultIdentity.name }]; // Cached Identities
    faInfoCircle = faInfoCircle; // Info button
    faTrash = faTrash; // Delete button

    // Custom Array/Dict Properties
    customProp: any = new Map();
    customStringPropKeys: string[] = [];
    customArrPropKeys: string[] = [];

    guidedUI = false;

    prevObj;

    sdoProperties = [
        { name: 'Object Marking References', row: 'OMRrow' },
        { name: 'Labels', row: 'labelsRow' },
        { name: 'Confidence', row: 'confidenceRow' },
        { name: 'Created by ref', row: 'createdByRefRow' },
        { name: 'Language', row: 'languageRow' },
        { name: 'Revoked', row: 'revokedRow' },
        { name: 'Custom Properties', row: 'customRow' },
        { name: 'Granular Markings', row: 'GMrow' },
        { name: 'External References', row: 'ERrow' },
        { name: 'Extensions', row: 'EXrow' },
    ];
    scoProperties = [
        { name: 'Defanged', row: 'defangedRow' },
        { name: 'Custom Properties', row: 'customRow' },
        { name: 'Granular Markings', row: 'GMrow' },
        { name: 'External References', row: 'ERrow' },
        { name: 'Extensions', row: 'EXrow' },
    ];

    deletable_notes: Set<string> = new Set();
    notes;
    new_notes;
    isSpecVersionReadOnly = true;

    constructor(
        private router: Router,
        public modalService: NgbModal,
        public stixService: StixService,
        private envService: EnvService
    ) {
        this.guidedUI = this.stixService.guidedUI;
    }

    async ngOnInit(): Promise<void> {
        this.isLoadingItem = true;
        this.newObj = this.stixService.customObjInfo['new'];
        this.ids = this.ids.concat(this.stixService.populateCreatedByRef().filter((item) => item.id != this.envService.env.defaultIdentity.id));
        this.stixService.extensions = [];
        this.stixService.granularMarkings = [];
        this.stixService.externalReferences = [];
        this.stixService.notes = new Map();
        this.stixService.new_notes = new Map();

        if (this.newObj) {
            this.parent = this.stixService.customObjInfo['parent'];
            if (this.parent.length == 0) {
                console.error('ERROR: Custom Object is missing a parent');
                this.isLoadingItem = false;
                this.router.navigate(['/bundle']);
                return;
            }

            this.extTypes = this.stixService.customObjInfo['types'];
            if (this.extTypes.length == 0) {
                console.error('ERROR: No object extension types associated with this extension-definition');
                this.isLoadingItem = false;
                this.router.navigate(['/bundle']);
                return;
            }

            this.customObjType = this.extTypes[0];
            this.updateType();
            this.currentObject['id'] = '(type)' + this.uuid;
            this.currentObject['spec_version'] = '2.1';
            this.currentObject['extensions'] = new Map();
        } else {
            this.stixService.customObjReadOnly = false;

            const url = window.location.href;
            if (url.includes('revocation=true')) {
                this.stixService.customObjReadOnly = true;
                this.revocation = true;
            } else {
                this.stixService.customObjInfo['editing'] = true;
            }

            if (this.guidedUI) {
                if (this.queryParams && this.queryParams.revocation) {
                    this.stixService.customObjReadOnly = true;
                    this.revocation = true;
                }
            }

            let obj = (await db.getItemBeingEdited()) || '';
            await db.clearItemBeingEdited();
            if (!obj) {
                console.error('ERROR: Invalid Edited Object');
                this.isLoadingItem = false;
                this.router.navigate(['/bundle']);
                return;
            }

            let currObject = obj;

            this.editedObject = currObject;

            //Set Extensions
            let extensions = currObject['extensions'];
            for (let ext in extensions) {
                if (JSON.stringify(extensions[ext]).includes('property')) {
                    this.stixService.extensions.push(JSON.parse('{"' + ext + '":' + JSON.stringify(extensions[ext]) + '}'));
                } else {
                    this.parent = ext;
                    this.stixService.customObjInfo['parent'] = ext;
                    this.currType = extensions[ext]['extension_type'];
                    this.stixService.extensions.push(JSON.parse('{"' + ext + '":' + JSON.stringify(extensions[ext]) + '}'));
                }
            }
            this.resetObject();

            if (this.stixService.extensions.length > 0) {
                this.setTypes(currObject);
            } else {
                // IOBs such as x-oca-asset/event/geo carry no extension definition
                this.customObjType = 'new-sdo';
                this.capitalizedCustomObjType = 'SDO';
            }

            if (this.customObjType == '') {
                //  If there was an error parsing type
                console.error('ERROR: Invalid Object Type (MUST be new-sdo/sro/sco)');
                this.isLoadingItem = false;
                this.router.navigate(['/bundle']);
                return;
            }
            if (currObject['type']) this.currType = this.typeToUpper(currObject['type']);
            else {
                console.error('ERROR: Custom Objects MUST have a type');
                this.isLoadingItem = false;
                this.router.navigate(['/bundle']);
                return;
            }

            this.prevObj = JSON.parse(JSON.stringify(currObject));

            if (currObject['granular_markings']) {
                this.stixService.granularMarkings = currObject['granular_markings'];
                delete currObject['granular_markings'];
            }
            if (currObject['external_references']) {
                this.stixService.externalReferences = currObject['external_references'];
                delete currObject['external_references'];
            }

            if (this.customObjType != 'new-sco') {
                for (let x in currObject) {
                    if (this.sdo_sro_props.indexOf(x) != -1) {
                        if (x == 'modified') {
                        } // Don't use old modified date
                        else if (x == 'identity') {
                            let id = currObject['identity'];
                            if (this.ids.includes(id)) this.currentObject[x] = currObject[x];
                            else console.error('Invalid Identity; Potentially Updated to valid ID');
                        } else if (x == 'labels') {
                            this.stixService.stringArrays.set('labels', currObject[x]);
                            delete currObject[x];
                        } else if (x == 'object_marking_refs') {
                            this.stixService.objectMarkingReferences = currObject[x];
                            delete currObject[x];
                        } else {
                            this.currentObject[x] = currObject[x];
                        }
                    } else {
                        this.loadCustomProps(currObject, x);
                    }
                }
                if (this.revocation) this.currentObject['revoked'] = 'true';
                else if (this.currentObject['revoked'] && this.currentObject['revoked'] === true) this.stixService.customObjReadOnly = true;
            } else {
                for (let x in currObject) {
                    if (this.sco_props.indexOf(x) != -1) {
                        if (x == 'defanged') {
                        }
                        this.currentObject[x] = currObject[x];
                    } else {
                        this.loadCustomProps(currObject, x);
                    }
                }
            }

            const missingAttributes = localStorage.getItem('missing-attributes');
            if (missingAttributes?.includes('spec_version')) {
                this.isSpecVersionReadOnly = false;
                this.currentObject['spec_version'] = '';
                localStorage.removeItem('missing-attributes');
            }

            this.stixService.bundle.objects.forEach((elem) => {
                if (elem.type == 'note' && elem.object_refs && elem.object_refs.includes(this.currentObject['id']))
                    this.stixService.notes.set(elem.id, JSON.parse(JSON.stringify(elem)));
            });

            this.notes = JSON.stringify(Array.from(this.stixService.notes));
            this.new_notes = JSON.stringify(Array.from(this.stixService.new_notes));
        }
        this.isLoadingItem = false;
    }

    typeToUpper(str) {
        return str
            .split('-')
            .map(function (word) {
                return word[0].toUpperCase() + word.substr(1);
            })
            .join(' ');
    }

    setTypes(currObject: any) {
        let temp = JSON.stringify(currObject['extensions']);
        const typeRegex = new RegExp(/^.*\"(new-s[drc]o)\".*$/);
        let matches = temp.match(typeRegex);
        if (matches) this.customObjType = matches[1];
        else this.customObjType = 'new-sdo';

        let t = '';
        switch (this.customObjType) {
            case 'new-sdo':
                t = 'SDO';
                break;
            case 'new-sco':
                t = 'SCO';
                break;
            case 'new-sro':
                t = 'SRO';
                break;
        }
        this.capitalizedCustomObjType = t;
        if ((t = '')) console.error('ERROR: NOT A VALID EXTENSION TYPE');
    }

    loadCustomProps(currObject: any, x: any): void {
        let type = typeof currObject[x];

        if (type == 'string' || type == 'boolean' || type == 'number') {
            this.currentObject[x] = currObject[x];
            this.customStringPropKeys.push(x);
        } else {
            this.currentObject[x] = JSON.parse(JSON.stringify(currObject[x]));
            this.customArrPropKeys.push(x);
        }
    }

    openTooltipModal(modal) {
        this.modalRef = this.modalService.open(modal);
    }

    openLargeSubModal(modal) {
        this.modalRef = this.modalService.open(modal, { size: 'xl' });
    }

    closeTooltip() {
        this.modalRef.close();
    }

    addToBundle(): void {
        if (this.editedObject) {
            this.stixService.origID = this.editedObject['id'];
            this.stixService.removeComponent(this.editedObject['id']);
        }

        if (this.stixService.stringArrays.has('labels')) {
            this.currentObject['labels'] = this.stixService.stringArrays.get('labels');
            this.stixService.stringArrays.delete('labels');
        } else if (this.currentObject.get('modal_labels')) {
            this.currentObject['labels'] = this.currentObject.get('modal_labels');
            this.currentObject.delete('modal_labels');
        }

        for (let prop of this.stixService.toplevel) {
            this.currentObject[prop[0]] = prop[1];
        }

        if (this.currentObject['revoked']) this.currentObject['revoked'] = JSON.parse(this.currentObject['revoked']);
        if (this.currentObject['defanged']) this.currentObject['defanged'] = JSON.parse(this.currentObject['defanged']);

        if (this.stixService.objectMarkingReferences && this.stixService.objectMarkingReferences.length > 0) {
            this.currentObject['object_marking_refs'] = this.stixService.objectMarkingReferences;
            this.stixService.objectMarkingReferences = [];
        }

        if (this.stixService.granularMarkings && this.stixService.granularMarkings.length > 0) {
            this.currentObject['granular_markings'] = this.stixService.granularMarkings;
            this.stixService.granularMarkings = [];
        }

        if (this.stixService.externalReferences && this.stixService.externalReferences.length > 0) {
            this.currentObject['external_references'] = this.stixService.externalReferences;
            this.stixService.externalReferences = [];
        }

        if (this.stixService.extensions) {
            for (let ext of this.stixService.extensions) {
                let str = JSON.stringify(ext);
                let id = str.substring(2, 60);
                let e = str.substring(62, str.length - 1);
                this.currentObject['extensions'][id] = JSON.parse(e);
                if (e.includes('new-s')) {
                    this.parent = id;
                }
            }
            this.stixService.extensions = [];
        }
        if (this.parent && !this.currentObject['extensions'][this.parent]) {
            this.currentObject['extensions'][this.parent] = { extension_type: this.customObjType };
        }

        const payload = JSON.parse(JSON.stringify(this.currentObject));
        // Don't hand back an empty extensions block to objects that never had one
        if (payload['extensions'] && Object.keys(payload['extensions']).length === 0) delete payload['extensions'];

        this.stixService.addComponent(payload);
        if (this.stixService.new_notes.size > 0) {
            this.stixService.new_notes.forEach((value, key) => this.stixService.addComponent(Object.assign({}, value)));
        }

        this.router.navigate(['/bundle']);
    }

    cancel(): void {
        this.router.navigate(['/bundle']);
    }

    resetObject(): void {
        // Resets properties
        this.customStringPropKeys = [];
        this.customArrPropKeys = [];
        this.currentObject = new Map();
        this.customProp = new Map();

        this.currentObject['id'] = `[type]--${uuid()}`;
        this.currentObject['spec_version'] = '2.1';
        this.customProp.set('customArray', []);
        this.customProp['key'] = '';
        this.customProp['value'] = '';
        this.customProp.set('customDict', new Map());

        if (this.customObjType != 'new-sco') {
            // Sets to empty strings for validation purposes (so undefined does no have to be checked)
            this.customProp['type'] = '';
            this.customProp['name'] = '';
            this.customProp['text'] = '';
            this.customProp['boolean'] = '';
            this.customProp['integer'] = '';
            this.customProp['datetime'] = '';

            // Sets datetime fields to current
            let date = new Date().toISOString();
            this.currentObject['created'] = date;
            this.currentObject['modified'] = date;

            // Retrieves and sets (if applicable) Created by Ref Identities -- moved to stixService
        }

        // Sets extensions to include the current extension - Pretty sure this is deprecated
        this.currentObject['extensions'] = new Map();
    }

    isFormChanged(): boolean {
        let prev, curr, prevGranular, prevExtensions, prevExternal;
        if (this.prevObj) {
            prev = JSON.parse(JSON.stringify(this.prevObj));
            prevGranular = prev.granular_markings;
            prevExternal = prev.external_references;
            prevExtensions = prev.extensions;

            delete prev.type;
            delete prev.id;
            delete prev.spec_version;
            delete prev.created;
            delete prev.modified;
            delete prev.external_references;
            delete prev.granular_markings;
            delete prev.extensions;
        }

        if (this.currentObject) {
            curr = JSON.parse(JSON.stringify(this.currentObject));

            delete curr.type;
            delete curr.id;
            delete curr.spec_version;
            delete curr.created;
            delete curr.modified;
            delete curr.extensions;
        }

        if (prev && curr && JSON.stringify(prev) != JSON.stringify(curr)) {
            return true;
        }

        if (prevGranular && JSON.stringify(prevGranular) != JSON.stringify(this.stixService.granularMarkings)) {
            return true;
        }

        if (prevExternal && JSON.stringify(prevExternal) != JSON.stringify(this.stixService.externalReferences)) {
            return true;
        }

        const currExtensions = {};

        this.stixService.extensions.forEach((extension) => {
            const id = Object.keys(extension)[0];
            currExtensions[id] = extension[id];
        });

        if (JSON.stringify(prevExtensions) != JSON.stringify(currExtensions)) {
            return true;
        }

        return false;
    }

    isCustomObjAddEnabled(): boolean {
        this.stixService.granularMarkingSelectors = [];
        let mylen = undefined;
        if (this.stixService.objectMarkingReferences.length > 0) {
            this.stixService.granularMarkingSelectors.push('object_marking_refs');
            mylen = this.stixService.objectMarkingReferences.length;
            for (let q = 0; q < mylen; q++) {
                this.stixService.granularMarkingSelectors.push('object_marking_refs' + '.[' + q.toString() + ']');
            }
        }

        if ((this.stixService.stringArrays.get('labels') || []).length > 0) {
            this.stixService.granularMarkingSelectors.push('labels');
            mylen = this.stixService.stringArrays.get('labels')!.length;
            for (let j = 0; j < mylen; j++) {
                this.stixService.granularMarkingSelectors.push('labels' + '.[' + j.toString() + ']');
            }
        }

        for (let prop in this.currentObject) {
            if (prop != 'extensions') this.stixService.granularMarkingSelectors.push(prop);
        }

        if ((this.stixService.externalReferences || []).length > 0) {
            this.stixService.granularMarkingSelectors.push(`external_references`);
        }

        for (let i = 0; i < this.stixService.externalReferences.length; i++) {
            try {
                let currentSelectors = this.stixService.externalReferences[i].getGranularMarkingSelectors();
                let arraySelectors: any[] = [];
                for (let j = 0; j < currentSelectors.length; j++) {
                    arraySelectors.push(`external_references.[${i}].${currentSelectors[j]}`);
                }

                this.stixService.granularMarkingSelectors = this.stixService.granularMarkingSelectors.concat(arraySelectors);
            } catch (e) {}
        }

        for (let j = 0; j < this.stixService.extensions.length; j++) {
            let head = 'extensions.[' + j.toString() + ']';
            let currExtension = this.stixService.extensions[j];

            const regex = new RegExp(/^{"(extension-definition.*)":{(.*)("extension_type":")(.*property-extension)"(.*)}}$/);
            let curr = JSON.stringify(currExtension);
            let matches = curr.match(regex);
            if (matches) {
                let extensionID = matches[1];
                for (let k in currExtension[extensionID]) {
                    this.stixService.granularMarkingSelectors.push(head + '.' + k);
                }
            } else {
                console.error('Invalid Extension: ' + { currExtension });
            }
        }

        let omr = this.stixService.stringArrays.get('object_marking_refs') || [];
        for (let i = 0; i < omr.length; i++) {
            let currentSelectors = omr[i];
            let arraySelectors: any[] = [];
            for (let j = 0; j < currentSelectors.length; j++) {
                arraySelectors.push(currentSelectors[j]);
            }
            this.stixService.granularMarkingSelectors = this.stixService.granularMarkingSelectors.concat(arraySelectors);
        }

        // ---    END OF GRANULAR MARKING SELECTORS   ---

        let ret = !this.newObj || this.checkType(this.currentObject['type']);

        if (this.stixService.customObjInfo['type']) {
            this.customObjType = this.stixService.customObjInfo['type'];
            this.capitalizedCustomObjType = 'SDO';
            delete this.stixService.customObjInfo['type'];
        }

        if (this.currentObject['confidence'] && (this.currentObject['confidence'] < 0 || this.currentObject['confidence'] > 100)) {
            this.modalError.set('confidence', 'Confidence value must be an integer in the range of 0-100');
            ret = false;
        } else {
            this.modalError.delete('confidence');
        }

        for (let key of this.modalError.keys()) {
            if (!this.currentObject[key] && key != 'object' && key != 'customName')
                // Removes the error if the field is now empty
                this.modalError.delete(key);

            // Returns false if there is a validation error on a field
            if (this.modalError.get(key) && !this.modalError.get(key).includes('WARNING:') && !this.modalError.get(key).includes('hashes')) {
                ret = false;
            }
        }

        if (!this.newObj) {
            const formChanged = this.isFormChanged();

            if (!formChanged) ret = formChanged;
        }

        return ret;
    }

    checkType(currType: string): boolean {
        if (currType == undefined || currType == '') {
            this.modalError.delete('type');
            return false;
        }

        for (let char of currType) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.modalError.set('type', 'Type may only contain lowercase letters, numbers, and hyphens (-)');
                return false;
            }
        }

        if (currType.match(/^\d/)) {
            this.modalError.set('type', 'Type must not start with a number');
            return false;
        }

        if (currType.endsWith('-')) {
            this.modalError.set('type', 'Type must not end with a hyphen');
            return false;
        }

        if (currType.indexOf('--') != -1) {
            this.modalError.set('type', 'Type may not have two consecutive hypens (--)');
            return false;
        }

        if (currType.length < 3) {
            this.modalError.set('type', 'Type must have a minimum length of 3 characters');
            return false;
        }

        if (currType.length > 250) {
            this.modalError.set('type', 'Type must have a maximum length of 250 characters');
            return false;
        }

        if (this.currentObject['id'].indexOf('--') != -1) {
            let arr = this.currentObject['id'].split('--');

            this.currentObject['id'] = currType + '--' + arr[1];
        } else console.error('ERROR: INVALID ID');

        this.modalError.delete('type');
        return true;
    }

    checkName(currName: string): boolean {
        if (currName == undefined || currName == '') {
            this.modalError.delete('customName');
            return false;
        }

        for (let char of currName) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.modalError.set('customName', 'Name may only contain lowercase letters, numbers, and underscores (_)');
                return false;
            }
        }

        if (currName.length < 3) {
            this.modalError.set('customName', 'Name must have a minimum length of 3 characters');
            return false;
        }

        if (currName.length > 250) {
            this.modalError.set('customName', 'Name must have a maximum length of 250 characters');
            return false;
        }

        this.modalError.delete('customName');
        return true;
    }

    /**
     * String Array/Dict Functions
     */
    addString(currString: string, currArray: string): void {
        if (this.currentObject.has(currArray)) {
            let newStringArray = this.currentObject.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.currentObject.set(currArray, newStringArray);
            }
        } else this.currentObject.set(currArray, [currString]);

        if (this.modalProps[currArray] == currString) this.modalProps[currArray] = '';
    }

    deleteString(currString: string, currArray: string) {
        let curr = this.currentObject.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        if (curr.length > 0) this.currentObject.set(currArray, curr);
        else this.currentObject.delete(currArray);
    }

    addSubModalString(currString: string, currArray: string): void {
        if (this.customProp.has(currArray)) {
            let newStringArray = this.customProp.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.customProp.set(currArray, newStringArray);
            }
        } else this.customProp.set(currArray, [currString]);

        if (this.customProp['value'] == currString) this.customProp['value'] = '';
    }

    addSubModalDictString(currKey: string, currValue: string, currDict: string): void {
        this.customProp.get(currDict).set(currKey, currValue);
        this.customProp.get(currDict)[currKey] = currValue;

        if (this.customProp['value'] == currValue) {
            this.customProp['key'] = '';
            this.customProp['value'] = '';
        }
    }
    deleteSubModalDictString(currKey: string, currDict: string) {
        this.customProp.get(currDict).delete(currKey);
        delete this.customProp.get(currDict)[currKey];
    }

    deleteSubModalString(currString: string, currArray: string) {
        let curr = this.customProp.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        if (curr.length > 0) this.customProp.set(currArray, curr);
        else this.customProp.delete(currArray);
    }

    createProperty(modal?: any): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];
        if (this.currentObject[name]) {
            this.modalError.set('customName', 'Property with this name already exists');
            return;
        } else this.modalError.delete('customName');

        if (!this.checkName(name)) return;

        if (type == 'array' || type == 'dict') {
            this.customProp.set('customArray', []);
            this.customProp['key'] = '';
            this.customProp['value'] = '';
            this.customProp.set('customDict', new Map());
            this.openLargeSubModal(modal);
        } else {
            if (type == 'text') this.currentObject[name] = this.customProp['text'];
            else if (type == 'integer') this.currentObject[name] = parseInt(this.customProp['integer']) || undefined;
            else if (type == 'boolean') this.currentObject[name] = JSON.parse(this.customProp['boolean']);
            else if (type == 'datetime') this.currentObject[name] = this.customProp['datetime'];
            this.customStringPropKeys.push(name);
            this.customProp['type'] = '';
            this.customProp['name'] = '';
            this.customProp['text'] = '';
            this.customProp['boolean'] = '';
            this.customProp['integer'] = '';
            this.customProp['datetime'] = '';
        }
    }

    createCollection(): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];

        if (type == 'array') {
            this.currentObject[name] = this.customProp.get('customArray');
        } else if (type == 'dict') {
            this.currentObject[name] = this.customProp.get('customDict');
        }

        if (!this.customArrPropKeys.includes(name)) this.customArrPropKeys.push(name);

        this.customProp['type'] = '';
        this.customProp['name'] = '';
        this.customProp['text'] = '';
        this.customProp['boolean'] = '';
        this.customProp['datetime'] = '';
        this.closeTooltip();
    }

    editCollection(currCollection: any, modal: any): void {
        let currObj = this.currentObject[currCollection];
        this.customProp['name'] = currCollection;
        this.customProp['value'] = '';

        if (currObj.length) {
            // If it is an array
            this.customProp.set('customArray', []);
            this.customProp['type'] = 'array';
            for (let x of currObj) {
                this.addSubModalString(x, 'customArray');
            }
        } else {
            // If it is a dict
            this.customProp['key'] = '';
            this.customProp['type'] = 'dict';
            this.customProp.set('customDict', new Map());

            let curr = JSON.stringify(currObj);
            curr = curr.substring(1, curr.length - 2); // Removes bracket and trailing quote (fencepost problem)
            let split = curr.split('",');
            for (let i of split) {
                const key = i.slice(1, i.indexOf(':') - 1); // Removes Preceding and trailing quote
                const value = i.slice(i.indexOf(':') + 2); // Removes Preceding quote

                this.addSubModalDictString(key, value, 'customDict');
            }
        }

        this.openLargeSubModal(modal);
    }

    deleteProperty(currString: string): void {
        this.currentObject[currString] = undefined;
        this.customStringPropKeys = this.customStringPropKeys.filter((obj) => obj !== currString);
        this.customArrPropKeys = this.customArrPropKeys.filter((obj) => obj !== currString);
    }

    attributeWidth(type) {
        if (type) {
            switch (type) {
                case 'type':
                    return 'col-3';
                case 'id':
                    return 'col-6';
                case 'specVersion':
                    return 'col-3';
                case 'created':
                    return 'col-3';
                case 'modified':
                    return 'col-3';
                case 'confidence':
                    return 'col-3';
                case 'language':
                    return 'col-3';
                case 'createdByRef':
                    return 'col-4';
                case 'revoked':
                    return 'col-4';
                case 'labels':
                    return 'col-4';
                case 'defanged':
                    return 'col-6';
                case 'propertyName':
                    return 'col-6';
                case 'propertyType':
                    return 'col-6';
                case 'propertyValueText':
                    return 'col-11';
                case 'propertyValueBoolean':
                case 'propertyValueInteger':
                case 'propertyValueTime':
                    return 'col-6';
            }
        }

        return 'col-12';
    }

    questionWrapperClass(questionType = null) {
        if (this.stixService.guidedUI) {
            if (
                (this.objectPropertyTypeSelectionInput === 'required' && !this.stixService.customObjReadOnly && questionType === 'type') ||
                (this.objectPropertyTypeSelectionInput === 'read-only' &&
                    ((this.stixService.customObjReadOnly &&
                        (questionType === 'type' ||
                            questionType === 'confidence' ||
                            questionType === 'language' ||
                            questionType === 'createdByRef' ||
                            questionType === 'revoked' ||
                            questionType === 'labels' ||
                            questionType === 'defanged' ||
                            questionType === 'confidence' ||
                            questionType === 'confidence' ||
                            questionType === 'createCustomProperties' ||
                            questionType === 'showCustomProperties')) ||
                        questionType === 'id' ||
                        questionType === 'specVersion' ||
                        questionType === 'created' ||
                        questionType === 'modified')) ||
                (this.objectPropertyTypeSelectionInput === 'common' &&
                    !this.stixService.customObjReadOnly &&
                    (questionType === 'type' ||
                        questionType === 'confidence' ||
                        questionType === 'language' ||
                        questionType === 'createdByRef' ||
                        questionType === 'revoked' ||
                        questionType === 'labels' ||
                        questionType === 'defanged' ||
                        questionType === 'confidence' ||
                        questionType === 'confidence' ||
                        questionType === 'createCustomProperties' ||
                        questionType === 'propertyName' ||
                        questionType === 'propertyType' ||
                        questionType === 'propertyValueText' ||
                        questionType === 'propertyValueBoolean' ||
                        questionType === 'propertyValueInteger' ||
                        questionType === 'propertyValueTime' ||
                        questionType === 'showCustomProperties') &&
                    (questionType !== 'type' || !questionType))
            ) {
                return 'guided-wrapper';
            } else {
                return 'move-out-of-view';
            }
        } else {
            return this.attributeWidth(questionType);
        }
    }

    openNoteDialogModal() {
        const modalRef = this.modalService.open(NoteDialogComponent, { size: 'xl', modalDialogClass: 'modal-note' });
        modalRef.componentInstance.type = 'custom';
        modalRef.componentInstance.notes = this.stixService.notes;
        modalRef.componentInstance.new_notes = this.stixService.new_notes;
        modalRef.componentInstance.deletable_notes = this.deletable_notes;
        modalRef.componentInstance.objectId = this.currentObject['id'];
    }

    setObjectMarkingReferences(newObjectMarkingReferences: string[]): void {
        this.stixService.objectMarkingReferences = newObjectMarkingReferences;
    }

    setLabels(newlabels: string[]): void {
        this.stixService.stringArrays.set('labels', newlabels);
    }

    scrollTo(rowName: string): void {
        const htmlElement = this[rowName] as ElementRef<HTMLDivElement>;
        const position = htmlElement.nativeElement.getBoundingClientRect().top;

        if (position > 84 && position < window.screen.height - 43) return;

        htmlElement.nativeElement.scrollIntoView();
        if (position < 84) {
            window.scrollBy({ top: position - 85 });
        }
    }

    //New Object
    updateType(): void {
        let t = '';
        switch (this.customObjType) {
            case 'new-sdo':
                t = 'SDO';
                break;
            case 'new-sco':
                t = 'SCO';
                break;
            case 'new-sro':
                t = 'SRO';
                break;
        }
        this.capitalizedCustomObjType = t;
        if ((t = '')) console.error('ERROR: NOT A VALID EXTENSION TYPE');

        if (this.customObjType != 'new-sco') {
            delete this.currentObject['defanged'];
            let date = new Date().toISOString();
            this.currentObject['created'] = date;
            this.currentObject['modified'] = date;
        } else {
            delete this.currentObject['created'];
            delete this.currentObject['modified'];
            delete this.currentObject['confidence'];
            delete this.currentObject['created_by_ref'];
            delete this.currentObject['lang'];
            delete this.currentObject['revoked'];
            this.stixService.stringArrays.delete('labels');
            this.stixService.objectMarkingReferences = [];
        }
    }
}
