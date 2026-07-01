import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StixService } from 'src/app/stix-service.service';
import { faChevronLeft, faEdit, faSave, faStop, faTrash, faTrashAlt, faPlus, faBan, faKey } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { AdminService } from '../admin-service/admin.service';

@Component({
    selector: 'app-admin-user',
    templateUrl: './admin-user.component.html',
    styleUrls: ['./admin-user.component.css', '../dashboard/dashboard.component.css', '../admin-marking-group/admin-marking-group.component.css'],
    standalone: false,
})
export class AdminUserComponent implements OnInit, OnDestroy {
    @Input() userInput: any;
    @Output() back: EventEmitter<any>;

    newObject = true;
    newRole = null;
    addNewRole = false;

    faChevronLeft = faChevronLeft;
    faEdit = faEdit;
    faSave = faSave;
    faStop = faStop;
    faTrash = faTrash;
    faTrashAlt = faTrashAlt;
    faPlus = faPlus;
    faBan = faBan;
    faKey = faKey;

    editingUsername = false;
    currentUsername = '';
    user;
    errorMessages = [];
    existingRoles = [];

    isChecked = false;
    hasCert: boolean;

    pem: string = '';
    certType: '' | 'pk12' | 'crt' = '';

    loading = false;

    private readonly httpHeaders: HttpHeaders;
    private readonly imxHeaders: HttpHeaders;

    constructor(
        private readonly httpClient: HttpClient,
        public stixService: StixService,
        private readonly announcementService: AnnouncementService,
        private readonly envService: EnvService,
        private readonly adminService: AdminService
    ) {
        this.newRole = undefined;

        this.back = new EventEmitter();

        this.httpHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.imxHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );
    }

    ngOnInit(): void {
        this.newObject = Object.keys(this.userInput).length === 0;

        this.user = {};
        for (let field in this.userInput) {
            if (field == 'authType') continue;

            this.user[field] = this.userInput[field];
        }

        this.user.roles = this.user?.roles?.length > 0 ? this.user.roles.slice() : [];

        if (this.newObject) {
            this.user.user = null;
            this.user.roles = [];
            this.user.password = null;
            this.editingUsername = true;
        }

        this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
            this.httpClient
                .get<any>(this.stixService.getBaseURLs().baseAdminURL + 'roles', { headers: header, observe: 'response' })
                .subscribe((resp) => {
                    this.existingRoles = resp.body;

                    this.existingRoles = this.filterExistingRoles();
                });
        });

        this.hasCertificate();
    }

    ngOnDestroy(): void {
        this.adminService.currentUser = null;
    }

    filterExistingRoles() {
        return this.existingRoles.filter((r) => !this.user.roles.some((ur) => ur === r));
    }

    showPassword() {
        return !this.envService.env.keycloak.enabled;
    }

    editUsername() {
        this.editingUsername = true;

        if (this.user.user) {
            this.currentUsername = this.user.user;
        } else {
            this.currentUsername = '';
        }
    }

    saveUsername() {
        this.user.user = this.currentUsername;
        this.editingUsername = false;
    }

    cancelUsername() {
        this.editingUsername = false;
        this.currentUsername = null;
    }

    addRole() {
        if (this.user.roles) {
            this.user.roles.push(this.newRole);
        } else {
            this.user['roles'] = [];
            this.user.roles.push(this.newRole);
        }

        const index = this.existingRoles.indexOf(this.newRole);
        if (index >= 0) {
            this.existingRoles.splice(index, 1);
        }

        this.newRole = undefined;
    }

    removeRole(roleIndex) {
        const role = this.user.roles.splice(roleIndex, 1);

        const index = this.existingRoles.indexOf(role[0]);
        if (index < 0) {
            this.existingRoles.push(role[0]);
        }

        this.newRole = undefined;
    }

    async backToMain(event = null) {
        try {
            this.errorMessages = [];

            this.loading = true;

            if (event === 'save') {
                if (this.hasCert) {
                    await this.removeCertificate();
                    await this.assignCertificate();
                }
                let url = '';
                const emitObj = { type: 'save-user', data: this.user };

                if (this.pem && this.user.password) {
                    url = `${this.stixService.getBaseURLs().baseAdminURL}pkcs12/byo`;
                }
                if (this.newObject) {
                    // New object
                    url = this.stixService.getBaseURLs().baseAdminURL + 'user?create=true';
                } else {
                    // Update existing object
                    url = this.stixService.getBaseURLs().baseAdminURL + 'user';
                }

                this.user.password = this.user.password ? this.user.password : null;

                // User needs to be a part of at a minmum a predefined group if it is defined in env file
                if (
                    this.user.roles &&
                    this.envService.env.adminServer.baselineGroup &&
                    this.envService.env.adminServer.baselineGroup.length > 0 &&
                    !this.user.roles.find((r) => r === this.envService.env.adminServer.baselineGroup)
                ) {
                    this.user.roles.push(this.envService.env.adminServer.baselineGroup);
                }

                if (this.pem && this.certType) {
                    const byoHeaders = new HttpHeaders()
                        .set('Accept', 'application/json')
                        .set(
                            'Authorization',
                            `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`
                        )
                        .set('Content-Type', `application/json`);

                    const payload: any = {
                        roles: this.user.roles,
                    };

                    if (this.user.password) {
                        payload.password = this.user.password;
                    }

                    if (this.certType == 'crt') {
                        payload.pem = this.pem;
                    } else if (this.certType == 'pk12') {
                        payload.p12 = this.pem;
                    }

                    this.httpClient
                        .post(`${this.stixService.getBaseURLs().baseAdminURL}pkcs12/byo`, payload, {
                            headers: byoHeaders,
                        })
                        .subscribe({
                            next: (data: any) => {
                                if (data.password) {
                                    emitObj.data.password = data.password;
                                    emitObj.data.user = data.user;
                                    this.announcementService.show(
                                        'Successfully Uploaded User Certificate',
                                        'User certificate was successfully uploaded.',
                                        'success',
                                        false
                                    );

                                    this.closeComponent();
                                }
                            },
                            error: (err) => {
                                console.error(err);
                                this.announcementService.show(
                                    'Failed To Upload Cert',
                                    'TAXII Server has failed to upload user certificate: ' + err.message,
                                    'error',
                                    false
                                );
                                this.loading = false;
                            },
                        });
                } else {
                    this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                        this.httpClient.post<any>(url, this.user, { headers: header }).subscribe({
                            next: (resp: any) => {
                                if (this.errorMessages.length === 0 && resp.password) {
                                    emitObj.data.password = resp.password;
                                    this.closeComponent();
                                }
                            },
                            error: (err: any) => {
                                this.handleError(err, 'Please check user parameters.');
                            },
                        });
                    });
                }
            } else {
                const emitObj = { type: 'cancel' };
                this.closeComponent(true);
            }
        } catch (e) {
            this.loading = false;
        }
    }

    handleError(err, defaultMsg = '') {
        this.loading = false;
        if (err.status >= 400 && err.error?.description) {
            this.errorMessages.push('Error: ' + err.error.description);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        } else {
            this.errorMessages.push('Error: ' + defaultMsg);
            setTimeout(() => {
                this.errorMessages = [];
            }, 8000);
        }
    }

    selectRole(event: any) {
        if (event?.target?.value) {
            this.newRole = event.target.value;
        }
    }

    hasCertificate() {
        this.httpClient
            .get<any>(this.envService.env.imxServer.url + `/cert/${this.user.user}`, { headers: this.imxHeaders, observe: 'response' })
            .subscribe({
                next: (resp) => {
                    if (resp.body?.username) this.hasCert = true;
                    else this.hasCert = false;
                },
                error: (err) => {
                    this.hasCert = false;
                },
            });
    }

    postRoles(url, httpHeaders) {
        return new Promise((resolve, reject) => {
            this.httpClient.post<any>(url, this.user.roles, { headers: httpHeaders, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    postImxResponse(imxUrl, response) {
        return new Promise((resolve, reject) => {
            this.httpClient.post<any>(imxUrl, response.body, { headers: this.imxHeaders, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    getCert(certHeaders) {
        return new Promise((resolve, reject) => {
            this.httpClient.get<any>(this.envService.env.imxServer.url + '/cert', { headers: certHeaders }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    async assignCertificate() {
        try {
            const url = this.stixService.taxiiServer.url + `admin/v1.0/pkcs10/DFTA/${this.user.user}`;
            const imxUrl = this.envService.env.imxServer.url + '/cert/' + this.user.user;

            const httpHeaders = new HttpHeaders()
                .set('Accept', '*/*')
                .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
                .set('Content-Type', `application/json`);

            const response: any = await this.postRoles(url, httpHeaders);
            if (response.body) {
                try {
                    await this.postImxResponse(imxUrl, response);
                    this.hasCert = true;

                    let certHeaders = new HttpHeaders().set(
                        'Authorization',
                        `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
                    );

                    this.announcementService.show(
                        'Certificate generated',
                        'Certificate has been generated and assigned to the user',
                        'success',
                        false
                    );
                    try {
                        const certRes: any = await this.getCert(certHeaders);
                        if (certRes.data) {
                            this.stixService.certFound = true;
                            this.stixService.cert = certRes.data.pkcs10;
                        }
                    } catch (err) {
                        console.error('Cert is not for user');
                        console.error(err);
                    }
                } catch (imxErr) {
                    this.httpClient
                        .delete<any>(this.stixService.taxiiServer.url + `admin/v1.0/user/${response.body.user.user}`, {
                            headers: httpHeaders,
                            observe: 'response',
                        })
                        .subscribe({
                            next: (resp) => {
                                this.handleError(imxErr, 'Failed to post Cert to IMX Server');
                            },
                            error: (err) => {
                                this.handleError(err, 'Error while creating user certificate: certificate persists on TAXII Server');
                            },
                        });
                }
            } else this.handleError({}, 'TAXII Server did not properly return certification');
        } catch (err) {
            this.handleError(err, 'Failed to request TAXII Client for self-signed cert');
        }
    }

    getUserCert(imxUrl) {
        return new Promise((resolve, reject) => {
            this.httpClient.get<any>(imxUrl, { headers: this.imxHeaders, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    deleteUserCert(imxUrl) {
        return new Promise((resolve, reject) => {
            this.httpClient.delete<any>(imxUrl, { headers: this.imxHeaders, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    deleteUserTaxiiCert(url, username, httpHeaders) {
        return new Promise((resolve, reject) => {
            this.httpClient.delete<any>(url + username, { headers: httpHeaders, observe: 'response' }).subscribe({
                next: (resp) => {
                    resolve(resp);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }

    isCertRemoved(certHeaders) {
        return new Promise((resolve, reject) => {
            this.httpClient.get<any>(this.envService.env.imxServer.url + '/cert', { headers: certHeaders }).subscribe({
                next: (resp) => {
                    reject(resp);
                },
                error: (err) => {
                    console.error('Removed');
                    this.stixService.certFound = false;
                    this.stixService.cert = '';
                    resolve(err);
                },
            });
        });
    }

    async deleteCertFromIMX(imxUrl, isErr) {
        try {
            const imxResp: any = await this.deleteUserCert(imxUrl);
            if (imxResp.body?.data) {
                this.hasCert = false;
                this.stixService.certFound = isErr ? false : this.stixService.certFound;
                this.stixService.cert = isErr ? '' : this.stixService.cert;

                this.announcementService.show(
                    'Successfully removed certificate',
                    'The certificate associated with the user has been removed',
                    'success',
                    false
                );

                let certHeaders = new HttpHeaders().set(
                    'Authorization',
                    `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
                );
                await this.isCertRemoved(certHeaders);
            } else this.handleError({}, 'Failed to remove certificate');
        } catch (imxErr) {
            this.handleError(imxErr, 'IMX Server failed to removed the certificate for user');
        }
    }

    async removeCertificate() {
        try {
            const url = this.stixService.taxiiServer.url + `admin/v1.0/user/`;
            const imxUrl = this.envService.env.imxServer.url + '/cert/' + this.user.user;
            const httpHeaders = new HttpHeaders()
                .set('Accept', '*/*')
                .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
                .set('Content-Type', `application/json`);

            const resp: any = await this.getUserCert(imxUrl);
            if (resp.body?.username) {
                const username = resp.body.username;
                try {
                    await this.deleteUserTaxiiCert(url, username, httpHeaders);
                    await this.deleteCertFromIMX(imxUrl, false);
                } catch (taxiiErr) {
                    console.error(taxiiErr);
                    await this.deleteCertFromIMX(imxUrl, true);
                }
            } else this.handleError({}, 'IMX Server failed to find the certificate associated with the user');
        } catch (err) {
            this.handleError(err, 'IMX Server failed to find the certificate associated with the user');
        }
    }

    onFileChanged(event) {
        if (event?.target?.files?.length == 0) {
            this.pem = '';
            this.certType = '';
            return;
        }

        for (let file of event.target.files) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            const fileReader = new FileReader();

            if (ext === 'pem' || ext === 'crt') {
                fileReader.onload = () => {
                    let text = fileReader.result as string;
                    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    const escaped = text.replace(/\n/g, '\n');

                    this.certType = 'crt';
                    this.pem = escaped;
                };

                fileReader.readAsText(file);
            } else if (ext === 'p12') {
                fileReader.readAsArrayBuffer(file);

                fileReader.onload = () => {
                    const arrayBuffer = fileReader.result as ArrayBuffer;
                    const uint8Array = new Uint8Array(arrayBuffer);

                    let binary = '';
                    uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
                    const base64 = btoa(binary);

                    this.certType = 'pk12';
                    this.pem = base64;
                };
            }
        }
    }

    removeFile(event) {
        event.stopPropagation();
        this.pem = '';
        this.certType = '';
    }

    isValid() {
        if (!this.user.user && !this.pem) return false;

        return true;
    }

    isCert() {
        return this.user.user?.includes('CN=');
    }

    closeComponent(skip = false) {
        if (skip) {
            this.adminService.currentUser = null;
        } else {
            setTimeout(() => {
                this.adminService.currentUser = null;
            }, 1000);
        }
    }
}
