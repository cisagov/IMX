import { Component, OnInit, Inject } from '@angular/core';
import { Extension } from '../../models/extension';
import { StixService } from '../../stix-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faTrash, faEdit, faPlus, faBan, faWrench, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExtensionsData {
    selectors: [];
    lang: '';
    marking_ref: '';
}

@Component({
    selector: 'app-extensions-dialog',
    templateUrl: './extensions-dialog.component.html',
    styleUrls: ['./extensions-dialog.component.css'],
    standalone: false,
})
export class ExtensionsDialogComponent implements OnInit {
    faTrash = faTrash;
    faEdit = faEdit;
    faPlus = faPlus;
    faBan = faBan;
    faWrench = faWrench;
    faInfoCircle = faInfoCircle;

    currentExtension: any = new Extension('', '', new Map());
    isAddingExtensions: boolean = false;
    isEditingExtension: boolean = false;
    newExtensions: Extension[] = [];
    errorMessage: string = '';
    selectedExtension: any;
    page: string;
    pageSize: number;
    validationMessage: string = ''; //Error message for the modal window
    predefined: boolean = true;
    toplevel: boolean = false;
    type_options: string[] = [];
    toplevel_props: string[] = [];
    headingTracker: number = 0;
    headings: string[] = []; // DEPRECATED
    property: string = '';
    value: string = '';
    currentArrString = {};
    subObject = {};
    editedSubObject;
    subObjectType: string;
    validationError = new Map();
    objectRegex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
    predefinedRegex = new RegExp(/^{"([-_a-z0-9]*)":{(.*)}}$/);

    customProp = new Map();
    nameError = '';

    hashes = new Map();
    hashOptions = [
        { name: 1, value: 'MD5' },
        { name: 2, value: 'SHA-1' },
        { name: 3, value: 'SHA-256' },
        { name: 3, value: 'SHA-512' },
        { name: 4, value: 'SHA3-256' },
        { name: 5, value: 'SHA3-512' },
        { name: 6, value: 'SSDEEP' },
        { name: 7, value: 'TLSH' },
    ];
    regExIntegerMatch = new RegExp('^cb|dwX|dwY|dwXSize|dwYSize|dwXCountChars|dwYCountChars$');
    regExStringMatch = new RegExp('^lpDesktop|lpTitle|dwFillAttribute|dwFlags|wShowWindow|hStdInput|hStdOutput|hStdError$');
    customStringPropKeys: string[] = [];
    customArrPropKeys: string[] = [];
    modalRef: any;
    modalError = new Map();
    tooltip: string;
    componentData: any;
    extensionsId;
    filteredExtensions = [];

    constructor(
        public modalService: NgbModal,
        public stixService: StixService,
        public dialogRef: MatDialogRef<ExtensionsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ExtensionsData
    ) {}

    ngOnInit(): void {
        this.extensionsId = this.stixService.bundle.objects.filter((obj) => obj.id.includes('extension-definition--') && this.hasProperties(obj));

        const file = [
            {
                name: 'Archive File Extension',
                id: 'archive-ext',
            },
            {
                name: 'PDF File Extension',
                id: 'pdf-ext',
            },
            {
                name: 'NTFS File Extension',
                id: 'ntfs-ext',
            },
            {
                name: 'Raster Image File Extension',
                id: 'raster-image-ext',
            },
            {
                name: 'Windows PE Binary File Extension',
                id: 'windows-pebinary-ext',
            },
        ];
        const netTraffic = [
            {
                name: 'HTTP Request Extension',
                id: 'http-request-ext',
            },
            {
                name: 'ICMP Extension',
                id: 'icmp-ext',
            },
            {
                name: 'Network Socket Extension',
                id: 'socket-ext',
            },
            {
                name: 'TCP Extension',
                id: 'tcp-ext',
            },
        ];
        const process = [
            {
                name: 'Windows Process Extension',
                id: 'windows-process-ext',
            },
            {
                name: 'Windows Service Extension',
                id: 'windows-service-ext',
            },
        ];
        const userAcc = [
            {
                name: 'Unix Account Extension',
                id: 'unix-account-ext',
            },
        ];
        const x509 = [
            {
                name: 'X.509 V3 Extensions',
                id: 'x509_v3_extensions',
            },
        ];
        const impact = [
            {
                name: 'Availability Extension',
                id: 'availability-ext',
            },
            {
                name: 'Confidentiality Extension',
                id: 'confidentiality-ext',
            },
            {
                name: 'External Extension',
                id: 'external-ext',
            },
            {
                name: 'Integrity Extension',
                id: 'integrity-ext',
            },
            {
                name: 'Monetary Extension',
                id: 'monetary-ext',
            },
            {
                name: 'Physical Extension',
                id: 'physical-ext',
            },
            {
                name: 'Traceability Extension',
                id: 'traceability-ext',
            },
        ];

        if (this.stixService.currentType === 'file') this.extensionsId = [...this.extensionsId, ...file];
        else if (this.stixService.currentType === 'network-traffic') this.extensionsId = [...this.extensionsId, ...netTraffic];
        else if (this.stixService.currentType === 'process') this.extensionsId = [...this.extensionsId, ...process];
        else if (this.stixService.currentType === 'user-account') this.extensionsId = [...this.extensionsId, ...userAcc];
        else if (this.stixService.currentType === 'x509-certificate') this.extensionsId = [...this.extensionsId, ...x509];
        else if (this.stixService.currentType === 'impact') this.extensionsId = [...this.extensionsId, ...impact];

        this.filteredExtensions = JSON.parse(JSON.stringify(this.extensionsId));
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close(this.currentExtension);
    }

    validID(): boolean {
        if (this.currentExtension.extension_id != '') {
            const idRegex = new RegExp('^extension-definition--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
            if (!idRegex.test(this.currentExtension.extension_id) && !this.currentExtension.extension_id.includes('-ext')) {
                this.errorMessage =
                    "Must begin with 'extension-definition--' and followed by a UUID (i.e. extension-definition--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)";
                return false;
            }
            if (JSON.stringify(this.stixService.extensions).includes(this.currentExtension.extension_id)) {
                this.errorMessage = 'WARNING: ID already in use. Please use a different Extension';
                return false;
            }
        }
        this.errorMessage = '';
        return true;
    }

    hasProperties(obj: any): boolean {
        if (obj == undefined || !obj.extension_types) return false;
        if (!this.stixService.customObjInfo['editing'] || this.stixService.customObjInfo['parent']) {
            return JSON.stringify(obj.extension_types).includes('property-extension');
        }
        return true;
    }

    getTypes(): void {
        if (!this.stixService.customObjInfo['editing']) {
            this.filteredExtensions = this.extensionsId.filter((ext) => {
                if (ext.id && ext.id.toLowerCase()?.includes(this.currentExtension.extension_id?.toLowerCase())) return true;
                else if (ext.name && ext.name.toLowerCase()?.includes(this.currentExtension.extension_id?.toLowerCase())) return true;

                return false;
            });
        }

        this.validID();
        this.currentExtension.extension_type = '';
        if (this.currentExtension.extension_id.includes('extension-definition--')) {
            this.predefined = false;
            let obj = this.stixService.getObjectFromID(this.currentExtension.extension_id);

            if (obj === undefined) {
                this.type_options = ['Property Extension'];
            } else {
                this.type_options = JSON.parse(JSON.stringify(obj.extension_types));
                for (let i = 0; i < this.type_options.length; i++) {
                    let t = '';
                    switch (this.type_options[i]) {
                        // New Objects are handled when creating Extension Definition
                        case 'new-sdo':
                            t = 'New SDO';
                            break;
                        case 'new-sro':
                            t = 'New SRO';
                            break;
                        case 'new-sco':
                            t = 'New SCO';
                            break;
                        case 'property-extension':
                            t = 'Property Extension';
                            break;
                        case 'toplevel-property-extension':
                            t = 'Toplevel Property Extension';
                            this.toplevel_props = obj.extension_properties;
                            break;
                        default:
                            t = this.type_options[i];
                    }
                    this.type_options[i] = t;
                }
                this.type_options = this.type_options.filter((element) => {
                    return element !== '';
                });
            }
        } else this.predefined = true;
    }

    isValid(): boolean {
        let id = this.currentExtension.extension_id;
        return id != '' && (!id.includes('extension-definition') || this.currentExtension.extension_type != '');
    }
}
