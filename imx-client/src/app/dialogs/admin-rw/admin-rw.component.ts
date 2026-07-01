import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faTrash, faTrashAlt, faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
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
    reader: string;
    writer: string;
    readers: string[];
    writers: string[];

    faPlus = faPlus;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faBan = faBan;

    rwCidTemp: string;
    useExistingCollection: boolean;

    existingRoles = [];
    existingReaderRoles = [];
    existingWriterRoles = [];

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

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.httpClient
            .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'roles', { headers: this.httpHeaders, observe: 'response' })
            .subscribe((resp) => {
                this.existingRoles = resp.body;

                this.existingReaderRoles = this.existingRoles.filter((r) => !this.rw?.readers.some((ur) => ur === r));
                this.existingWriterRoles = this.existingRoles.filter((r) => !this.rw?.writers.some((ur) => ur === r));
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

    collectionTitleChange(event) {
        if (event.target.value) {
            const collection: any = this.collectionsForAllApiRoots.find((c: any) => c.title === event.target.value);

            if (collection) {
                this.rw.cId = collection.id;
                this.useExistingCollection = true;
            } else {
                this.rw.cId = this.rwCidTemp;
                this.useExistingCollection = false;
            }
            return;
        }

        this.rw.cId = this.rwCidTemp;
        this.useExistingCollection = false;
    }

    close() {
        const data = {
            type: 'cancel',
        };
        this.activeModal.close(data);
    }

    addReader() {
        this.rw.readers.push(this.reader);

        const index = this.existingReaderRoles.indexOf(this.reader);
        if (index >= 0) {
            this.existingReaderRoles.splice(index, 1);
        }

        this.reader = undefined;
    }

    removeReader(i) {
        const reader = this.rw.readers.splice(i, 1);

        const index = this.existingReaderRoles.indexOf(reader[0]);
        if (index < 0) {
            this.existingReaderRoles.push(reader[0]);
        }

        this.reader = undefined;
    }

    addWriter() {
        this.rw.writers.push(this.writer);

        const index = this.existingWriterRoles.indexOf(this.writer);
        if (index >= 0) {
            this.existingWriterRoles.splice(index, 1);
        }

        this.writer = undefined;
    }

    removeWriter(i) {
        const writer = this.rw.writers.splice(i, 1);

        const index = this.existingWriterRoles.indexOf(writer[0]);
        if (index < 0) {
            this.existingWriterRoles.push(writer[0]);
        }

        this.writer = undefined;
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
        return this.newRW ? 'ADD' : 'UPDATE';
    }

    selectRole(event: any, type) {
        if (event?.target?.value) {
            if (type === 'reader') {
                this.reader = event.target.value;
            } else {
                this.writer = event.target.value;
            }
        }
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
