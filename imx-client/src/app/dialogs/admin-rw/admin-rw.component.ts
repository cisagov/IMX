import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faTrash, faTrashAlt, faPlus, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-admin-rw',
    templateUrl: './admin-rw.component.html',
    styleUrls: ['./admin-rw.component.css'],
    standalone: false,
})
export class AdminRwComponent implements OnInit {
    @Input() public rw: any;
    @Input() public newRW: boolean;
    @Input() public collectionTitle: string;
    @Input() public collectionsForAllApiRoots: [];
    @Input() public collectionsExisting: [];

    cId: string;
    readers: string[];
    writers: string[];

    faPlus = faPlus;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faBan = faBan;
    faInfoCircle = faInfoCircle;

    rwCidTemp: string;
    useExistingCollection: boolean;

    existingRoles = [];

    httpHeaders: any;

    constructor(
        private readonly httpClient: HttpClient,
        public activeModal: NgbActiveModal,
        public stixService: StixService,
        private readonly envService: EnvService
    ) {
        this.readers = [];
        this.writers = [];
    }

    ngOnInit(): void {
        this.rwCidTemp = this.rw.cId;
        this.useExistingCollection = false;

        this.rw.readers ??= [];
        this.rw.writers ??= [];

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.httpClient
            .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'roles', { headers: this.httpHeaders, observe: 'response' })
            .subscribe((resp) => {
                this.existingRoles = resp.body;
            });
    }

    collectionsList() {
        let collections = [];

        this.collectionsForAllApiRoots.forEach((c: any) => {
            if (!this.collectionsExisting.find((ce: any) => ce.id === c.id)) {
                collections.push(c);
            }
        });

        return collections;
    }

    setCollectionMode(useExisting: boolean) {
        this.useExistingCollection = useExisting;
        this.collectionTitle = '';
        this.rw.cId = this.rwCidTemp;
    }

    collectionTitleChange(event) {
        const collection: any = this.collectionsForAllApiRoots.find((c: any) => c.title === event.target.value);

        this.rw.cId = collection ? collection.id : this.rwCidTemp;
    }

    close() {
        const data = {
            type: 'cancel',
        };
        this.activeModal.close(data);
    }

    selectedRoles(type): string[] {
        return (type === 'reader' ? this.rw?.readers : this.rw?.writers) ?? [];
    }

    isSelected(role, type) {
        return this.selectedRoles(type).includes(role);
    }

    toggleRole(role, type) {
        const roles = this.selectedRoles(type);
        const index = roles.indexOf(role);

        if (index >= 0) {
            roles.splice(index, 1);
        } else {
            roles.push(role);
        }
    }

    removeRole(i, type) {
        this.selectedRoles(type).splice(i, 1);
    }

    allSelected(type) {
        return this.existingRoles.length > 0 && this.existingRoles.every((r) => this.isSelected(r, type));
    }

    toggleSelectAll(type) {
        const roles = this.selectedRoles(type);

        if (this.allSelected(type)) {
            roles.length = 0;
        } else {
            this.existingRoles.filter((r) => !roles.includes(r)).forEach((r) => roles.push(r));
        }
    }

    toggleLabel(type) {
        const count = this.selectedRoles(type).length;
        return count ? `${count} selected` : 'Select groups...';
    }

    add() {
        let data = {};

        if (this.newRW) {
            data = {
                type: 'add',
                rw: this.rw,
                title: this.collectionTitle,
                useExistingCollection: this.useExistingCollection,
            };
        } else {
            data = {
                type: 'update',
                rw: this.rw,
            };
        }
        this.activeModal.close(data);
    }

    addButtonText() {
        return this.newRW ? 'Add' : 'Update';
    }

    disableRW(type) {
        const thisCollection: any = this.collectionsExisting.find((c: any) => c.id === this.rw.cId);

        if (thisCollection && !thisCollection.can_read && type === 'reader') {
            return true;
        }

        if (thisCollection && !thisCollection.can_write && type === 'writer') {
            return true;
        }

        return false;
    }
}
