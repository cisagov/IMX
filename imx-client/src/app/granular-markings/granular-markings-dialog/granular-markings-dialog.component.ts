import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { faPlus, faTrash, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { GranularMarking } from '../../models/granular-marking';
import { LANGUAGES } from '../../models/languages';
import { EnvService } from 'src/app/env-service/env.service';

export interface GranularMarkingData {
    selectors: [];
    lang: '';
    marking_ref: '';
}

@Component({
    selector: 'app-granular-markings-dialog',
    templateUrl: './granular-markings-dialog.component.html',
    styleUrls: ['./granular-markings-dialog.component.css'],
    standalone: false,
})
export class GranularMarkingsDialogComponent implements OnInit {
    faPlus = faPlus;
    faTrash = faTrash;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    errorMessage = '';
    currentGranularMarking = new GranularMarking();
    tlp_options;
    lang_options: any[] = LANGUAGES;
    newSelector = [];
    isAddingGranularMarkings = true;
    tlp_version = '';
    tlp_name = '';
    isTLPOne = true;
    tlpError = '';
    filteredTlpOptions = [];

    constructor(
        private envService: EnvService,
        public stixService: StixService,
        public dialogRef: MatDialogRef<GranularMarkingsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: GranularMarkingData
    ) {
        this.errorMessage = '';
        this.currentGranularMarking = data;
        this.newSelector = data.selectors;
        if (data.marking_ref) {
            let currentTlp = this.stixService.getCurrentTlp(data.marking_ref);
            this.tlp_version = currentTlp.version;
            this.getTlpOptions({ target: { value: this.tlp_version }, reset: false });
            this.tlp_name = currentTlp.name;
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        let result = this.addButton();

        if (result.valid === false) {
            this.errorMessage = result.errorMessage;
            return;
        }
        this.dialogRef.close(this.currentGranularMarking);
    }

    addButton(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');

        if (this.currentGranularMarking.marking_ref != '') {
            if (!md_Regex.test(this.currentGranularMarking.marking_ref))
                return {
                    valid: false,
                    errorMessage: 'Marking Reference must be formatted as marking-definition--(uuid)',
                };
        }

        this.currentGranularMarking.selectors = this.newSelector;

        return {
            valid: true,
        };
    }

    getTlpOptions(event: any) {
        this.tlp_options = this.stixService.getTlpOptions(event.target.value);
        if (event.reset !== false) this.currentGranularMarking.marking_ref = '';
    }

    setMarkingRef() {
        this.tlpError = '';
        this.currentGranularMarking.marking_ref = '';

        this.filteredTlpOptions = this.tlp_options.filter((tlpOption) => {
            if (tlpOption.key.includes(this.tlp_name.toUpperCase())) return true;
            else return tlpOption.value.includes(this.tlp_name.toLowerCase());
        });

        if (this.currentGranularMarking.lang === '') {
            const regex = new RegExp('marking-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
            if (!regex.test(this.tlp_name)) {
                if (this.tlp_name) this.tlpError = 'Must be a valid ID of type marking-definition';
            } else {
                this.currentGranularMarking.marking_ref = this.tlp_name;
            }
        }
    }

    getSelected() {
        let str = '';
        this.newSelector.forEach((elem) => {
            if (!str) str = elem;
            else str += ', ' + elem;
        });

        return str;
    }

    ngOnInit(): void {
        if (!this.envService.env.tlpConfig.enableTlpOne) {
            this.isTLPOne = false;
            this.tlp_version = 'v2';
            this.tlp_options = this.stixService.getTlpOptions(this.tlp_version);
            this.filteredTlpOptions = JSON.parse(JSON.stringify(this.tlp_options));
        }
    }
}
