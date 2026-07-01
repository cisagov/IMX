import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-message-dialog',
    templateUrl: './message-dialog.component.html',
    styleUrls: ['./message-dialog.component.css'],
    standalone: false,
})
export class MessageDialogComponent implements OnInit {
    @Input() public messageObj: any;

    faBan = faBan;
    faCheck = faCheck;

    constructor(public activeModal: NgbActiveModal) {}

    ngOnInit(): void {
        if (this.messageObj.autoConfirm) {
            this.confirm();
        }
    }

    close() {
        this.activeModal.close('cancel');
    }

    confirm() {
        this.activeModal.close('confirm');
    }
}
