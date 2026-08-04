import { Component } from '@angular/core';
import { Extension } from '../models/extension';
import { StixService } from '../stix-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ArchiveExtension } from './predefined/archive-ext';
import { PDFExtension } from './predefined/pdf-ext';
import { RasterImageExtension } from './predefined/raster-image-ext';
import { NTFSExtension } from './predefined/ntfs-ext';
import { WindowsPEBinaryExtension } from './predefined/windows-pebinary-ext';
import { HTTPRequestExtension } from './predefined/http-request-ext';
import { ICMPExtension } from './predefined/icmp-ext';
import { faTrash, faEdit, faPlus, faBan, faPlusCircle, faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { SocketExtension } from './predefined/socket-ext';
import { TCPExtension } from './predefined/tcp-ext';
import { WindowsProcessExtension } from './predefined/windows-process-ext';
import { WindowsServiceExtension } from './predefined/windows-service-ext';
import { UnixAccountExtension } from './predefined/unix-account-ext';
import { X509V3Extensions } from './predefined/x509_v3_extensions';
import { MatDialog } from '@angular/material/dialog';
import { ExtensionsDialogComponent } from './extensions-dialog/extensions-dialog.component';
import { ImpactExtensionsDialogComponent } from '../incident-core-extension/impact-extensions/impact-extensions-dialog.component';
import { AcsDialogComponent } from '../dialogs/acs-dialog/acs-dialog.component';

@Component({
    selector: 'app-extensions',
    templateUrl: './extensions.component.html',
    styleUrls: ['./extensions.component.css'],
    standalone: false,
})
export class ExtensionsComponent {
    faTrash = faTrash;
    faEdit = faEdit;
    faPlus = faPlus;
    faBan = faBan;
    faPlusCircle = faPlusCircle;
    faSave = faSave;
    faArrowLeft = faArrowLeft;

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

    tracker: any = {}; //It can be done as an array but removing using filter increases time complexity

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
    editIndex: number | null = null;

    constructor(
        public modalService: NgbModal,
        public stixService: StixService,
        public extensionsDialog: MatDialog
    ) {
        this.tooltip = 'Extend existing STIX objects or to create entirely new STIX objects in a standardized way.';
    }

    openDialog(modal) {
        this.resetExtension();
        const dialogRef = this.extensionsDialog.open(ExtensionsDialogComponent, {
            data: this.currentExtension,
            minHeight: '200px',
            width: `${window.innerWidth / 1.5}px`,
            position: {
                top: '230px',
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && !result['extension_type'].includes('New')) {
                this.currentExtension = result;
                let id = this.currentExtension.extension_id;
                if (this.stixService.currentType == 'impact' && id.substring(id.length - 3) == 'ext') {
                    const dialogRef2 = this.extensionsDialog.open(ImpactExtensionsDialogComponent, {
                        data: { type: id },
                        height: '600px',
                        width: `${(window.innerWidth / 3) * 2}px`,
                    });
                    dialogRef2.afterClosed().subscribe((result) => {
                        if (result) {
                            this.resetExtension();
                        }
                    });
                } else {
                    this.extensionModal(modal);
                }
            } else if (!result) {
                this.currentExtension = new Extension('', '', new Map());
            } else {
                let t = result['extension_type'].replace(/ /, '-').toLowerCase();
                this.stixService.customObjInfo['type'] = t;
                t = '{"' + result.extension_id + '":{"extension_type":"' + t + '"}}';
                this.stixService.extensions.push(JSON.parse(t));
                this.stixService.customObjInfo['parent'] = result.extension_id;
                this.resetExtension();
            }
        });
    }

    addExtension(): void {
        let component: any = this.currentExtension;

        if (this.predefined || this.toplevel) {
            // Moved here to future-proof toplevel in the case that we support booleans
            for (let c in component) {
                // Problem with booleans on edit
                if (component[c] == 'undefined') {
                    delete component[c];
                }
            }
        }
        if (!this.predefined) {
            this.headings.push(this.currentExtension.extension_type + ': ' + this.currentExtension.extension_id);
            delete component.extensions;
        } else {
            this.headings.push(this.currentExtension.extension_id);
            delete component.extension_type;

            switch (this.currentExtension.extension_id) {
                case 'archive-ext':
                    component.contains_refs = this.stixService.stringArrays.get('ext_contains_refs');
                    this.stixService.stringArrays.delete('ext_contains_refs');
                    break;
                case 'ntfs-ext':
                    break;
                case 'pdf-ext':
                    component.is_optimized = JSON.parse(component.is_optimized || '""');

                    let pdf_temp = this.stixService.stringArrays.get('document_info_dict');
                    for (let i in pdf_temp) {
                        let split = pdf_temp[i].split(': ');
                        component.document_info_dict.set(split[0], split[1]);
                        component.document_info_dict[split[0]] = split[1];
                    }
                    this.stixService.stringArrays.delete('document_info_dict');
                    break;
                case 'raster-image-ext':
                    let raster_temp = this.stixService.stringArrays.get('exif_tags');
                    for (let i in raster_temp) {
                        let split = raster_temp[i].split(': ');
                        component.exif_tags.set(split[0], split[1]);
                        component.exif_tags[split[0]] = split[1];
                    }
                    this.stixService.stringArrays.delete('exif_tags');
                    break;
                case 'windows-pebinary-ext':
                    component.time_date_stamp = JSON.stringify(component.time_date_stamp);
                    if (component.time_date_stamp.length > 0) {
                        const regex = new RegExp(/^"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z"$/);
                        if (regex.test(component.time_date_stamp))
                            component.time_date_stamp = JSON.parse(
                                component.time_date_stamp.substring(0, 20) + component.time_date_stamp.substring(24, 26)
                            );
                    } else delete component.time_date_stamp;
                    break;
                case 'http-request-ext':
                    let http_temp = this.stixService.stringArrays.get('request_header');
                    for (let i in http_temp) {
                        let split = http_temp[i].split(': ');
                        component.request_header.set(split[0], split[1]);
                        component.request_header[split[0]] = split[1];
                    }
                    this.stixService.stringArrays.delete('request_header');
                    break;
                case 'icmp-ext':
                    // Nothing to do
                    break;
                case 'socket-ext':
                    component.is_blocking = JSON.parse(component.is_blocking || '""');
                    component.is_listening = JSON.parse(component.is_listening || '""');
                    component.socket_descriptor = parseInt(component.socket_descriptor);
                    component.socket_handle = parseInt(component.socket_handle);

                    let socket_temp = this.stixService.stringArrays.get('options');
                    for (let i in socket_temp) {
                        let split = socket_temp[i].split(': ');
                        component.options.set(split[0], parseInt(split[1]));
                        component.options[split[0]] = parseInt(split[1]);
                    }
                    this.stixService.stringArrays.delete('options');
                    break;
                case 'tcp-ext':
                    //Nothing to do
                    break;
                case 'windows-process-ext':
                    // Reference http://www.cs.rpi.edu/courses/fall01/os/STARTUPINFO.html
                    component.aslr_enabled =
                        component.aslr_enabled && component.aslr_enabled !== 'undefined' && component.aslr_enabled !== ''
                            ? JSON.parse(component.aslr_enabled)
                            : '""';
                    component.dep_enabled =
                        component.dep_enabled && component.dep_enabled !== 'undefined' && component.dep_enabled !== ''
                            ? JSON.parse(component.dep_enabled)
                            : '""';

                    let process_temp = this.stixService.stringArrays.get('startup_info');
                    for (let i in process_temp) {
                        let split = process_temp[i].split(': ');

                        if (this.regExIntegerMatch.test(split[0]) && !!parseInt(split[1])) {
                            component.startup_info[split[0]] = parseInt(split[1]);
                        } else {
                            component.startup_info[split[0]] = split[1];
                        }
                    }
                    this.stixService.stringArrays.delete('startup_info');
                    break;
                case 'windows-service-ext':
                    component.descriptions = this.stixService.stringArrays.get('descriptions');
                    this.stixService.stringArrays.delete('descriptions');

                    component.service_dll_refs = this.stixService.stringArrays.get('service_dll_refs');
                    this.stixService.stringArrays.delete('service_dll_refs');
                    break;
                case 'unix-account-ext':
                    component.gid = parseInt(component.gid);

                    component.groups = this.stixService.stringArrays.get('groups');
                    this.stixService.stringArrays.delete('groups');
                    break;
                case 'x509_v3_extensions':
                    //Nothing to do
                    break;
            }
        }

        // Moved here to future-proof toplevel in the case that we support other object types (also needed to remove empty input)
        if (this.predefined || this.toplevel) {
            // Needs to be a 'let x in y' loop so properties can be deleted
            for (let c in component) {
                if (component[c] == undefined) {
                    delete component[c];
                } else if (component[c] === null) {
                    delete component[c];
                } else if (!component[c] && typeof component[c] != 'boolean') {
                    // null/NaN was not being deleted on numbers
                    delete component[c];
                } else if (component[c] == '' && typeof component[c] != 'boolean') {
                    delete component[c];
                } else if (component[c] instanceof Array && component[c].length == 0) {
                    delete component[c];
                } else if (typeof component[c] === 'object' && Object.keys(component[c]).length === 0) {
                    if (component[c] instanceof Date) {
                        component[c] = component[c].toISOString();
                    } else {
                        delete component[c];
                    }
                } else if (component[c] instanceof StixService) {
                    delete component[c];
                } else if (component[c] === '""') {
                    delete component[c];
                }
            }
        }

        let json = JSON.stringify(component);
        json = json.replace('"extension_id":', '');

        if (!this.predefined) {
            const extension_type = component.extension_type;

            const comp = {};

            comp[component.extension_id] = {};

            if (extension_type)
                comp[component.extension_id].extension_type =
                    extension_type === 'Toplevel Property Extension'
                        ? 'toplevel-property-extension'
                        : extension_type === 'Property Extension'
                          ? 'property-extension'
                          : extension_type;

            for (const prop in component) {
                if (prop == 'extension_type' || prop == 'extension_id') continue;

                comp[component.extension_id][prop] = component[prop];
            }

            json = JSON.stringify(comp);
        } else if (json !== '{"windows-process-ext"}') {
            json = json.replace('"' + this.currentExtension.extension_id + '",', '"' + this.currentExtension.extension_id + '":{') + '}';
            //json = json.replace('x509-v3-extensions-type', 'x509_v3_extensions');
        }

        if (json !== '{"windows-process-ext"}') {
            component = JSON.parse(json);

            if (!this.predefined && !this.toplevel) {
                for (let prop in component) {
                    if (prop.startsWith('extension-definition--')) break;

                    component[this.currentExtension.extension_id][prop] = component[prop];
                    delete component[prop];
                }
            }

            component.getID = function getGranularMarkingSelectors(): string[] {
                return this.currentExtension.extension_id;
            };

            component.getGranularMarkingSelectors = function getGranularMarkingSelectors(): string[] {
                let selectors = [];
                selectors.push('extensions');
                this.extensions ? selectors.push('extensions') : null;
                return selectors;
            };

            if (this.stixService.editedExtension) {
                this.stixService.extensions = this.stixService.extensions.filter((obj) => obj !== this.stixService.editedExtension);
            }
        }

        if (this.toplevel) {
            for (let prop in component[this.currentExtension.extension_id]) {
                if (prop != 'extension_type') {
                    this.stixService.toplevel.push([prop, component[this.currentExtension.extension_id][prop]]);
                    delete component[this.currentExtension.extension_id][prop];
                }
            }
        }

        if (json !== '{"windows-process-ext"}') {
            this.stixService.extensions.push(component);
        } else {
            this.stixService.extensions.pop();
        }
        this.resetExtension();
    }

    loadCustomProps(currObject: any, x: any): void {
        let type = typeof currObject[x];
        let currVar = currObject[x];

        if (type == 'string') {
            this.currentExtension[x] = currVar;
            this.customStringPropKeys.push(x);
        } else if (type == 'number') {
            this.currentExtension[x] = parseInt(currVar) || undefined;
            this.customStringPropKeys.push(x);
        } else if (type == 'boolean') {
            this.currentExtension[x] = currVar;
            this.customStringPropKeys.push(x);
        } else if (currVar && currVar.length && currVar.length > 0) {
            this.currentExtension[x] = [];
            this.customArrPropKeys.push(x);
            for (let i of currVar) {
                this.currentExtension[x].push(i);
            }
        } else if (currVar) {
            this.currentExtension[x] = {};
            this.customArrPropKeys.push(x);

            let curr = JSON.stringify(currVar);
            if (curr) {
                curr = curr.substring(1, curr.length - 2); // Removes bracket and trailing quote (fencepost problem)
                let split = curr.split('",');
                for (let i of split) {
                    const key = i.slice(1, i.indexOf(':') - 1); // Removes Preceding and trailing quote
                    const value = i.slice(i.indexOf(':') + 2); // Removes Preceding quote

                    this.currentExtension[x][key] = value;
                }
            }
        }
    }

    editImpactExtension(extension, index) {
        const type = Object.keys(extension)[0];
        const dialogRef2 = this.extensionsDialog.open(ImpactExtensionsDialogComponent, {
            data: {
                type: type,
                extension: extension[type],
                index: index,
            },
            height: '600px',
            width: `${(window.innerWidth / 3) * 2}px`,
        });

        dialogRef2.afterClosed().subscribe((result) => {
            // If dialog canceled, restore the original impact category
            if (!result) {
                return;
            }
            this.stixService.editedExtension = undefined;
        });
    }

    setEditIndex(index: number) {
        this.editIndex = index;
    }

    editExtensions(myobj: any, modal: any) {
        this.resetExtension();
        this.isEditingExtension = true;
        this.stixService.editedExtension = myobj;
        let extId = Object.keys(myobj)[0];
        const impactPrefixes = [
            'availability-',
            'confidentiality-',
            'external-',
            'integrity-',
            'monetary-',
            'physical-',
            'traceability'
        ];

        // Check for Impact Extension Type
        if(impactPrefixes.some(p => extId.startsWith(p))){
            this.editImpactExtension(myobj,this.editIndex);
            return;
        }

        if (myobj['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']) {
            const configModalRef = this.modalService.open(AcsDialogComponent, { ariaLabelledBy: 'stix-config-modal', size: 'xl' });
            configModalRef.componentInstance.custom = true;
            configModalRef.componentInstance.customAcs = myobj;
            configModalRef.result.then((data) => {
                const extension = data.acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'];
                this.stixService.extensions.forEach((ext) => {
                    if (ext['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'])
                        ext['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'] = extension;
                });
            });
        } else {
            let isPropExt = false;
            if (extId.startsWith('extension-definition--') && myobj[extId].extension_type == 'property-extension') {
                isPropExt = true;
            }

            if (isPropExt) {
                this.predefined = false;
                this.currentExtension.extension_id = extId;
                let obj = this.stixService.getObjectFromID(this.currentExtension.extension_id);
                if (obj === undefined) this.currentExtension.extension_type = 'Property Extension';
                else {
                    this.toplevel_props = obj.extension_properties;
                    this.currentExtension.extension_type = this.toUpper(myobj[extId]['extension_type']);
                }
                // Somewhat redundant, but also needed here
                if (this.currentExtension.extension_type == 'Toplevel Property Extension') this.toplevel = true;
                else this.toplevel = false;

                for (let prop in myobj[extId]) {
                    if (!this.toplevel) this.loadCustomProps(myobj[extId], prop);
                    else {
                        if (this.toplevel_props.includes(prop)) this.loadCustomProps(myobj[extId], prop);
                    }
                }
                this.extensionModal(modal);
            } else {
                this.predefined = true;
                this.toplevel = false;

                if (extId.endsWith('-ext') || extId == 'x509_v3_extensions') {
                    switch (extId) {
                        case 'archive-ext':
                            this.currentExtension = new ArchiveExtension(extId, 'Archive File Extension', [], myobj[extId]['comment']);
                            let contains_refs = myobj[extId]['contains_refs'];
                            for (let i in contains_refs) {
                                this.addString(contains_refs[i], 'ext_contains_refs');
                            }
                            break;
                        case 'ntfs-ext':
                            this.currentExtension = new NTFSExtension(extId, 'NTFS File Extension', myobj[extId]['sid']);
                            let alternate_data_streams = myobj[extId]['alternate_data_streams'];
                            this.currentExtension.alternate_data_streams = alternate_data_streams;
                            break;
                        case 'pdf-ext':
                            this.currentExtension = new PDFExtension(
                                extId,
                                'PDF File Extension',
                                myobj[extId]['version'],
                                myobj[extId]['is_optimized'] + '',
                                myobj[extId]['pdfid0'],
                                myobj[extId]['pdfid1']
                            );
                            let document_info_dict = myobj[extId]['document_info_dict'];
                            for (let i in document_info_dict) {
                                this.currentArrString['document_info_dict_key'] = i;
                                this.currentArrString['document_info_dict_value'] = document_info_dict[i];
                                this.addDict('document_info_dict');
                            }
                            break;
                        case 'raster-image-ext':
                            this.currentExtension = new RasterImageExtension(
                                extId,
                                'Raster Image File Extension',
                                myobj[extId]['image_height'],
                                myobj[extId]['image_width'],
                                myobj[extId]['bits_per_pixel']
                            );
                            let exif_tags = myobj[extId]['exif_tags'];
                            for (let i in exif_tags) {
                                this.currentArrString['exif_tags_key'] = i;
                                this.currentArrString['exif_tags_value'] = exif_tags[i];
                                this.addDict('exif_tags');
                            }
                            break;
                        case 'windows-pebinary-ext':
                            this.currentExtension = new WindowsPEBinaryExtension(
                                extId,
                                'Windows PE Binary File Extension',
                                myobj[extId]['pe_type'],
                                myobj[extId]['imphash'],
                                myobj[extId]['machine_hex'],
                                myobj[extId]['number_of_sections'],
                                myobj[extId]['time_date_stamp'],
                                myobj[extId]['pointer_to_symbol_table_hex'],
                                myobj[extId]['number_of_symbols'],
                                myobj[extId]['size_of_optional_header'],
                                myobj[extId]['characteristics_hex']
                            );
                            let file_header_hashes = myobj[extId]['file_header_hashes'];
                            for (let i in file_header_hashes) {
                                this.currentArrString['file_header_hashes_hash_type'] = i;
                                this.currentArrString['file_header_hashes_hash_value'] = file_header_hashes[i];
                                this.addHash(
                                    this.currentArrString['file_header_hashes_hash_type'],
                                    this.currentArrString['file_header_hashes_hash_value'],
                                    'file_header_hashes'
                                );
                            }

                            let optional_header = myobj[extId]['optional_header'];
                            this.currentExtension.optional_header = optional_header;

                            let sections = myobj[extId]['sections'];
                            this.currentExtension.sections = sections;
                            break;
                        case 'http-request-ext':
                            this.currentExtension = new HTTPRequestExtension(
                                extId,
                                'HTTP Request Extension',
                                myobj[extId]['request_method'],
                                myobj[extId]['request_value'],
                                myobj[extId]['request_version'],
                                myobj[extId]['message_body_length'],
                                myobj[extId]['message_body_data_ref']
                            );
                            let request_header = myobj[extId]['request_header'];
                            for (let i in request_header) {
                                this.currentArrString['request_header_key'] = i;
                                this.currentArrString['request_header_value'] = request_header[i];
                                this.addDict('request_header');
                            }
                            break;
                        case 'icmp-ext':
                            this.currentExtension = new ICMPExtension(
                                extId,
                                'ICMP Extension',
                                myobj[extId]['icmp_type_hex'],
                                myobj[extId]['icmp_code_hex']
                            );
                            break;
                        case 'socket-ext':
                            this.currentExtension = new SocketExtension(
                                extId,
                                'Network Socket Extension',
                                myobj[extId]['address_family'],
                                myobj[extId]['is_blocking'] + '',
                                myobj[extId]['is_listening'] + '',
                                myobj[extId]['socket_type'],
                                myobj[extId]['socket_descriptor'],
                                myobj[extId]['socket_handle']
                            );
                            let options = myobj[extId]['options'];
                            for (let i in options) {
                                this.currentArrString['options_key'] = i;
                                this.currentArrString['options_value'] = options[i];
                                this.addDict('options');
                            }
                            break;
                        case 'tcp-ext':
                            this.currentExtension = new TCPExtension(
                                extId,
                                'TCP Extension',
                                myobj[extId]['src_flags_hex'],
                                myobj[extId]['dst_flags_hex']
                            );
                            break;
                        case 'windows-process-ext':
                            this.currentExtension = new WindowsProcessExtension(
                                extId,
                                'Windows Process Extension',
                                myobj[extId]['aslr_enabled'] + '',
                                myobj[extId]['dep_enabled'] + '',
                                myobj[extId]['priority'],
                                myobj[extId]['owner_sid'],
                                myobj[extId]['window_title'],
                                myobj[extId]['integrity_level']
                            );
                            let startup_info = myobj[extId]['startup_info'];
                            for (let i in startup_info) {
                                this.currentArrString['startup_info_key'] = i;
                                this.currentArrString['startup_info_value'] = startup_info[i];
                                this.addDict('startup_info');
                            }
                            break;
                        case 'windows-service-ext':
                            this.currentExtension = new WindowsServiceExtension(
                                extId,
                                'Windows Service Extension',
                                myobj[extId]['service_name'],
                                myobj[extId]['display_name'],
                                myobj[extId]['group_name'],
                                myobj[extId]['start_type'],
                                myobj[extId]['service_type'],
                                myobj[extId]['service_status']
                            );
                            let descriptions = myobj[extId]['descriptions'];
                            for (let i in descriptions) {
                                this.addString(descriptions[i], 'descriptions');
                            }
                            let service_dll_refs = myobj[extId]['service_dll_refs'];
                            for (let i in service_dll_refs) {
                                this.addString(service_dll_refs[i], 'service_dll_refs');
                            }
                            break;
                        case 'unix-account-ext':
                            this.currentExtension = new UnixAccountExtension(
                                extId,
                                'Unix Account Extension',
                                myobj[extId]['gid'],
                                myobj[extId]['home_dir'],
                                myobj[extId]['shell']
                            );
                            let groups = myobj[extId]['groups'];
                            for (let i in groups) {
                                this.addString(groups[i], 'groups');
                            }
                            break;
                        case 'x509_v3_extensions':
                            this.currentExtension = new X509V3Extensions(
                                extId,
                                'X.509 V3 Extensions',
                                myobj[extId]['basic_constraints'],
                                myobj[extId]['name_constraints'],
                                myobj[extId]['policy_constraints'],
                                myobj[extId]['key_usage'],
                                myobj[extId]['extended_key_usage'],
                                myobj[extId]['subject_key_identifier'],
                                myobj[extId]['authority_key_identifier'],
                                myobj[extId]['subject_alternative_name'],
                                myobj[extId]['issuer_alternative_name'],
                                myobj[extId]['subject_directory_attributes'],
                                myobj[extId]['crl_distribution_points'],
                                myobj[extId]['inhibit_any_policy'],
                                myobj[extId]['private_key_usage_period_not_before'],
                                myobj[extId]['private_key_usage_period_not_after'],
                                myobj[extId]['certificate_policies'],
                                myobj[extId]['policy_mappings']
                            );
                            break;
                    }
                    this.extensionModal(modal);
                } else console.error('ERROR: Non-supported Extension');
            }
        }
    }

    /**
     * Takes an extension definition JSON Key and converts it to a user-readable value
     */
    formatExtensionKey(key: string): string {
        if (!key) return '';

        return key
            .replace(/_/g, ' ')
            .replace(/\w\S*/g, (txt) =>
                txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
            );
    }

    /**
     * Deletes an extension from stixService and removes it from the headings list
     */
    deleteExtensions(myobj: any) {
        this.stixService.extensions = this.stixService.extensions.filter((obj) => obj !== myobj);
        if (JSON.stringify(myobj).includes('new-')) {
            delete this.stixService.customObjInfo['parent'];
        }

        // Regex for a user defined extension
        const regex = new RegExp(/^(.*)(extension-definition.*)$/);
        for (let i = 0; i < this.headings.length; i++) {
            let h = this.headings[i];

            // User defined extensions will have the Extension Type in the header - this needs to be removed
            const matches = h.match(regex);
            if (matches) h = matches[2];

            // Pops the heading off the list when it is the one that is being deleted
            if (JSON.stringify(myobj).includes(h)) {
                this.headings.splice(i, 1);
                break;
            }
        }
        for (const [key, value] of Object.entries(myobj)) {
            if (value['extension_type'] === 'toplevel-property-extension') this.stixService.toplevel = [];
        }
    }

    deleteExtensionProperty(currString: string): void {
        delete this.currentExtension[currString];
        this.customStringPropKeys = this.customStringPropKeys.filter((obj) => obj !== currString);
        this.customArrPropKeys = this.customArrPropKeys.filter((obj) => obj !== currString);
    }

    /**
     * Pulls all Extension Definition objects from the current bundle, identifies the
     * Extension Definition currently selected, parses the object for its Extension Types,
     * removes non-applicable Extension Types, configures them to a more readable text,
     * and sets these as the Extension Type options.
     *
     * For predefined extensions, this function will immediately return and set the
     * global predefined variable accordigly.
     */
    getTypes(): void {
        this.validID();
        this.currentExtension.extension_type = '';
        if (this.currentExtension.extension_id.includes('extension-definition--')) {
            this.predefined = false;
            let obj = this.stixService.getObjectFromID(this.currentExtension.extension_id);

            this.type_options = JSON.parse(JSON.stringify(obj.extension_types));
            for (let i = 0; i < this.type_options.length; i++) {
                let t = '';
                switch (this.type_options[i]) {
                    // New Objects are handled when creating Extension Definition
                    case 'new-sdo':
                    case 'new-sro':
                    case 'new-sco':
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
        } else this.predefined = true;
    }

    /**
     * Simple check for whether the object identified is an Extension Definition that
     * contains a Property Extension or Toplevel Property Extension
     *
     * @param obj Object identified (should only be Extension Definitions)
     * @returns
     */
    hasProperties(obj: any): boolean {
        if (obj == undefined || !obj.extension_types) return false;
        return JSON.stringify(obj.extension_types).includes('property-extension');
    }

    toUpper(str) {
        let split;
        if (str.includes('_')) split = str.split('_');
        else split = str.split('-');

        return split
            .map(function (word) {
                return word[0].toUpperCase() + word.substr(1);
            })
            .join(' ');
    }

    validPropertyName(): boolean {
        for (let char of this.customProp['name']) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.nameError = 'An Extension Property may only contain lowercase letters, numbers, and underscores (_)';
                return false;
            }
        }

        if (this.customProp['name'].length < 3) {
            this.nameError = 'An Extension Property must have a minimum length of 3 characters';
            return false;
        }

        if (this.customProp['name'].length > 250) {
            this.nameError = 'An Extension Property must have a maximum length of 250 characters';
            return false;
        }
        this.nameError = '';
        return true;
    }

    /**
     * Someone broke Extensions when they moved part of it to a separate dialog component so this is the quick and dirty fix.
     * Non-top-level property extension is still broken.
     *
     * @param obj
     */
    tempLoadExtension(name: String): void {
        let ext = this.stixService.getObjectFromID(this.currentExtension.extension_id);
        this.toplevel_props = ext ? ext.extension_properties : [];
    }

    /**
     * This will open the modal responsible for building stix patterns
     *
     * @param modal modal content sent in from the local variable in the HTML (might want to data bind this to a typescript variable but for now it's good)
     */
    extensionModal(modal): void {
        this.isAddingExtensions = false;
        if (this.currentExtension.extension_id.includes('extension-definition--')) {
            this.tempLoadExtension(this.currentExtension.extension_id);
            this.predefined = false;
            if (this.currentExtension.extension_type == 'Toplevel Property Extension') this.toplevel = true;
            else this.toplevel = false;
        } else {
            this.predefined = true;
            this.toplevel = false;
            let t = '';
            switch (this.currentExtension.extension_id) {
                case 'archive-ext':
                    t = 'Archive File Extension';
                    if (!(this.currentExtension instanceof ArchiveExtension))
                        this.currentExtension = new ArchiveExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'ntfs-ext':
                    t = 'NTFS File Extension';
                    if (!(this.currentExtension instanceof NTFSExtension))
                        this.currentExtension = new NTFSExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'pdf-ext':
                    t = 'PDF File Extension';
                    if (!(this.currentExtension instanceof PDFExtension))
                        this.currentExtension = new PDFExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'raster-image-ext':
                    t = 'Raster Image File Extension';
                    if (!(this.currentExtension instanceof RasterImageExtension))
                        this.currentExtension = new RasterImageExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'windows-pebinary-ext':
                    t = 'Windows PE Binary File Extension';
                    if (!(this.currentExtension instanceof WindowsPEBinaryExtension))
                        this.currentExtension = new WindowsPEBinaryExtension(
                            this.currentExtension.extension_id,
                            this.currentExtension.extension_type
                        );
                    break;
                case 'http-request-ext':
                    t = 'HTTP Request Extension';
                    if (!(this.currentExtension instanceof HTTPRequestExtension))
                        this.currentExtension = new HTTPRequestExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'icmp-ext':
                    t = 'ICMP Extension';
                    if (!(this.currentExtension instanceof ICMPExtension))
                        this.currentExtension = new ICMPExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'socket-ext':
                    t = 'Network Socket Extension';
                    if (!(this.currentExtension instanceof SocketExtension))
                        this.currentExtension = new SocketExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'tcp-ext':
                    t = 'TCP Extension';
                    if (!(this.currentExtension instanceof TCPExtension))
                        this.currentExtension = new TCPExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'windows-process-ext':
                    t = 'Windows Process Extension';
                    if (!(this.currentExtension instanceof WindowsProcessExtension))
                        this.currentExtension = new WindowsProcessExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'windows-service-ext':
                    t = 'Windows Service Extension';
                    if (!(this.currentExtension instanceof WindowsServiceExtension))
                        this.currentExtension = new WindowsServiceExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'unix-account-ext':
                    t = 'Unix Account Extension';
                    if (!(this.currentExtension instanceof UnixAccountExtension))
                        this.currentExtension = new UnixAccountExtension(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
                case 'x509_v3_extensions':
                    t = 'X.509 V3 Extensions';
                    if (!(this.currentExtension instanceof X509V3Extensions))
                        this.currentExtension = new X509V3Extensions(this.currentExtension.extension_id, this.currentExtension.extension_type);
                    break;
            }
            this.currentExtension.extension_type = t;
        }
        this.modalService
            .open(modal, { ariaLabelledBy: 'modal-title', size: 'xl', windowClass: 'extensions-modal', centered: true })
            .result.finally(() => {
                console.info('EXTENSION FINISHED');
            });
    }

    /**
     * Reset stix pattern builder modal for new creation if user selects it again
     */
    resetExtension(): void {
        this.page = 'base';
        this.pageSize = 3;
        this.selectedExtension = null;
        this.validationMessage = '';
        this.currentExtension = new Extension('', '', new Map());
        this.isAddingExtensions = false;
        this.isEditingExtension = false;
        this.newExtensions = [];
        this.errorMessage = '';
        this.predefined = true;
        this.toplevel = false;
        this.type_options = [];
        this.toplevel_props = [];
        this.headingTracker = 0;
        this.stixService.editedExtension = undefined;
        for (let currArray in this.currentArrString) {
            this.stixService.stringArrays.delete(currArray);
        }
        this.currentArrString = {};
        this.validationError = new Map();
        this.modalService.dismissAll();

        // Property Extension Variables
        this.customStringPropKeys = [];
        this.customArrPropKeys = [];
        this.customProp = new Map();
        this.customProp.set('customArray', []);
        this.customProp['key'] = '';
        this.customProp['value'] = '';
        this.customProp.set('customDict', new Map());
        this.customProp['type'] = '';
        this.customProp['name'] = '';
        this.customProp['text'] = '';
        this.customProp['boolean'] = '';
        this.customProp['integer'] = '';
        this.customProp['datetime'] = '';
        this.customProp['isEditing'] = false;
    }

    validID(): boolean {
        if (this.currentExtension.extension_id != '') {
            if (JSON.stringify(this.stixService.extensions).includes(this.currentExtension.extension_id)) {
                this.errorMessage = 'WARNING: ID already in use. Please use a different Extension';
                return false;
            }
        }
        this.errorMessage = '';
        return true;
    }

    getHeading(extension: any): string {
        let heading = '';
        let id;

        for (let prop in extension) {
            if (prop.startsWith('extension-definition--')) {
                id = prop;
                break;
            } else if (prop.endsWith('-ext') || prop == 'x509_v3_extensions') {
                id = prop;
                break;
            }
        }

        if (id?.startsWith('extension-definition--')) {
            if (extension[id].extension_type) {
                const extension_type = extension[id].extension_type;

                if (extension_type == 'property-extension') {
                    let parentExt = this.stixService.getObjectFromID(id);
                    let name = parentExt ? parentExt['name'] : id;
                    heading = extension_type + ': ' + name;
                } else {
                    heading = extension_type;
                }
            }
        } else {
            const matches = JSON.stringify(extension).match(this.predefinedRegex);
            if (matches) heading = matches[1];
        }

        return heading;
    }

    propType(extension): string {
        let curr = JSON.stringify(extension);
        const regex = new RegExp(/^{"(extension-definition.*)":{(.*)("extension_type":")(.*property-extension)"(.*)}}$/);
        let matches = curr.match(regex);
        if (matches) {
            let id = matches[1];

            if (id.startsWith('extension-definition') && id.length > 58) {
                id = id.substring(0, 58);
            }

            let type = extension[id]['extension_type'];
            switch (type) {
                case 'property-extension':
                    return 'prop';
                case 'toplevel-property-extension':
                    return 'toplevel';
            }
            let parentExt = this.stixService.getObjectFromID(id);
        }
        return 'pre';
    }

    getProps(extension): any[] {
        let props: any[] = [];
        const regex = new RegExp(/^{"(extension-definition.*)":{(.*)("extension_type":")(.*property-extension)"(.*)}}$/);
        let curr = JSON.stringify(extension);
        let matches = curr.match(regex);
        if (matches) {
            let id = matches[1];

            if (id.startsWith('extension-definition') && id.length > 58) {
                id = id.substring(0, 58);
            }

            let ext = extension[id];
            for (let prop in ext) {
                if (prop != 'extension_type') {
                    props.push([prop, ext[prop]]);
                }
            }
        } else {
            matches = curr.match(this.predefinedRegex);
        }

        return props;
    }

    isObject(prop: any): boolean {
        return typeof prop == 'object';
    }

    toggleShow(extension): void {
        let str = JSON.stringify(extension);
        if (this.tracker[str] != undefined) {
            delete this.tracker[str];
        } else {
            this.tracker[str] = true;
        }
    }

    isVisible(extension): boolean {
        return this.tracker[JSON.stringify(extension)] != undefined;
    }

    editable(extension): boolean {
        for (let title in extension) {
            if (
                !title.includes('extension-definition') &&
                ['availability-ext', 'confidentiality-ext', 'external-ext', 'integrity-ext', 'monetary-ext', 'physical', 'traceability'].includes(
                    title
                )
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * String Array/Dict Functions
     */
    addString(currString: string, currArray: string): void {
        if (this.stixService.stringArrays.has(currArray)) {
            let newStringArray = this.stixService.stringArrays.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.stixService.stringArrays.set(currArray, newStringArray);
            }
        } else this.stixService.stringArrays.set(currArray, [currString]);

        if (this.currentArrString[currArray] == currString) this.currentArrString[currArray] = '';
    }

    addDict(currArray: string): void {
        this.validateStartupValue();

        if (this.errorMessage.length === 0) {
            let s = this.currentArrString[currArray + '_key'] + ': ' + this.currentArrString[currArray + '_value'];
            let defined = false;
            let newStringArray;
            if (this.stixService.stringArrays.has(currArray)) {
                newStringArray = this.stixService.stringArrays.get(currArray)!;
                defined = true;
            }

            if (defined) {
                if (newStringArray.indexOf(s) == -1) {
                    newStringArray.push(s);
                    this.stixService.stringArrays.set(currArray, newStringArray);
                }
            } else {
                this.stixService.stringArrays.set(currArray, [s]);
            }

            this.currentArrString[currArray + '_key'] = '';
            this.currentArrString[currArray + '_value'] = '';
        }
    }

    deleteString(currString: string, currArray: string) {
        let curr = this.stixService.stringArrays.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        this.stixService.stringArrays.set(currArray, curr);
    }

    addHash(type, value, varName?: string): any {
        this.currentArrString['hash_type'];
        //Hash Value & Hash Type
        const MD5Regex = new RegExp('^[a-fA-F0-9]{32}$');
        const SHA1Regex = new RegExp('^[0-9a-f]{5,40}$');
        const SHA256Regex = new RegExp('^[A-Fa-f0-9]{64}$');
        const SHA512Regex = new RegExp('^[a-f0-9]{128}$');
        //SHA3 Regexes are identical
        const SSDEEPRegex = new RegExp('^[0-9]+:[a-zA-Z0-9+/]{3,}:[a-zA-Z0-9+/]{3,}$');
        const TLSHRegex = new RegExp('^T1?[0-9A-Fa-f]{70}$');

        let hashType = 'hash_type';
        let hashValue = 'hash_value';

        if (!varName) varName = 'hashes';
        else {
            hashType = varName + '_' + hashType;
            hashValue = varName + '_' + hashValue;
        }

        if ((varName == 'hashes' && this.hashes.get(type)) || (this.currentExtension[varName] && this.currentExtension[varName].get(type))) {
            this.validationError.set(varName, 'Warning: hash exists for this hash type - delete existing hash first to overwrite');
            return {
                valid: false,
            };
        }
        if (type == 'MD5')
            if (!MD5Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'MD5 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-1')
            if (!SHA1Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SHA-1 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-256')
            if (!SHA256Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SHA-256 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SHA-512')
            if (!SHA512Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SHA-512 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SHA3-256')
            if (!SHA256Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SHA3-256 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SHA3-512')
            if (!SHA512Regex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SHA3-512 Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'SSDEEP')
            if (!SSDEEPRegex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'SSDEEP Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }
        if (type == 'TLSH')
            if (!TLSHRegex.test(this.currentArrString[hashValue])) {
                this.validationError.set(varName, 'TLSH Hash Value must be properly formatted');
                return {
                    valid: false,
                };
            }

        if (varName != 'hashes') {
            this.currentExtension[varName].set(type, value);
            this.currentExtension[varName][type] = value;
        } else {
            this.hashes.set(type, value);
            this.hashes[type] = value;
        }

        this.validationError.delete(varName);
        this.currentArrString[hashValue] = '';
        return {
            valid: true,
        };
    }

    deleteHash(type): void {
        this.hashes.delete(type);
        delete this.hashes[type];
    }

    /**
     * Sub Object Functions
     */
    creatingSubObject(currArray: string) {
        this.subObject = {};
        this.editedSubObject = undefined;
        this.hashes = new Map();
        this.subObjectType = currArray;

        if (this.page == 'base') {
            switch (currArray) {
                case 'alternate_data_streams':
                    this.page = 'creatingStream';
                    break;
                case 'optional_header':
                    this.page = 'creatingHeader';
                    break;
                case 'sections':
                    this.page = 'creatingSection';
                    break;
            }
        } else this.page = 'base';
    }

    editSubObject(currObject: any, currArray: string) {
        this.creatingSubObject(currArray);
        this.editedSubObject = currObject;

        for (let x in currObject) {
            if (x == 'hashes') {
                let file_header_hashes = currObject['hashes'];
                for (let i in file_header_hashes) {
                    this.currentArrString['hash_type'] = i;
                    this.currentArrString['hash_value'] = file_header_hashes[i];
                    this.addHash(this.currentArrString['hash_type'], this.currentArrString['hash_value']);
                }
            } else this.subObject[x] = currObject[x];
        }
    }

    deleteSubObject(currObject: any, currArray: string) {
        if (currArray == 'optional_header') this.currentExtension.optional_header = undefined;
        else this.currentExtension[currArray] = this.currentExtension[currArray].filter((obj) => obj !== currObject);
    }

    addSubObject() {
        if (this.isError()) return;

        if (this.hashes.size > 0) this.subObject['hashes'] = this.hashes;

        if (this.editedSubObject) this.deleteSubObject(this.editedSubObject, this.subObjectType);

        for (let c in this.subObject) {
            if (this.subObject[c] == undefined) {
                delete this.subObject[c];
            } else if (this.subObject[c] === null) {
                delete this.subObject[c];
            } else if (!this.subObject[c] && typeof this.subObject[c] != 'boolean') {
                // null/NaN was not being deleted on numbers
                delete this.subObject[c];
            } else if (this.subObject[c] == '' && typeof this.subObject[c] != 'boolean') {
                delete this.subObject[c];
            } else if (this.subObject[c] instanceof Array && this.subObject[c].length == 0) {
                delete this.subObject[c];
            } else if (this.subObject[c].size == 0) {
                delete this.subObject[c];
            } else if (this.subObject[c] instanceof StixService) {
                delete this.subObject[c];
            }
        }

        if (this.subObjectType == 'optional_header') this.currentExtension.optional_header = this.subObject;
        else this.currentExtension[this.subObjectType].push(this.subObject);
        this.page = 'base';
    }

    /**
     * Input Validation Functions
     */
    validType(types: any, currString: string, currObject: string): boolean {
        if (currString == undefined || currString == '') {
            // Does not run on (change) when empty -- DOES NOT WORK
            this.validationError.delete(currObject);
            return true;
        }
        if (!(types instanceof Array)) types = [types];

        if (currString.match(this.objectRegex)) {
            if (types.indexOf((currString.match(this.objectRegex) || ['asdf', 'asdf'])[1]) != -1) {
                this.validationError.delete(currObject);
                return true;
            } else this.validationError.set(currObject, 'Object must be a UUID of type ' + types);
        } else this.validationError.set(currObject, 'Must be a valid UUID (i.e. [object type]--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)');
        return false;
    }

    isLower(currString: string, currObject: string): boolean {
        if (!currString) {
            return true;
        }

        for (let char of currString) {
            if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                this.validationError.set(currObject, 'Input must be lowercase');
                return false;
            }
        }

        this.validationError.delete(currObject);
        return true;
    }

    isHex(currString: string, currObject: string): boolean {
        const regex = new RegExp(/^[a-fA-F0-9^0][a-fA-F0-9]*$/);
        if (currString && !regex.test(currString)) {
            this.validationError.set(currObject, 'Input must be a valid hex');
            return false;
        }
        this.validationError.delete(currObject);
        return true;
    }

    positive(currString: string, currObject: string): boolean {
        const regex = new RegExp(/^[1-9][0-9]*$/);
        if (currString && !regex.test(currString)) {
            this.validationError.set(currObject, 'Input must be a positive integer');
            return false;
        }
        this.validationError.delete(currObject);
        return true;
    }

    priority(currString: string, currObject: string): boolean {
        const regex = new RegExp(/^.*_CLASS$/);
        if (currString && !regex.test(currString)) {
            this.validationError.set(currObject, 'WARNING: Windows Process Priority Class SHOULD end in "_CLASS"');
            return false;
        }
        this.validationError.delete(currObject);
        return true;
    }

    entropy(currString: string, currObject: string): boolean {
        const regex = new RegExp(/^(([0-7])(\.[0-9]*[1-9])?)|(8)$/);
        if (currString && !regex.test(currString)) {
            this.validationError.set(currObject, 'Input must be between 0 and 8 (inclusive)');
            return false;
        }
        this.validationError.delete(currObject);
        return true;
    }

    isAfter(before: string, after: string, currObject: string): boolean {
        let beforeTime = Date.parse(before);
        let afterTime = Date.parse(after);

        if (beforeTime && afterTime && beforeTime > afterTime) {
            let message = 'After/End time must not come before Before/Start time';
            switch (currObject) {
                case 'private_key_usage_period_not_after':
                    message = 'Must not come before Private Key Usage Period Not Before';
                    break;
            }
            this.validationError.set(currObject, message);
            return false;
        }
        this.validationError.delete(currObject);
        return true;
    }

    isAddEnabled(): boolean {
        if (!this.predefined) {
            if (!this.toplevel) {
                for (let i in this.currentExtension) {
                    if (!['extensions', 'extension_id', 'extension_type'].includes(i)) return true;
                }
                return false;
            } else {
                for (let prop of this.toplevel_props) {
                    let p = this.currentExtension[prop];
                    if (p != undefined && (typeof p != 'string' || p != '')) {
                        return true;
                    }
                }
                return false;
            }
        } else {
            switch (this.currentExtension.extension_id) {
                case 'archive-ext':
                    if ((this.stixService.stringArrays.get('ext_contains_refs') || []).length == 0) return false;
                    break;
                case 'ntfs-ext':
                    if (this.isEmpty(['alternate_data_streams'])) return false;
                    break;
                case 'pdf-ext':
                    if (this.isEmpty(['document_info_dict'])) return false;
                    break;
                case 'raster-image-ext':
                    if (this.isEmpty(['exif_tags'])) return false;
                    break;
                case 'windows-pebinary-ext':
                    this.isHex(this.currentExtension.machine_hex, 'machine_hex');
                    this.isHex(this.currentExtension.pointer_to_symbol_table_hex, 'pointer_to_symbol_table_hex ');
                    this.isHex(this.currentExtension.characteristics_hex, 'characteristics_hex');
                    this.positive(this.currentExtension.number_of_sections, 'number_of_sections');
                    this.positive(this.currentExtension.number_of_symbols, 'number_of_symbols');
                    this.positive(this.currentExtension.size_of_optional_header, 'size_of_optional_header');

                    if (this.currentExtension.pe_type == undefined || this.currentExtension.pe_type == '' || this.isEmpty(['file_header_hashes']))
                        return false;
                    break;
                case 'http-request-ext':
                    this.isLower(this.currentExtension.request_method, 'request_method');
                    this.isLower(this.currentExtension.request_version, 'request_version');
                    this.validType(['artifact'], this.currentExtension.message_body_data_ref, 'message_body_data_ref');

                    if (
                        this.currentExtension.request_method == undefined ||
                        this.currentExtension.request_method == '' ||
                        this.currentExtension.request_value == undefined ||
                        this.currentExtension.request_value == ''
                    )
                        return false;
                    break;
                case 'icmp-ext':
                    this.isHex(this.currentExtension.icmp_type_hex, 'icmp_type_hex');
                    this.isHex(this.currentExtension.icmp_code_hex, 'icmp_code_hex');

                    if (
                        this.currentExtension.icmp_code_hex == undefined ||
                        this.currentExtension.icmp_code_hex == '' ||
                        this.currentExtension.icmp_type_hex == undefined ||
                        this.currentExtension.icmp_type_hex == ''
                    )
                        return false;
                    break;
                case 'socket-ext':
                    this.positive(this.currentExtension.socket_descriptor, 'socket_descriptor');

                    if (this.currentExtension.address_family == undefined || this.currentExtension.address_family == '') return false;
                    break;
                case 'tcp-ext':
                    //They aren't called immediately otherwise
                    this.isHex(this.currentExtension.src_flags_hex, 'src_flags_hex');
                    this.isHex(this.currentExtension.dst_flags_hex, 'dst_flags_hex');

                    if (this.isEmpty()) return false;
                    break;
                case 'windows-process-ext':
                    if (this.isEmpty(['startup_info'])) return false;
                    break;
                case 'windows-service-ext':
                    if (this.isEmpty(['descriptions', 'service_dll_refs'])) return false;
                    break;
                case 'unix-account-ext':
                    //Not called on change for some reason
                    this.isAfter(
                        this.currentExtension.private_key_usage_period_not_before,
                        this.currentExtension.private_key_usage_period_not_after,
                        'private_key_usage_period_not_after'
                    );

                    if (this.isEmpty(['groups'])) return false;
                    break;
                case 'x509_v3_extensions':
                    if (this.isEmpty()) return false;
                    break;
            }
            if (this.isError()) return false;
        }
        return true;
    }

    isEmpty(arrays?: string[]): boolean {
        for (let i in arrays) {
            if (
                (arrays[i].includes('hashes') && this.currentExtension[arrays[i]].size > 0) ||
                (this.stixService.stringArrays.get(arrays[i]) || []).length > 0
            )
                return false;
            if (arrays[i] == 'alternate_data_streams' && this.currentExtension.alternate_data_streams?.length > 0) return false;
        }
        for (let prop in this.currentExtension) {
            let p = this.currentExtension[prop];
            if (prop == 'private_key_usage_period_not_before' || prop == 'private_key_usage_period_not_after' || prop == 'time_date_stamp') {
                p = Date.parse(p);
            }
            if (
                p &&
                p != '' &&
                prop != 'extension_id' &&
                prop != 'extension_type' &&
                (typeof p == 'string' || typeof p == 'number' || typeof p == 'boolean') &&
                (this.currentExtension.extension_id != 'windows-pebinary-ext' || prop != 'pe_type')
            ) {
                return false;
            }
        }
        return true;
    }

    emptySubObject(arrays?: string[]): boolean {
        for (let i in arrays) {
            if ((arrays[i].includes('hashes') && this.hashes.size > 0) || (this.stixService.stringArrays.get(arrays[i]) || []).length > 0)
                return false;
        }
        for (let prop in this.subObject) {
            let p = this.subObject[prop];
            if (
                p &&
                p != '' &&
                prop != 'extension_id' &&
                prop != 'extension_type' &&
                (typeof p == 'string' || typeof p == 'number' || typeof p == 'boolean')
            ) {
                return false;
            }
        }
        return true;
    }

    isError(): boolean {
        for (let key of this.validationError.keys()) {
            if (
                this.currentArrString[key] == undefined &&
                !this.validationError.get(key).includes('WARNING:') &&
                !this.validationError.get(key).includes('hashes')
            ) {
                return true;
            }
        }
        return false;
    }

    validateStartupValue() {
        if (
            this.regExIntegerMatch.test(this.currentArrString['startup_info_key']) &&
            this.currentArrString['startup_info_value'] &&
            isNaN(this.currentArrString['startup_info_value'])
        ) {
            this.errorMessage = 'Startup Info Value must be an integer.';
        } else if (
            this.regExStringMatch.test(this.currentArrString['startup_info_key']) &&
            this.currentArrString['startup_info_value'] &&
            typeof this.currentArrString['startup_info_value'] !== 'string'
        ) {
            this.errorMessage = 'Startup Info Value must be a string.';
        } else {
            this.errorMessage = '';
        }
    }

    /**
     * Toplevel Extension Functions
     */

    createProperty(): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];
        if (this.currentExtension[name] && !this.customProp['isEditing']) {
            this.modalError.set('customName', 'Property with this name already exists');
            return;
        } else this.modalError.delete('customName');

        if (type == 'array' || type == 'dict') {
            if (type == 'array') {
                this.currentExtension[name] = this.customProp.get('customArray') || [];
            } else if (type == 'dict') {
                this.currentExtension[name] = this.customProp.get('customDict') || new Map();
            }
            if (!this.customArrPropKeys.includes(name)) this.customArrPropKeys.push(name);

            this.customProp.set('customArray', []);
            this.customProp.set('customDict', new Map());
            this.customProp['key'] = '';
            this.customProp['value'] = '';
            this.customProp['type'] = '';
            this.customProp['name'] = '';
            this.customProp['isEditing'] = false;
        } else {
            if (type == 'text') this.currentExtension[name] = this.customProp['text'];
            else if (type == 'integer') this.currentExtension[name] = parseInt(this.customProp['integer']) || undefined;
            else if (type == 'boolean') this.currentExtension[name] = JSON.parse(this.customProp['boolean']);
            else if (type == 'datetime') this.currentExtension[name] = this.customProp['datetime'];
            if (!this.customStringPropKeys.includes(name)) this.customStringPropKeys.push(name);
            this.customProp['type'] = '';
            this.customProp['name'] = '';
            this.customProp['text'] = '';
            this.customProp['boolean'] = '';
            this.customProp['integer'] = '';
            this.customProp['datetime'] = '';
            this.customProp['isEditing'] = false;
        }
    }

    editStringProperty(key: string): void {
        this.customProp['name'] = key;
        this.customProp['isEditing'] = true;
        let value = this.currentExtension[key];

        // Determine the type of the property
        if (typeof value === 'boolean') {
            this.customProp['type'] = 'boolean';
            this.customProp['boolean'] = value.toString();
        } else if (typeof value === 'number') {
            this.customProp['type'] = 'integer';
            this.customProp['integer'] = value.toString();
        } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
            this.customProp['type'] = 'datetime';
            this.customProp['datetime'] = value;
        } else {
            this.customProp['type'] = 'text';
            this.customProp['text'] = value;
        }
    }

    editArrayDictProperty(key: string): void {
        this.customProp['name'] = key;
        this.customProp['isEditing'] = true;
        let currObj = this.currentExtension[key];
        this.customProp['value'] = '';

        if (Array.isArray(currObj)) {
            // If it is an array
            this.customProp.set('customArray', []);
            this.customProp['type'] = 'array';
            for (let x of currObj) {
                this.addSubModalString(x, 'customArray');
            }
        } else {
            // If it is a dict
            this.customProp['key'] = '';
            this.customProp['type'] = 'dict';
            this.customProp.set('customDict', new Map());

            let curr = JSON.stringify(currObj);
            curr = curr.substring(1, curr.length - 2);
            let split = curr.split('",');
            for (let i of split) {
                const dictKey = i.slice(1, i.indexOf(':') - 1);
                const dictValue = i.slice(i.indexOf(':') + 2);

                this.addSubModalDictString(dictKey, dictValue, 'customDict');
            }
        }
    }

    createCollection(): void {
        let type = this.customProp['type'];
        let name = this.customProp['name'];

        if (type == 'array') {
            this.currentExtension[name] = this.customProp.get('customArray');
        } else if (type == 'dict') {
            this.currentExtension[name] = this.customProp.get('customDict');
        }

        if (!this.customArrPropKeys.includes(name)) this.customArrPropKeys.push(name);

        this.customProp['type'] = '';
        this.customProp['name'] = '';
        this.customProp['text'] = '';
        this.customProp['boolean'] = '';
        this.customProp['datetime'] = '';
        this.modalRef.close();
    }

    onPropertyTypeChange(type: string): void {
        if (type == 'array') {
            if (!this.customProp.has('customArray')) {
                this.customProp.set('customArray', []);
            }
            this.customProp['key'] = '';
            this.customProp['value'] = '';
        } else if (type == 'dict') {
            if (!this.customProp.has('customDict')) {
                this.customProp.set('customDict', new Map());
            }
            this.customProp['key'] = '';
            this.customProp['value'] = '';
        }
    }

    editCollection(currCollection: any, modal: any): void {
        let currObj = this.currentExtension[currCollection];
        this.customProp['name'] = currCollection;
        this.customProp['value'] = '';

        if (currObj.length) {
            // If it is an array
            this.customProp.set('customArray', []);
            this.customProp['type'] = 'array';
            for (let x of currObj) {
                this.addSubModalString(x, 'customArray');
            }
        } else {
            // If it is a dict
            this.customProp['key'] = '';
            this.customProp['type'] = 'dict';
            this.customProp.set('customDict', new Map());

            let curr = JSON.stringify(currObj);
            curr = curr.substring(1, curr.length - 2); // Removes bracket and trailing quote (fencepost problem)
            let split = curr.split('",');
            for (let i of split) {
                const key = i.slice(1, i.indexOf(':') - 1); // Removes Preceding and trailing quote
                const value = i.slice(i.indexOf(':') + 2); // Removes Preceding quote

                this.addSubModalDictString(key, value, 'customDict');
            }
        }

        this.modalRef = this.modalService.open(modal, { size: 'xl', centered: true });
    }

    /**
     * Property Extension Array/Dict Functions
     */

    addSubModalString(currString: string, currArray: string): void {
        if (this.customProp.has(currArray)) {
            let newStringArray = this.customProp.get(currArray)!;
            if (newStringArray.indexOf(currString) == -1) {
                newStringArray.push(currString);
                this.customProp.set(currArray, newStringArray);
            }
        } else this.customProp.set(currArray, [currString]);

        if (this.customProp['value'] == currString) this.customProp['value'] = '';
    }

    addSubModalDictString(currKey: string, currValue: string, currDict: string): void {
        this.customProp.get(currDict).set(currKey, currValue);
        this.customProp.get(currDict)[currKey] = currValue;

        if (this.customProp['value'] == currValue) {
            this.customProp['key'] = '';
            this.customProp['value'] = '';
        }
    }
    deleteSubModalDictString(currKey: string, currDict: string) {
        this.customProp.get(currDict).delete(currKey);
        delete this.customProp.get(currDict)[currKey];
    }

    deleteSubModalString(currString: string, currArray: string) {
        let curr = this.customProp.get(currArray);
        curr = curr.filter((obj) => obj !== currString);
        if (curr.length > 0) this.customProp.set(currArray, curr);
        else this.customProp.delete(currArray);
    }

    notObj(ext: any): boolean {
        return !JSON.stringify(ext).includes('new-');
    }

    shouldHideExtension(extension: any): boolean {
        if(this.stixService.currentType !== 'identity') return false;
        let extKey = Object.keys(extension)[0];
        return extKey === 'extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498';
    }
}
