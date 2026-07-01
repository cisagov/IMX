import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faPlus, faTrash, faBan } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TLP20_OPTIONS, TLP_OPTIONS } from 'src/app/tlpMarkingDef';

@Component({
    selector: 'app-string-array-dialog',
    templateUrl: './string-array-dialog.component.html',
    styleUrls: ['./string-array-dialog.component.css'],
    standalone: false,
})
export class StringArrayDialogComponent implements OnInit {
    faPlus = faPlus;
    faTrash = faTrash;
    faBan = faBan;

    currentStringValidator?: any;
    currentString: string = '';
    isAddingElement: boolean = false;
    newStr: string = '';
    labels: string;
    tlp_options = [];
    filteredTlpOptions: any[];
    other_options = [];
    filteredOtherOptions: any[];
    acsMap: Map<string, any> = new Map();
    acsOptions: string[] = [];
    tooltip: string;
    env = this.envService.env;
    tlpDescription: string[] = [];
    disableMarkingDefInput = false;
    tlpError = '';
    markingRefs = '';
    otherMarkingRefs = '';
    acs = '';
    otherError = '';
    markingRefsMap: Map<string, any> = new Map();
    otherRefs = [];

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        public dialogRef: MatDialogRef<StringArrayDialogComponent>,
        public matAutocomplete: MatAutocompleteModule,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.currentStringValidator = data.validator;
    }

    ngOnInit(): void {
        if (this.envService.env.tlpConfig.enabledTlpVersions.length === 1) {
            this.tlp_options = this.stixService.getTlpOptions(this.envService.env.tlpConfig.enabledTlpVersions[0].value);
            this.filteredTlpOptions = JSON.parse(JSON.stringify(this.tlp_options));
        }

        let tlp = '';

        for (const key in this.stixService.markingDefinition) {
            if (!this.stixService.markingDefinition[key].startsWith('TLP:') && !this.stixService.remoteMarkingDefinitions.has(key)) {
                this.markingRefsMap.set(key, this.stixService.markingDefinition[key]);
            }
        }

        for (const key in this.stixService.acsMarkings) {
            if (!this.stixService.remoteMarkingDefinitions.has(key)) {
                this.acsOptions.push(key);
                this.acsMap.set(key, this.stixService.acsMarkings[key]);
            }
        }

        this.data.refs.forEach((elem) => {
            let found: any = TLP20_OPTIONS.find((opt) => opt.id === elem);
            if (!found) found = TLP_OPTIONS.find((opt) => opt.id === elem);

            if (found) {
                tlp = found.id;
                this.data.refs = this.data.refs.filter((ref) => ref !== tlp);
            } else {
                if (this.acsMap.has(elem)) this.acs = elem;
                else this.otherRefs.push(elem);
            }
        });

        this.markingRefs = tlp;

        this.filteredOtherOptions = [];
        this.markingRefsMap.forEach((value, key, map) => {
            if (this.otherRefs.includes(key)) return;

            this.filteredOtherOptions.push(key);
        });
    }

    onNoClick(): void {
        this.dialogRef.close(this.currentString);
    }

    onX(): void {
        this.dialogRef.close('');
    }

    onConfirm(): void {
        const refs = [];

        this.otherRefs.forEach((elem) => {
            refs.push(elem);
        });

        if (this.acs) refs.push(this.acs);

        if (this.markingRefs) refs.push(this.markingRefs);

        this.dialogRef.close(refs);
    }

    getTlpOptions(event: any) {
        this.tlp_options = this.stixService.getTlpOptions(event.target.value);
        this.currentString = '';
    }

    onAcsChange(event) {
        if (this.acsMap.get(event).endsWith('TLP:CLEAR)')) {
            this.markingRefs = 'marking-definition--94868c89-83c2-464b-929b-a1a8aa3c8487';
        } else if (this.acsMap.get(event).endsWith('TLP:GREEN)')) {
            this.markingRefs = 'marking-definition--bab4a63c-aed9-4cf5-a766-dfca5abac2bb';
        } else if (this.acsMap.get(event).endsWith('TLP:AMBER)')) {
            this.markingRefs = 'marking-definition--55d920b0-5e8b-4f79-9ee9-91f868d9b421';
        }
    }

    onTlpChange(event) {
        this.disableMarkingDefInput = false;
        this.tlpError = '';
        this.filterText(event);

        if (event) {
            const tlp = this.tlp_options.find((o) => o.value === event);
            if (tlp) {
                this.disableMarkingDefInput = true;
                const description = tlp.description.split('):');
                switch (description[0]) {
                    case 'TLP:CLEAR (Unrestricted':
                        this.tlpDescription = ['TLP:CLEAR', '(Unrestricted):', description[1]];
                        break;
                    case 'TLP:GREEN (Community Sharing':
                        this.tlpDescription = ['TLP:GREEN', '(Community Sharing):', description[1]];
                        break;
                    case 'TLP:AMBER (Limited Disclosure':
                        this.tlpDescription = ['TLP:AMBER', '(Limited Disclosure):', description[1]];
                        break;
                    case 'TLP:AMBER+STRICT (Limited Disclosure':
                        this.tlpDescription = ['TLP:AMBER+STRICT', '(Limited Disclosure):', description[1]];
                        break;
                    case 'TLP:RED (High Sensitivity':
                        this.tlpDescription = ['TLP:RED', '(High Sensitivity):', description[1]];
                        break;
                }
            }

            const regex = new RegExp('marking-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
            if (!regex.test(event)) {
                this.disableMarkingDefInput = false;
                this.tlpError = 'Must be a valid ID of type marking-definition';
            }
        }

        if (!this.disableMarkingDefInput) {
            this.tlpDescription = [];
        }
    }

    filterOther() {
        this.filteredOtherOptions = [];
        this.markingRefsMap.forEach((val, key, map) => {
            if (this.otherRefs.includes(key)) return;

            this.filteredOtherOptions.push(key);
        });
    }

    addOther(other: string) {
        if (this.otherRefs.includes(other)) return;

        this.otherMarkingRefs = '';
        this.otherRefs.push(other);
        this.filterOther();
    }

    deleteOther(other: string) {
        this.otherRefs = this.otherRefs.filter((elem) => {
            return elem != other;
        });

        this.filterOther();
    }

    filterText(text: string) {
        if (!text) this.filteredTlpOptions = JSON.parse(JSON.stringify(this.tlp_options));
        else {
            this.filteredTlpOptions = this.tlp_options.filter((tlpOption) => {
                if (tlpOption.key.includes(text.toUpperCase())) return true;
                else return tlpOption.value.includes(text.toLowerCase());
            });
        }
    }

    acsView(acs) {
        if (acs === 'Federal and non-Federal Entities' && this.stixService.taxiiServerType === 'ais') return 'Federal and CISCP';

        return acs;
    }
}
