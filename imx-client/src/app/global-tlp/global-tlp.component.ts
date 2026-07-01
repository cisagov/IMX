import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TLP_OPTIONS, TLP20_OPTIONS } from '../tlpMarkingDef';
import { StixService } from 'src/app/stix-service.service';
import { environment } from 'src/environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-global-tlp',
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './global-tlp.component.html',
    styleUrl: './global-tlp.component.css',
})
export class GlobalTlpComponent implements OnInit {
    env = environment;
    faBan = faBan;
    faCheck = faCheck;

    tlp_options = [];
    currentString: string = '';
    onPageMsgs = [];
    mostStrictTlpOption = null;
    selectedTlpOption = null;
    tlpVersion = 'v2';
    tlpCounts = [];
    unassignedObjMarkingRefObjs = [];
    applyToAll = false;

    constructor(
        public stixService: StixService,
        public stringArrayDialog: MatDialog,
        public activeModal: NgbActiveModal
    ) {}

    ngOnInit() {
        this.tlp_options = this.stixService.getTlpOptions('v2');
        this.autoSetTLP();
    }

    getTlpOptions(event?: any) {
        if (event.target) {
            this.tlp_options = this.stixService.getTlpOptions(event.target.value);
        } else {
            this.tlp_options = this.stixService.getTlpOptions(event);
        }

        this.currentString = '';
    }

    checkSelectedTLP(type) {
        const tlpObj = this.tlp_options.find((x) => x.key === type);
        return this.stixService.objectMarkingReferences.find((x) => x === tlpObj.value);
    }

    selectTLP(tlp) {
        this.onPageMsgs = [];
        const tlpSelected = this.checkSelectedTLP(tlp);
        if (tlpSelected) {
            // Don't set default TLP yet since user hasn't confirmed
            this.setTLP(tlp);
        } else {
            const strictIndex =
                this.mostStrictTlpOption === null ? 0 : this.tlp_options.findIndex((opt) => opt.value === this.mostStrictTlpOption.value);
            const currentTlpIndex = this.tlp_options.findIndex((opt) => opt.key === tlp);

            if (currentTlpIndex < strictIndex) {
                const messageData = {
                    title: 'TLP Selection Confirmation',
                    message: `Selected ${this.tlp_options[currentTlpIndex].key} a less restrictive than the most restrictive ${this.tlp_options[strictIndex].key} in this bundle.`,
                };
                this.setTLP(tlp);
                this.onPageMsgs.push(messageData.message);
                this.selectedTlpOption = this.tlp_options[currentTlpIndex];
            } else {
                this.selectedTlpOption = this.tlp_options[currentTlpIndex];
                this.setTLP(tlp);
            }
        }
    }

    setTLP(tlp) {
        this.stixService.clearTlpPerVersion(this.tlpVersion);
        const tlpObj = this.tlp_options.find((x) => x.key === tlp);
        this.currentString = tlpObj.value;
        this.removeTLPOnly();
        this.stixService.objectMarkingReferences.push(this.currentString);

        switch (tlp) {
            case 'TLP:CLEAR':
            case 'TLP:WHITE':
                this.onPageMsgs.push('Disclosure is not limited.');
                break;
            case 'TLP:GREEN':
                this.onPageMsgs.push('Limited disclosure, restricted to the community.');
                break;
            case 'TLP:AMBER':
                this.onPageMsgs.push('Limited disclosure, restricted to participants’ organization and its clients.');
                break;
            case 'TLP:AMBER+STRICT':
                this.onPageMsgs.push('Limited disclosure, restricted to participants’ organization.');
                break;
            case 'TLP:RED':
                this.onPageMsgs.push('Not for disclosure, restricted to participants only.');
                break;
        }
    }

    removeTLPOnly(): void {
        if (this.stixService.objectMarkingReferences.length > 0) {
            this.stixService.objectMarkingReferences = this.stixService.objectMarkingReferences.filter(
                (obj) => !TLP20_OPTIONS.find((opt) => opt.id === obj)
            );
            this.stixService.objectMarkingReferences = this.stixService.objectMarkingReferences.filter(
                (obj) => !TLP_OPTIONS.find((opt) => opt.id === obj)
            );
        }
    }

    autoSetTLP() {
        let mostStrictIndex = 0;

        // Clear existing selection
        const existingTLP = this.stixService.objectMarkingReferences;
        if (existingTLP.length > 0) {
            const existingTlpIndex = this.tlp_options.findIndex((o) => o.value === existingTLP[0]);
            if (existingTlpIndex !== -1) {
                this.selectTLP(this.tlp_options[existingTlpIndex].key);
            }
        }

        // Find and set new selection
        this.stixService.bundle.objects.forEach((o) => {
            if (o.object_marking_refs && o.object_marking_refs.length > 0) {
                const foundIndex = this.tlp_options.findIndex((opt) => opt.value === o.object_marking_refs[0]);
                if (foundIndex > mostStrictIndex) {
                    mostStrictIndex = foundIndex;
                }
            }
        });

        setTimeout(() => {
            this.countTLP();
            this.mostStrictTlpOption = this.tlp_options[mostStrictIndex];
            this.selectTLP(this.tlp_options[mostStrictIndex].key);
        }, 500);
    }

    countTLP() {
        this.tlpCounts = this.stixService.countTLP();
    }

    close() {
        this.activeModal.close('cancel');
    }

    confirm() {
        this.activeModal.close({ type: 'confirm', data: this.selectedTlpOption, applyToAll: this.applyToAll });
    }
}
