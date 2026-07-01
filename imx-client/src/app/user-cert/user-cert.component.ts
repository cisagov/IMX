import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from '../stix-service.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from '../env-service/env.service';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AnnouncementService } from '../announcement-service/announcement-service.service';

@Component({
    selector: 'app-user-cert',
    templateUrl: './user-cert.component.html',
    styleUrls: ['./user-cert.component.css'],
    standalone: false,
})
export class UserCertComponent {
    payload: {
        pem: string;
        password: string;
        roles: string[];
    } = {
        pem: '',
        password: '',
        roles: [],
    };

    faPlus = faPlus;
    faTrash = faTrash;

    roles: string[] = [];

    selectedRole = '';

    loading = false;

    private httpHeaders: HttpHeaders;

    constructor(
        private httpClient: HttpClient,
        public activeModal: NgbActiveModal,
        public stixService: StixService,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {}

    ngOnInit() {
        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.httpClient
            .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'roles', { headers: this.httpHeaders, observe: 'response' })
            .subscribe((resp) => {
                this.roles = resp.body;
            });
    }

    /**
     * Filters roles dropdown based on what role was added
     */
    filterRoles() {
        return this.roles.filter((r) => !this.payload.roles.some((ur) => ur === r));
    }

    /**
     * Add role to payload's roles
     * @param role Role to be added
     */
    addRole(role) {
        this.payload.roles.push(role);
        this.selectedRole = '';
    }

    /**
     * Removes role from payload's roles
     * @param role Role to be removed
     */
    removeRole(role) {
        this.payload.roles = this.payload.roles.filter((r) => r !== role);
    }

    close() {
        this.activeModal.close();
    }

    createUser() {
        const byoHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/json`);

        this.httpClient
            .post(`${this.stixService.getBaseURLs().baseAdminURL}pkcs12/byo`, this.payload, {
                headers: byoHeaders,
            })
            .subscribe({
                next: (data) => {
                    this.announcementService.show(
                        'Successfully Uploaded User Certificate',
                        'User certificate was successfully uploaded.',
                        'success',
                        false
                    );
                    this.close();
                },
                error: (err) => {
                    console.error(err);
                    this.announcementService.show(
                        'Failed To Upload Cert',
                        'TAXII Server has failed to upload user certificate: ' + err.message,
                        'error',
                        false
                    );
                },
            });
    }

    /**
     * Parse and encode the .p12 file as a base64 string
     * @param event upload event that includes the file uploaded
     */
    onFileChanged(event) {
        if (event.target.files.length == 0) {
            this.payload.pem = '';
            return;
        }

        for (let file of event.target.files) {
            const fileReader = new FileReader();

            fileReader.readAsArrayBuffer(file);

            fileReader.onload = () => {
                const arrayBuffer = fileReader.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);

                let binary = '';
                uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
                const base64 = btoa(binary);

                this.payload.pem = base64;
            };
        }
    }
}
