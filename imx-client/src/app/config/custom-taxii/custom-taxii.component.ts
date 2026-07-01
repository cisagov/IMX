import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Inject, Output, ViewChild } from '@angular/core';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { StixService } from 'src/app/stix-service.service';
import { faUser, faBan, faArrowLeft, faFile, faSave, faTrash, faSpinner, faWaveSquare } from '@fortawesome/free-solid-svg-icons';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpHeaders } from '@angular/common/http';
import { LoggingService } from 'src/app/logging-service/logging.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-custom-taxii',
    templateUrl: './custom-taxii.component.html',
    styleUrls: ['./custom-taxii.component.css'],
    standalone: false,
})
export class CustomTaxiiComponent {
    private pemUpload: ElementRef;
    private keyUpload: ElementRef;
    private crtUpload: ElementRef;
    @Output('save') save: EventEmitter<any> = new EventEmitter();
    @Output('delete') delete: EventEmitter<any> = new EventEmitter();
    @ViewChild('pemUpload', { static: false }) set pemContent(content: ElementRef) {
        if (content && !this.isNewCustom) {
            this.pemUpload = content;
            content.nativeElement.files = this.pemTransfer.files;
            content.nativeElement.dispatchEvent(new Event('change'));
        }
    }
    @ViewChild('keyUpload', { static: false }) set keyContent(content: ElementRef) {
        if (content && !this.isNewCustom) {
            this.keyUpload = content;
            content.nativeElement.files = this.keyTransfer.files;
            content.nativeElement.dispatchEvent(new Event('change'));
        }
    }
    @ViewChild('crtUpload', { static: false }) set crtContent(content: ElementRef) {
        if (content && !this.isNewCustom) {
            this.crtUpload = content;
            content.nativeElement.files = this.crtTransfer.files;
            content.nativeElement.dispatchEvent(new Event('change'));
        }
    }

    faConnect = faWaveSquare;

    faUser = faUser;
    faBan = faBan;
    faArrowLeft = faArrowLeft;
    faFile = faFile;
    faSave = faSave;
    faTrash = faTrash;
    faSpinner = faSpinner;

    isGeneratingCert = false;
    showCustomTaxii = false;
    customTaxiiType = '';
    generateCert: boolean;
    certPassword: string;
    crtFile: any;
    keyFile: any;
    pemFile: any;
    connectionError: string = '';
    connectionErrorURL: string = '';
    customTaxiiArray;
    isNewCustom: boolean;
    certName: string = '';
    orgName: string = '';
    userRoles = ['imx-user'];
    certReady = false;
    manualCertInput = false;
    customInfo: {
        url: string;
        username: string;
        password: string;
        cert: string | File;
        key: string | File;
        roles: string[];
        useCert: boolean;
        pem: string | File;
        certPassword: string;
    };

    isLoadingRoots = false;
    isLoading = false;
    taxiiServer;

    pemTransfer = new DataTransfer();
    keyTransfer = new DataTransfer();
    crtTransfer = new DataTransfer();

    saved;

    private imxHeaders = new HttpHeaders().set(
        'Authorization',
        `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
    );

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private httpClient: HttpClient,
        private announcementService: AnnouncementService,
        public dialogRef: MatDialogRef<CustomTaxiiComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.taxiiServer = data.taxiiServer;
        this.isNewCustom = data.isNewCustom;
        this.customTaxiiArray = data.customTaxiiArray;
        if (data.id)
            this.httpClient.get(`${this.envService.env.imxServer.url}/taxii/${data.id}`, { headers: this.imxHeaders }).subscribe((resp: any) => {
                this.taxiiServer.url = resp.url;
                this.taxiiServer.password = resp.password;
                this.taxiiServer.username = resp.username;
                if (resp.useCert) {
                    this.userRoles = resp.roles;
                    this.customTaxiiType = 'cert';
                    this.generateCert = false;
                    this.certPassword = resp.certPassword;
                    const pem = new Blob([resp.pem], { type: 'application/x-pem-file' });
                    const pemFile = new File([pem], 'pem.pem', { type: 'application/x-pem-file' });
                    this.pemTransfer.items.add(pemFile);

                    const crt = new Blob([resp.cert.replace(/\n/g, '\n')], { type: 'application/x-x509-ca-cert' });
                    const crtFile = new File([crt], 'crt.crt', { type: 'application/x-x509-ca-cert' });
                    this.crtTransfer.items.add(crtFile);

                    const keyBlob = new Blob([resp.key.replace(/\n/g, '\n')], { type: 'application/x-x509-ca-cert' });
                    const keyFile = new File([keyBlob], 'key.key', { type: 'application/x-x509-ca-cert' });
                    this.keyTransfer.items.add(keyFile);
                } else {
                    this.customTaxiiType = 'basic';
                }
            });
    }

    genCert(bool: boolean) {
        if (bool === this.generateCert) return;

        if (bool) {
            this.generateCert = true;
            this.crtFile = '';
            this.pemFile = '';
            this.keyFile = '';
            this.certPassword = '';
            this.userRoles = ['imx-user'];
        } else {
            this.generateCert = false;
            this.crtFile = '';
            this.pemFile = '';
            this.keyFile = '';
            this.certPassword = '';
            this.userRoles = ['imx-user'];
            this.certName = '';
            this.orgName = '';
        }
    }

    saveConfig() {
        localStorage.setItem('customUrl', this.customInfo.url);
        this.save.emit(this.customInfo);
    }

    async checkConnection() {
        await this.envService.checkAuth('/config');

        if (this.customTaxiiType === 'basic') {
            this.isLoading = true;

            let urlArray = this.taxiiServer.url.split('/');
            let customUrl = '';
            if (urlArray.length >= 3) {
                customUrl = `${urlArray[0]}//${urlArray[2]}/taxii/${this.envService.env.taxiiServer.apiVersion}/`;
            } else {
                console.debug('Custom Taxii URL may be invalid');
                customUrl = this.taxiiServer.url;
            }
            const getDiscoveryURL = `${customUrl}taxii2/`;

            const httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);
            this.httpClient.get(getDiscoveryURL, { headers: httpHeaders }).subscribe(
                (data: any) => {
                    this.isLoading = false;
                    try {
                        console.info('Connection was successful at ', getDiscoveryURL);

                        this.saveInfo().then(() => {
                            this.saveConfig();
                            this.dialogRef.close();
                        });
                    } catch (e) {
                        this.connectionError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                        console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                        this.isLoadingRoots = false;
                        return;
                    }
                },
                (error) => {
                    this.isLoading = false;
                    let errMessage = `Error code [${error.status}]: Please double check the TAXII server information`;
                    this.connectionErrorURL = error.url;
                    this.connectionError = errMessage;
                    this.isLoadingRoots = false;
                    return;
                }
            );
        } else {
            //Cert upload check
            this.isLoading = true;

            this.crtFile = this.crtFile.trim();
            this.keyFile = this.keyFile.trim();
            this.pemFile = this.pemFile.trim();

            if (this.crtFile.endsWith('\n')) this.crtFile = this.crtFile.substring(0, this.crtFile.length - 2);
            if (this.pemFile.endsWith('\n')) this.pemFile = this.pemFile.substring(0, this.pemFile.length - 2);
            if (this.keyFile.endsWith('\n')) this.keyFile = this.keyFile.substring(0, this.keyFile.length - 2);

            this.crtFile = this.crtFile.replace(/\n/g, '\n');
            this.keyFile = this.keyFile.replace(/\n/g, '\n');

            if (!this.taxiiServer.url.endsWith('/')) this.taxiiServer.url += '/';

            const byo = {
                pem: this.pemFile,
                password: this.certPassword,
                roles: this.userRoles,
            };

            const byoHeaders = new HttpHeaders()
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

            this.httpClient.post(`${this.taxiiServer.url}admin/v1.0/pkcs12/byo`, byo, { headers: byoHeaders }).subscribe(
                (resp) => {
                    this.saveInfo().then(() => {
                        let urlArray = this.taxiiServer.url.split('/');
                        let customUrl = '';
                        if (urlArray.length >= 3) {
                            customUrl = `${urlArray[0]}//${urlArray[2]}/taxii/${this.envService.env.taxiiServer.apiVersion}/`;
                        } else {
                            console.debug('Custom Taxii URL may be invalid');
                            customUrl = this.taxiiServer.url;
                        }
                        const getDiscoveryURL = `${customUrl}taxii2/`;
                        const payload = {
                            method: 'get',
                            url: getDiscoveryURL,
                        };

                        this.httpClient
                            .post(
                                `${this.envService.env.imxServer.url}/proxy-custom/${this.taxiiServer.url.replace('https://', '').replace('/', '')}`,
                                payload,
                                { headers: this.imxHeaders }
                            )
                            .subscribe(
                                (resp) => {
                                    this.saveConfig();
                                    this.dialogRef.close();
                                },
                                (error) => {
                                    this.isLoading = false;
                                    let errMessage = `Error code [${error.status}]: Please double check the TAXII server information`;
                                    this.connectionErrorURL = error.url;
                                    this.connectionError = errMessage;
                                    this.isLoadingRoots = false;
                                    return;
                                }
                            );
                    });
                },
                (error) => {
                    this.isLoading = false;
                    let errMessage = `Error code [${error.status}]: Please double check the TAXII server information`;
                    this.connectionErrorURL = error.url;
                    this.connectionError = errMessage;
                    this.isLoadingRoots = false;
                    return;
                }
            );
        }
    }

    closeCustomModal() {
        this.dialogRef.close();
    }

    customIsValid(type) {
        if (type === 'basic') {
            if (!this.taxiiServer.url || !this.taxiiServer.username || !this.taxiiServer.password) return true;
        } else {
            if (
                !this.taxiiServer.url ||
                !this.taxiiServer.username ||
                !this.taxiiServer.password ||
                !this.keyFile ||
                !this.crtFile ||
                !this.pemFile ||
                this.userRoles.length < 1
            )
                return true;
            if (this.generateCert && (!this.certName || !this.certPassword)) return true;
        }

        return false;
    }

    deleteCustomTaxii() {
        const taxiiUrl = this.taxiiServer.url.replace('https://', '').replace('/', '');
        this.httpClient.delete(`${this.envService.env.imxServer.url}/taxii-delete/${taxiiUrl}`, { headers: this.imxHeaders }).subscribe(
            (resp: any) => {
                localStorage.removeItem('customUrl');
                this.delete.emit(taxiiUrl);
                this.dialogRef.close();
                this.announcementService.show('Custom TAXII Info Deleted', 'Custom TAXII information has been succesfully removed', 'success', false);
            },
            (err) => {
                this.dialogRef.close();
                this.announcementService.show(
                    'Custom TAXII Info Failed To Delete',
                    'An error occurred while trying to remove custom TAXII information',
                    'error',
                    false
                );
            }
        );
    }

    handleFileChange(event) {
        const reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onloadend = () => {
            if (event.target.id === 'pemUpload') {
                this.pemFile = reader.result as string;
                if (this.pemFile.endsWith('\n')) this.pemFile = this.pemFile.replace('\n', '');
            }
            if (event.target.id === 'crtUpload') {
                this.crtFile = reader.result as string;
            }
            if (event.target.id === 'keyUpload') {
                this.keyFile = reader.result as string;
            }
        };
    }

    async saveInfo() {
        return new Promise((resolve, reject) => {
            try {
                this.customInfo = {
                    url: this.taxiiServer.url,
                    username: this.taxiiServer.username,
                    password: this.taxiiServer.password,
                    cert: this.customTaxiiType === 'cert' ? this.crtFile : null,
                    key: this.customTaxiiType === 'cert' ? this.keyFile : null,
                    roles: this.userRoles,
                    useCert: this.customTaxiiType === 'cert' ? true : false,
                    pem: this.customTaxiiType === 'cert' ? this.pemFile : null,
                    certPassword: this.certPassword,
                };
                const taxiiUrl = this.taxiiServer.url.replace('https://', '').replace('/', '');
                this.httpClient
                    .post(`${this.envService.env.imxServer.url}/taxii/${taxiiUrl}`, this.customInfo, { headers: this.imxHeaders })
                    .subscribe(
                        (resp) => {
                            if (!this.customTaxiiArray.includes(taxiiUrl)) this.customTaxiiArray.push(taxiiUrl);
                            this.announcementService.show(
                                'Successfully saved custom TAXII info',
                                'IMX Server successfuly saved custom TAXII Server information',
                                'success',
                                false
                            );
                            resolve(true);
                        },
                        (error) => {
                            console.error(error);
                            reject(false);
                        }
                    );
            } catch (err) {
                console.error(err);
                this.announcementService.show(
                    'Failed to save custom TAXII Info',
                    'IMX Server failed to save custom TAXII Server information',
                    'error',
                    false
                );
                reject(false);
            }
        });
    }

    requestCert() {
        try {
            this.isGeneratingCert = true;
            const httpHeaders = new HttpHeaders()
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
            this.httpClient
                .post(`${this.envService.env.taxiiServer.url}admin/v1.0/pkcs12/${this.orgName}/${this.certName}`, this.userRoles, {
                    headers: httpHeaders,
                })
                .subscribe(
                    (resp: any) => {
                        this.certPassword = resp.byo.password;
                        this.crtFile = resp.crt;
                        this.keyFile = resp.key;
                        this.pemFile = resp.byo.pem;
                        this.announcementService.show(
                            'Certificate successfully generated',
                            "Certificated generated successfully. Click 'Connect' to proceed",
                            'success',
                            false
                        );
                        this.isGeneratingCert = false;
                    },
                    (err) => {
                        console.error(err);
                        this.isGeneratingCert = false;
                    }
                );
        } catch (err) {
            console.info(err);
            this.isGeneratingCert = false;
        }
    }

    switchCustomTaxiiType(type: string) {
        this.customTaxiiType = type;
    }

    switchManualInput(bool) {
        if (bool === this.manualCertInput) return;

        this.manualCertInput = bool;
        this.crtFile = '';
        this.pemFile = '';
        this.keyFile = '';
    }
}
