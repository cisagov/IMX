import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faTrash, faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { STRING_ARRAY_VALIDATORS } from '../dynamic-form-component/string-array-validators';
import { StixService } from 'src/app/stix-service.service';
import { StringArrayDialogComponent } from './string-array-dialog/string-array-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TLP_OPTIONS, TLP20_OPTIONS } from '../tlpMarkingDef';
import { ACS_OBJECTS } from '../models/acs-objects';

@Component({
    selector: 'app-string-array',
    templateUrl: './string-array.component.html',
    styleUrls: ['./string-array.component.css'],
    standalone: false,
})
export class StringArrayComponent implements OnInit {
    @Input() key!: string;
    @Output() stringArrayOutput = new EventEmitter<string[]>();

    faTrash = faTrash;
    faPlus = faPlus;
    faBan = faBan;

    currentStringValidator?: any;
    currentString: string = '';
    isAddingElement: boolean = false;
    newStr: string = '';
    labels: string;
    tlp_options = [];
    tooltip: string;
    newString: string = '';

    isObjectMarkingRefUpdated: boolean = false;

    constructor(
        public stixService: StixService,
        public stringArrayDialog: MatDialog
    ) {
        this.labels = '';
    }

    ngOnInit(): void {
        let found = false;
        for (let i = 0; i < STRING_ARRAY_VALIDATORS.length; i++) {
            if (this.key === STRING_ARRAY_VALIDATORS[i].key) {
                this.currentStringValidator = STRING_ARRAY_VALIDATORS[i];
                found = true;
                break;
            }
        }
        if (this.key === 'object_marking_refs') {
            this.stixService.updateMarkingDef();
        }

        if (!found) throw new Error(`String array component called without providing a valid key! Key: ${this.key}`);

        switch (this.key) {
            case 'object_marking_refs': {
                this.tooltip = 'Specify a list of id properties of marking-definition objects that apply to this object.';
                break;
            }
            case 'labels': {
                this.tooltip = 'Labels for Object';
                break;
            }
        }
    }

    openDialog() {
        const dialogRef = this.stringArrayDialog.open(StringArrayDialogComponent, {
            data: { validator: this.currentStringValidator, refs: [...this.stixService.objectMarkingReferences] },
            minHeight: '500px',
            maxHeight: '90vh',
            width: '800px',
            maxWidth: '95vw',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.length > 0) {
                this.stixService.objectMarkingReferences = [];
                result.forEach((elem) => {
                    if (elem) {
                        this.currentString = elem;
                        this.addStringElement();
                    } else {
                        this.currentString = '';
                    }
                });
            }
        });
    }

    addString() {
        if (this.stixService.stringArrays.has(this.key)) {
            let newStringArray = this.stixService.stringArrays.get(this.key)!;
            if (this.key === 'labels' && newStringArray === undefined) {
                this.stixService.stringArrays.set(this.key, [this.newString]);
            } else if (newStringArray.indexOf(this.newString) == -1) {
                newStringArray.push(this.newString);
                this.stixService.stringArrays.set(this.key, newStringArray);
            }
        } else {
            this.stixService.stringArrays.set(this.key, [this.newString]);
        }
        this.newString = '';
    }

    deleteString(myobj: any, mykey: any) {
        let curr = this.stixService.stringArrays.get(mykey);
        curr = curr.filter((obj) => obj !== myobj);
        this.stixService.stringArrays.set(mykey, curr);
        if (mykey == 'extension_types') {
            // check if new-sdo, new-sro, or new-sco
            let subobj = myobj.substring(0, 9);
            switch (subobj) {
                case 'new-sdo (':
                case 'new-sro (':
                case 'new-sco (':
                    let matches = [myobj, myobj.slice(9).replace(')', '')];
                    this.stixService.modalObjectArray = this.stixService.modalObjectArray.filter((obj) => obj['id'] != matches[1]);
                    break;
            }
            if (this.stixService.isEditing) {
                let id = this.stixService.currentID;
                let currObject = this.stixService.getObjectFromID(id);
                this.stixService.removeExtensionDefChildren(id, currObject, myobj, true);
            }
        }
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.labels ? selectors.push('labels') : null;

        return selectors;
    }

    addOrCancel(): void {
        this.isAddingElement = !this.isAddingElement;
        this.currentString = '';
    }

    addStringElement(globalTLP = false): void {
        if (this.stixService.guidedUI && !globalTLP) {
            this.isObjectMarkingRefUpdated = true;
            this.removeTLPOnly();
            this.stixService.objectMarkingReferencesTemp.push(this.currentString);
        } else {
            this.removeTLPOnly();
            if (!this.stixService.objectMarkingReferences.includes(this.currentString))
                this.stixService.objectMarkingReferences.push(this.currentString);
        }
    }

    deleteOmr(myobj: any, globalTLP = false) {
        if (this.stixService.guidedUI && !globalTLP) {
            this.isObjectMarkingRefUpdated = true;
            if (this.stixService.objectMarkingReferencesTemp.length > 0) {
                this.stixService.objectMarkingReferencesTemp = this.stixService.objectMarkingReferencesTemp.filter((obj) => obj !== myobj);
            } else {
                this.stixService.objectMarkingReferences = [];
                this.stixService.objectMarkingReferencesTemp = [...this.stixService.objectMarkingReferences];
                this.stixService.objectMarkingReferencesTemp = this.stixService.objectMarkingReferencesTemp.filter((obj) => obj !== myobj);
            }
        } else {
            this.stixService.objectMarkingReferences = this.stixService.objectMarkingReferences.filter((obj) => obj !== myobj);
        }
    }

    getTlpOptions(event?: any) {
        if (event.target) {
            this.tlp_options = this.stixService.getTlpOptions(event.target.value);
        } else {
            this.tlp_options = this.stixService.getTlpOptions(event);
        }

        this.currentString = '';
    }

    getDisplayName(currentString: string): string {
        let displayName = TLP20_OPTIONS.find((obj) => obj.id === currentString)?.name;
        if (displayName === undefined) displayName = TLP_OPTIONS.find((obj) => obj.id === currentString)?.name;
        if (displayName === undefined) displayName = ACS_OBJECTS.find((obj) => obj.object.id === currentString)?.type;
        if (displayName === undefined) displayName = this.stixService.markingDefinition[currentString];
        if (displayName === undefined) displayName = this.stixService.acsMarkings[currentString];
        if (displayName === undefined) displayName = currentString;
        return displayName;
    }

    getDisplayStyle(displayName: string): string {
        let displayStyle = '';
        if (displayName === 'TLP:CLEAR' || displayName === 'TLP:WHITE') displayStyle = 'tlp-clear';
        else if (displayName === 'TLP:GREEN') displayStyle = 'tlp-green';
        else if (displayName === 'TLP:AMBER' || displayName === 'TLP:AMBER+STRICT') displayStyle = 'tlp-amber';
        else if (displayName === 'TLP:RED') displayStyle = 'tlp-red';
        else displayStyle = 'acs-marking-label';
        return displayStyle;
    }

    removeTLPOnly(): void {
        // These Could be more efficient using ACS markings instead but technically not correct if a third field is ever added
        if (this.stixService.objectMarkingReferences.length > 0) {
            this.stixService.objectMarkingReferences = this.stixService.objectMarkingReferences.filter(
                (obj) => !TLP20_OPTIONS.find((opt) => opt.id === obj)
            );
            this.stixService.objectMarkingReferences = this.stixService.objectMarkingReferences.filter(
                (obj) => !TLP_OPTIONS.find((opt) => opt.id === obj)
            );
        }

        if (this.stixService.objectMarkingReferencesTemp.length > 0) {
            this.stixService.objectMarkingReferencesTemp = this.stixService.objectMarkingReferencesTemp.filter(
                (obj) => !TLP20_OPTIONS.find((opt) => opt.id === obj)
            );
            this.stixService.objectMarkingReferencesTemp = this.stixService.objectMarkingReferencesTemp.filter(
                (obj) => !TLP_OPTIONS.find((opt) => opt.id === obj)
            );
        }
    }

    acsView(acs) {
        if (acs === 'Federal and non-Federal Entities' && this.stixService.taxiiServerType === 'ais') return 'Federal and CISCP';

        return acs;
    }
}
