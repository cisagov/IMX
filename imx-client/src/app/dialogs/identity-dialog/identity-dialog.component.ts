import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnvService } from 'src/app/env-service/env.service';
import { StixService } from 'src/app/stix-service.service';
import { db } from 'src/app/db.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-identity-dialog',
    standalone: false,
    templateUrl: './identity-dialog.component.html',
    styleUrls: ['./identity-dialog.component.css'],
})
export class IdentityDialogComponent implements OnInit {
    storedIdentities: any;
    filteredStoredIdentities: any;
    cisaId;
    openNewWindow: boolean;
    searchText: string = '';

    constructor(
        public activeModal: NgbActiveModal,
        private envService: EnvService,
        private stixService: StixService,
        private readonly router: Router
    ) {}

    ngOnInit(): void {
        this.loadLocalIdentities();
        this.cisaId = this.envService.env.defaultIdentity.id;
        this.openNewWindow = false;
    }

    loadLocalIdentities() {
        const idStorage = localStorage.getItem('identities');
        if (idStorage) {
            try {
                this.storedIdentities = JSON.parse(idStorage);
                this.filteredStoredIdentities = [...this.storedIdentities?.arr];
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }
    }

    filterIdentities() {
        this.filteredStoredIdentities = this.storedIdentities?.arr.filter((identity) => {
            if (
                identity.id.toLowerCase().includes(this.searchText.toLowerCase()) ||
                identity.name.toLowerCase().includes(this.searchText.toLowerCase())
            )
                return identity;
        });
    }

    compareIdentity(id: string): boolean {
        return localStorage.getItem('identity') === id;
    }

    onCancel() {
        this.activeModal.close();
    }

    public async editObject(stixObject): Promise<void> {
        // Set Modified with current time for new_version
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));

        if (this.openNewWindow) {
            url = url + '?new_version=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { new_version: true } });
        }
        window.scrollTo(0, 0);

        this.onCancel();
    }

    public async revokeObject(stixObject): Promise<void> {
        // Set Modified with current time for revocation
        if (stixObject.modified) {
            stixObject.modified = new Date().toISOString();
        }

        this.stixService.objectFromClient = stixObject;
        await db.saveItemBeingEdited(stixObject);

        let url = this.router.serializeUrl(this.router.createUrlTree(['/add-component/' + stixObject.type]));

        if (this.openNewWindow) {
            url = url + '?revocation=true';
            window.open(url, '_blank');
        } else {
            // Route using same tab, used for debugging
            this.router.navigate([url], { queryParams: { revocation: true } });
        }

        this.onCancel();
    }

    removeObject(id: string) {
        this.stixService.removeFromIdentityLocalStorage(id);
        if (this.compareIdentity(id)) localStorage.setItem('identity', this.envService.env.defaultIdentity.id);
        this.loadLocalIdentities();
    }

    setMainIdentity(id: string): void {
        return localStorage.setItem('identity', id);
    }

    addCISAIdentity(obj: any) {
        this.stixService.addComponent(obj);
    }
}
