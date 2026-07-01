import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-help-dialog',
    templateUrl: './help-dialog.component.html',
    styleUrls: ['./help-dialog.component.css'],
    standalone: false,
})
export class HelpDialogComponent implements OnInit {
    @Input() public messageObj: any;
    @Input() public buttonsToShow: any;

    faArrowAltCircleRight = faArrowAltCircleRight;
    faDownload = faDownload;
    scriptPath = '';
    videoPath = '';
    menuSelection = '';

    constructor(public activeModal: NgbActiveModal) {}

    ngOnInit(): void {
        if (!this.buttonsToShow || this.buttonsToShow.length === 0) {
            this.buttonsToShow = ['cancel', 'ok'];
        }
        this.menuSelection = this.messageObj.menu;
    }

    showButton(type) {
        return this.buttonsToShow.find((b) => b === type.toLowerCase()) !== undefined;
    }

    showTextOnly(index) {
        return this.messageObj.textOnlyIndex.find((i) => i === index) !== undefined;
    }

    close() {
        this.activeModal.close('cancel');
    }

    confirm() {
        this.activeModal.close('confirm');
    }
}
