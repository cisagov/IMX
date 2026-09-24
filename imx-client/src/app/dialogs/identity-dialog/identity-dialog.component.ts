import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-identity-dialog',
    standalone: false,
    templateUrl: './identity-dialog.component.html',
    styleUrl: './identity-dialog.component.css',
})
export class IdentityDialogComponent implements OnInit {
    storedIdentities: any;

    constructor(public activeModal: NgbActiveModal) {}

    ngOnInit(): void {
        this.loadLocalIdentities();
    }

    loadLocalIdentities() {
        const idStorage = localStorage.getItem('identities');
        if (idStorage) {
            try {
                this.storedIdentities = JSON.parse(idStorage);
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }
    }

    compareIdentity(id: string): boolean {
        return localStorage.getItem('identity') === id;
    }

    onCancel() {
        this.activeModal.close();
    }
}
