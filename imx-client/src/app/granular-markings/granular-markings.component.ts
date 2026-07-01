import { Component } from '@angular/core';
import { GranularMarking } from '../models/granular-marking';
import { StixService } from '../stix-service.service';
import { LANGUAGES } from '../models/languages';
import { faTrash, faEdit, faBan, faPlus } from '@fortawesome/free-solid-svg-icons';
import { GranularMarkingsDialogComponent } from './granular-markings-dialog/granular-markings-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-granular-markings',
    templateUrl: './granular-markings.component.html',
    styleUrls: ['./granular-markings.component.css'],
    standalone: false,
})
export class GranularMarkingsComponent {
    currentGranularMarking = new GranularMarking();
    isAddingGranularMarkings: boolean = false;
    newGranularMarkings: GranularMarking[] = [];
    newSelector: any = undefined;
    lang: any;
    marking_ref: any;
    errorMessage: string = '';
    tooltip: string;

    faEdit = faEdit;
    faTrash = faTrash;
    faBan = faBan;
    faPlus = faPlus;

    tlp_options = [];
    lang_options: any[] = LANGUAGES;
    selectors: any[];
    componentData: any;

    constructor(
        public stixService: StixService,
        public granularMarkingDialog: MatDialog
    ) {
        this.tooltip = 'Allow both data markings and language markings to be applied to individual portions of STIX Objects and Marking Definitions.';
    }

    addGranularMarking(): void {
        let component: any = this.currentGranularMarking;
        for (let x in component) {
            if (component[x].length == 0) {
                delete component[x];
            }
        }
        this.stixService.granularMarkings.push(component);
        this.isAddingGranularMarkings = false;
        this.stixService.editedGranularMarking = undefined;
        this.newSelector = [];
        this.errorMessage = '';

        this.currentGranularMarking = new GranularMarking();
    }

    addOrCancel(): void {
        if (this.isAddingGranularMarkings && this.stixService.editedGranularMarking) {
            this.stixService.granularMarkings.push(this.stixService.editedGranularMarking);
            this.stixService.editedGranularMarking = undefined;
        }
        this.isAddingGranularMarkings = !this.isAddingGranularMarkings;
        this.newSelector = [];
        this.errorMessage = '';
        this.currentGranularMarking = new GranularMarking();
    }

    editGranularMarkings(myobj: any) {
        this.stixService.editedGranularMarking = myobj;
        this.currentGranularMarking = new GranularMarking(myobj.selectors, myobj.lang, myobj.marking_ref);
        this.openDialog();
        this.stixService.granularMarkings = this.stixService.granularMarkings.filter((obj) => obj !== myobj);
    }

    deleteGranularMarkings(myobj: any) {
        this.stixService.granularMarkings = this.stixService.granularMarkings.filter((obj) => obj !== myobj);
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
        this.currentGranularMarking.marking_ref = '';
    }

    openDialog() {
        const dialogRef = this.granularMarkingDialog.open(GranularMarkingsDialogComponent, {
            data: this.currentGranularMarking,
            height: '356px',
            width: `${window.innerWidth / 2}px`,
            position: {
                top: '230px',
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.currentGranularMarking = result;
                this.addGranularMarking();
            } else {
                this.currentGranularMarking = new GranularMarking();
            }
        });
    }
}
