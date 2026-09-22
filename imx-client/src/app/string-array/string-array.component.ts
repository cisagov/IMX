import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { faTrash, faPlus, faBan, faInfoCircle, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';
import { STRING_ARRAY_VALIDATORS } from '../dynamic-form-component/string-array-validators';
import { StixService } from 'src/app/stix-service.service';
import { StringArrayDialogComponent } from './string-array-dialog/string-array-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TLP_OPTIONS, TLP20_OPTIONS } from '../tlpMarkingDef';
import { ACS_OBJECTS } from '../models/acs-objects';

const ACS_EXTENSION = 'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce';
const CUI_EXTENSION = 'extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a';
const TLP20_EXTENSION = 'extension-definition--60a3c5c5-0d10-413e-aab3-9e08dde9e88d';

interface MarkingDetail {
    label: string;
    value: string;
}

@Component({
    selector: 'app-string-array',
    templateUrl: './string-array.component.html',
    styleUrls: ['./string-array.component.css'],
    standalone: false,
})
export class StringArrayComponent implements OnInit, OnDestroy {
    @Input() key!: string;
    @Output() stringArrayOutput = new EventEmitter<string[]>();

    faTrash = faTrash;
    faPlus = faPlus;
    faBan = faBan;
    faInfoCircle = faInfoCircle;
    faEye = faEye;
    faSearch = faSearch;

    currentStringValidator?: any;
    currentString: string = '';
    isAddingElement: boolean = false;
    newStr: string = '';
    labels: string;
    tlp_options = [];
    tooltip: string;
    newString: string = '';

    isObjectMarkingRefUpdated: boolean = false;

    private openDetail: Set<string> = new Set();
    private loadingDetail: Set<string> = new Set();
    private detailCache: Map<string, MarkingDetail[] | null> = new Map();

    get displayedObjectMarkingRefs(): string[] {
        return this.isObjectMarkingRefUpdated ? this.stixService.objectMarkingReferencesTemp : this.stixService.objectMarkingReferences;
    }

    listSearch: string = '';
    listFilter: string = '';
    private listSearch$ = new Subject<string>();
    private ngUnsubscribe = new Subject<void>();
    readonly listSearchThreshold = 15;

    get labelList(): string[] {
        return this.stixService.stringArrays.get(this.key) ?? [];
    }

    get filteredLabels(): string[] {
        return this.matchesSearch(this.labelList, (s) => s);
    }

    get filteredMarkingRefs(): string[] {
        return this.matchesSearch(this.displayedObjectMarkingRefs, (s) => `${s} ${this.getDisplayName(s)}`);
    }

    onListSearchChange(term: string): void {
        this.listSearch$.next(term);
    }

    showListSearch(count: number): boolean {
        return count > this.listSearchThreshold || !!this.listSearch || !!this.listFilter;
    }

    private matchesSearch(items: string[], text: (s: string) => string): string[] {
        const term = this.listFilter.trim().toLowerCase();
        return term ? items.filter((s) => text(s).toLowerCase().includes(term)) : items;
    }

    constructor(
        public stixService: StixService,
        public stringArrayDialog: MatDialog
    ) {
        this.labels = '';
    }

    ngOnInit(): void {
        this.listSearch$.pipe(debounceTime(500), takeUntil(this.ngUnsubscribe)).subscribe((term) => (this.listFilter = term));

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

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openDialog() {
        const dialogRef = this.stringArrayDialog.open(StringArrayDialogComponent, {
            data: { validator: this.currentStringValidator, refs: [...this.stixService.objectMarkingReferences] },
            panelClass: 'imx-modal',
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

    toggleDetail(id: string): void {
        if (this.openDetail.has(id)) {
            this.openDetail.delete(id);
            return;
        }

        this.openDetail.add(id);

        if (this.detailCache.has(id) || this.loadingDetail.has(id)) return;

        const local = this.resolveMarkingLocally(id);
        if (local) {
            this.detailCache.set(id, this.buildDetail(local));
            return;
        }

        this.loadingDetail.add(id);
        this.stixService.checkId(id).subscribe(
            (resp: any) => {
                const found = resp?.body?.founds?.[0]?.object;
                this.detailCache.set(id, found ? this.buildDetail(found) : null);
                this.loadingDetail.delete(id);
            },
            (err) => {
                console.error('Unable to look up marking definition: %s', id, err);
                this.detailCache.set(id, null);
                this.loadingDetail.delete(id);
            }
        );
    }

    isDetailOpen(id: string): boolean {
        return this.openDetail.has(id);
    }

    isDetailLoading(id: string): boolean {
        return this.loadingDetail.has(id);
    }

    getDetail(id: string): MarkingDetail[] | null {
        return this.detailCache.get(id) ?? null;
    }

    private resolveMarkingLocally(id: string): any {
        return (
            TLP20_OPTIONS.find((obj) => obj.id === id) ??
            TLP_OPTIONS.find((obj) => obj.id === id) ??
            ACS_OBJECTS.find((obj) => obj.object.id === id)?.object ??
            this.stixService.getObjectFromID(id)
        );
    }

    private buildDetail(obj: any): MarkingDetail[] {
        const rows: MarkingDetail[] = [];
        const push = (label: string, value: any) => {
            const text = Array.isArray(value) ? value.join(', ') : value;
            if (text) rows.push({ label, value: text });
        };

        const acs = obj.extensions?.[ACS_EXTENSION];
        const cui = obj.extensions?.[CUI_EXTENSION];
        const tlp20 = obj.extensions?.[TLP20_EXTENSION];

        if (acs) {
            push('Classification', acs.control_set?.classification);
            push('Determination', acs.control_set?.formal_determination);
            push('Shareability', acs.control_set?.shareability);
            // Same privdefault/sharedefault parse StixService.identifyAcs does inline
            if (acs.policy_reference) {
                push('Usage', acs.policy_reference.split('privdefault=')[1]?.startsWith('permit') ? 'Permit' : 'Deny');
                push('Further sharing', acs.policy_reference.split('sharedefault=')[1]?.startsWith('permit') ? 'Permit' : 'Deny');
            }
            push('Shared with', [...new Set(acs.further_sharing?.flatMap((fs) => fs.sharing_scope || []) || [])]);
        } else if (cui) {
            push('Marking', this.stixService.getCuiDisplay(cui, obj.id));
        } else if (tlp20) {
            push('TLP level', tlp20.tlp_2_0);
            push('Description', obj.description);
        } else if (obj.definition) {
            push('TLP level', obj.definition.tlp);
            push('Statement', obj.definition.statement);
            if (rows.length === 0) push(obj.definition_type || 'Definition', obj.definition[obj.definition_type]);
        }

        if (rows.length === 0) {
            push('Name', obj.name);
            push('Created', obj.created);
        }

        return rows;
    }

    acsView(acs) {
        if (acs === 'Federal and non-Federal Entities' && this.stixService.taxiiServerType === 'ais') return 'Federal and CISCP';

        return acs;
    }
}
