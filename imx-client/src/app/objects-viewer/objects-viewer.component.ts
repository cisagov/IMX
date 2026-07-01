import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { STIX_OBJECTS } from '../models/stix-objects';
import {
    faEdit,
    faTrash,
    faSave,
    faDownload,
    faUndo,
    faUpload,
    faPlusSquare,
    faLink,
    faFileDownload,
    faFileUpload,
    faAngleDoubleUp,
    faInfoCircle,
    faAngleDoubleDown,
    faFileImport,
    faBan,
    faBackspace,
    faRandom,
    faArrowLeft,
    faArrowRight,
    faEye,
    faSearch,
    faProjectDiagram,
    faCheck,
    faPaste,
} from '@fortawesome/free-solid-svg-icons';
import { StixService } from '../stix-service.service';
import { Observable } from 'rxjs';
import { EnvService } from '../env-service/env.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';

@Component({
    selector: 'app-objects-viewer',
    templateUrl: './objects-viewer.component.html',
    styleUrls: ['./objects-viewer.component.css'],
    standalone: false,
})
export class ObjectsViewerComponent implements OnInit {
    @Input() objects: any;
    @Input() rcPairs: any;
    @Input() title: string;
    @Input() description: string;

    faEdit = faEdit;
    faInfoCircle = faInfoCircle;
    faTrash = faTrash;
    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDoubleUp = faAngleDoubleUp;
    faAddToBundle = faFileImport;
    faSave = faSave;
    faDownload = faDownload;
    faUndo = faUndo;
    faUpload = faUpload;
    faPlusSquare = faPlusSquare;
    faLink = faLink;
    faFileDownload = faFileDownload;
    faFileUpload = faFileUpload;
    faBan = faBan;
    faBackspace = faBackspace;
    faMerge = faRandom;
    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    faEye = faEye;
    faSearch = faSearch;
    faProjectDiagram = faProjectDiagram;
    faCheck = faCheck;
    faPaste = faPaste;

    taxiiServer = {
        url: this.envService.env.taxiiServer.url,
        username: this.envService.env.taxiiServer.username,
        password: this.envService.env.taxiiServer.password,
        certificate: null,
        apiRoot: '',
        childRoot: '',
        availableCollections: [],
        collection: null,
    };

    stixObjects = STIX_OBJECTS;
    objectsObservable = null;

    rownumber: number = -1;
    objnumber: number = -1;

    roots: any;
    rcPairsMapping: any = [];

    constructor(
        public activeModal: NgbActiveModal,
        public stixService: StixService,
        private router: Router,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {}

    ngOnInit(): void {
        let allCheckDuplicates: Observable<any>[] = [];

        forkJoin(allCheckDuplicates).subscribe((data: any) => {
            console.info(JSON.stringify(data));
        });

        this.roots = this.stixService.apiRoots2;
    }

    changeShow(objIndex, rowIndex): void {
        if (objIndex == this.objnumber && rowIndex == this.rownumber) {
            this.rownumber = -1;
        } else {
            this.objnumber = objIndex;
            this.rownumber = rowIndex;
        }
    }

    getComponentId(component: any, i: number, j: number, k: number): string {
        let result = `${this.getComponentDisplay(component)}${i}${j}${k}`;

        return result;
    }

    getComponentDisplay(component: any): string {
        if (component.type) {
            let componentDisplay = '';
            switch (component.type) {
                case 'malware-analysis': {
                    componentDisplay = component.id;
                    break;
                }
                case 'artifact': {
                    if (component.payload_bin) componentDisplay = component.payload_bin;
                    else componentDisplay = component.url;
                    break;
                }
                case 'autonomous-system': {
                    componentDisplay = `${component.number} ${component.name ? '(' + component.name + ')' : ''}`;
                    break;
                }
                case 'directory': {
                    componentDisplay = component.path;
                    break;
                }
                case 'email-message': {
                    componentDisplay = `${component.subject ? component.subject : `No Subject Included: (${component.id})`}`;
                    break;
                }
                case 'file': {
                    if (component.name) componentDisplay = component.name;
                    else if (component.hashes)
                        componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'domain-name':
                case 'email-addr':
                case 'url':
                case 'ipv4-addr':
                case 'ipv6-addr':
                case 'mac-addr': {
                    componentDisplay = component.value;
                    break;
                }
                case 'mutex':
                case 'software': {
                    componentDisplay = component.name;
                    break;
                }
                case 'process': {
                    if (component.pid) componentDisplay = component.pid;
                    else if (component.cwd) componentDisplay = component.cwd;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'relationship': {
                    if (component.source_ref && component.target_ref) {
                        let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.source_ref),
                            targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
                        if (sourceRefObject.length > 0 && targetRefObject.length > 0)
                            componentDisplay = `${this.getComponentDisplay(sourceRefObject[0])} -> ${this.getComponentDisplay(targetRefObject[0])}`;
                        else componentDisplay = `<NO NAME> (${component.id})`;
                    } else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'user-account': {
                    if (component.user_id) componentDisplay = component.user_id;
                    else if (component.account_login) componentDisplay = component.account_login;
                    else if (component.display_name) componentDisplay = component.display_name;

                    break;
                }
                case 'windows-registry-key': {
                    if (component.key) componentDisplay = component.key;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                case 'x509-certificate': {
                    if (component.subject) componentDisplay = component.subject;
                    else if (component.serial_number) componentDisplay = component.serial_number;
                    else if (component.hashes)
                        componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
                    else if (component.issuer) componentDisplay = component.issuer;
                    else componentDisplay = `<NO NAME> (${component.id})`;
                    break;
                }
                default:
                    return component.name ? component.name : `<NO NAME> (${component.id})`;
            }

            return componentDisplay;
        } else return component.name ? component.name : '<NO NAME>';
    }

    getStixObjectID(type): string {
        type = type.toLowerCase();
        type.replace(' ', '-');

        return type;
    }

    addToBundle() {
        this.objects.forEach((o, i) => {
            if (o.checked) {
                delete o.checked;
                this.stixService.addComponent(o);

                let refs = [];
                if (o.object_refs && o.object_refs.length > 0) {
                    refs = [...o.object_refs];
                    refs.push(o.id);
                    this.stixService.getObjectFromIDHelper(refs, true, this.rcPairsMapping[i].root, this.rcPairsMapping[i].collection);
                }

                if (o.type === 'relationship') {
                    if (o.source_ref) {
                        refs.push(o.source_ref);
                    }

                    if (o.target_ref) {
                        refs.push(o.target_ref);
                    }

                    if (refs.length > 0) {
                        refs.push(o.id);
                        this.stixService.getObjectFromIDHelper(refs, true, this.rcPairsMapping[i].root, this.rcPairsMapping[i].collection);
                    }
                }
            }
        });

        this.announcementService.show('Succesfully imported', 'Successfully imported duplicate object from TAXII', 'success', false);

        this.router.navigate(['bundle']);

        this.activeModal.close({ type: 'add' });
    }

    close() {
        this.activeModal.close({ type: 'cancel' });
    }

    checkAllObjects(event, objectType: string) {
        this.objects
            .filter((o) => o.type === objectType)
            .forEach((o) => {
                o.checked = event.target.checked;
            });
    }
    disableAddToBundle() {
        return !this.objects.some((o) => o.checked);
    }

    showRcPair(index) {
        let rcPairsAll = [];
        this.rcPairs.forEach((rc) => {
            rcPairsAll.push(Object.entries(rc));
        });

        let rcString = '(';

        rcPairsAll[index].forEach((rcPair: any, i: number) => {
            if (i > 0) {
                rcString += ' | ';
            }

            rcPair.forEach((rc: any, j: number) => {
                if (j === 0) {
                    rcString = `${rcString}Root: ${rc}`;
                    return;
                } else {
                    let rootFound = this.roots.find((r) => r.apiPath === rcPair[j - 1]);

                    if (rootFound) {
                        rcString = `${rcString}, Collection: `;
                        let collectionNames = '';

                        rc.forEach((cId) => {
                            let collectionFound = rootFound.collections.find((c) => cId === c.id);
                            if (collectionFound) {
                                rcString = `${rcString} ${collectionFound.title}`;
                            }
                        });
                    }
                }
            });

            if (i === 0) {
                this.rcPairsMapping.push({ root: rcPair[0], collection: rcPair[1][0] });
            }
        });

        rcString += ')';

        return rcString;
    }
}
