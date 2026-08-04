import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
    Component,
    OnInit,
    ViewChild,
    Input,
    ChangeDetectorRef,
    Inject,
    HostListener,
    TemplateRef,
    ElementRef,
    DOCUMENT,
    NgZone,
} from '@angular/core';
import { catchError, forkJoin, from, lastValueFrom, Observable, of, Subject, takeUntil } from 'rxjs';
import { Bundle } from '../models/bundle';
import { StixService } from '../stix-service.service';
import { STIX_OBJECTS, STIX_OBJECTS_LIST } from '../models/stix-objects';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnvService } from '../env-service/env.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { Content } from '../models/content';
import all_schemas from './schemas.json';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RelationshipDialogComponent } from '../query-stix/relationship-dialog/relationship-dialog/relationship-dialog.component';
import {
    faEdit,
    faTrash,
    faSave,
    faDownload,
    faUndo,
    faUpload,
    faPlus,
    faMinus,
    faPlusSquare,
    faMinusSquare,
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
    faAngleDown,
    faAngleUp,
    faEye,
    faSearch,
    faProjectDiagram,
    faCheck,
    faPaste,
    faTrafficLight,
    faMarker,
    faAngleDoubleLeft,
    faAngleDoubleRight,
    faToolbox,
    faCaretDown,
    faCaretUp,
    faRetweet,
    faExternalLinkAlt,
    faPlug,
} from '@fortawesome/free-solid-svg-icons';
import { Analyst1DialogComponent } from '../dialogs/analyst1-dialog/analyst1-dialog.component';
import { MessageDialogComponent } from '../dialogs/message-dialog/message-dialog.component';
import { CopyPasteDialogComponent } from '../dialogs/copy-paste-dialog/copy-paste-dialog.component';
import { GuidedService } from '../guided.service';

import { v4 as uuid } from 'uuid';
import { LoggingService } from '../logging-service/logging.service';
import { TLP20_OPTIONS, TLP_OPTIONS } from '../tlpMarkingDef';
import { SavedBundlesService } from '../saved-bundles/saved-bundles-service/saved-bundles.service';
import { SubmissionsService } from '../submissions-service/submissions.service';
import { ObjectsViewerComponent } from '../objects-viewer/objects-viewer.component';
import { GlobalTlpComponent } from '../global-tlp/global-tlp.component';
import { VtDialogComponent } from '../dialogs/vt-dialog/vt-dialog.component';
import { DeleteDialogComponent } from '../add-component/delete-dialog-component/delete-dialog-component.component';
import { AcsDialogComponent } from '../dialogs/acs-dialog/acs-dialog.component';
import { JsonModalComponent } from './json-modal/json-modal.component';
import { ObjectsModalComponent } from './objects-modal/objects-modal.component';
import { ReportModalComponent } from './report-modal/report-modal.component';
import { VisualizerModalComponent } from './visualizer-modal/visualizer-modal.component';
import { db } from '../db.service';
import { MispStixService } from '../misp-stix-service/misp-stix.service';
import { MispDialogComponent } from '../misp-dialog/misp-dialog.component';
import { MispService } from '../misp-service/misp.service';
import { RemoveObjectComponent } from '../remove-object/remove-object.component';

import { validateStix } from '../shared/utils/validation.utils';
import { LoadingModalComponent } from '../loading-modal/loading-modal.component';

declare const require: any;
const Validator = require('jsonschema').Validator;
const Minify = require('node-json-minify');

@Component({
    selector: 'app-bundle',
    templateUrl: './bundle.component.html',
    styleUrls: ['./bundle.component.css', '../app.component.css', '../dashboard/dashboard.component.css'],
    standalone: false,
})
export class BundleComponent implements OnInit {
    @Input() showObjectSection: any = true;
    @Input() showVisualizerSection: any = true;
    @Input() showBundleObjectsSectionOnly: any = false;
    @Input() showBundleSection: any = true;
    @Input() menuSelection: any = null;
    @Input() isGroupByTLP: any = false;
    @ViewChild('stixModal') stixModal!: TemplateRef<any>;
    @ViewChild('saveModal') saveModal!: TemplateRef<any>;
    @ViewChild('tlpModal') tlpModal!: TemplateRef<any>;
    @ViewChild('fileInput') fileInput!: ElementRef;

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
    faPlus = faPlus;
    faMinus = faMinus;
    faPlusSquare = faPlusSquare;
    faMinusSquare = faMinusSquare;
    faLink = faLink;
    faFileDownload = faFileDownload;
    faFileUpload = faFileUpload;
    faBan = faBan;
    faBackspace = faBackspace;
    faMerge = faRandom;
    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;
    faEye = faEye;
    faSearch = faSearch;
    faProjectDiagram = faProjectDiagram;
    faCheck = faCheck;
    faPaste = faPaste;
    faTrafficLight = faTrafficLight;
    faMarker = faMarker;
    faLeft = faAngleDoubleLeft;
    faRight = faAngleDoubleRight;
    faTools = faToolbox;
    faCaretDown = faCaretDown;
    faCaretUp = faCaretUp;
    faRetweet = faRetweet;
    faExternalLink = faExternalLinkAlt;
    faPlug = faPlug;

    private vtCache = new Map<string, any>();

    filteredBundle: any[];
    customBundle: any[];
    bundleCopy;
    bundle: Bundle;
    categorizedBundle: any;
    isDiscarding: boolean = false;
    isMerging: boolean = false;
    isPublishing: boolean = false;
    isUploading: boolean = false;
    isResetNeeded: boolean = false;
    loadingApiRoots: boolean = false;
    loadingStix: boolean = false;
    creatingObject: boolean = true;
    showingBundle: boolean = true;
    showingVisualizer: boolean = false;
    showingAnalyst1: boolean = false;
    prevShowingVisualizer: boolean = false;
    modalCurrentStep = 1; // Current step the modal is on prior to publishing
    modalStepCount = 3; // Max steps before publishing - corresponds to how many sections there are in the publish modal
    stixObjects = STIX_OBJECTS;
    AIS_COLLECTIONS = [
        {
            apiPath: 'ingest',
            title: 'AIS Ingest',
            collections: [
                {
                    id: '3a5910b5-b4f5-4f1e-8852-a8eec1664847',
                    title: 'AIS Ingest Collection',
                    can_read: true,
                    can_write: true,
                    description: 'Automatically sorts STIX into collections',
                    media_types: ['application/stix+json;version=2.1'],
                },
            ],
        },

        {
            apiPath: 'federal',
            title: 'Federal API Root',
            collections: [
                {
                    id: '13109a4c-ab86-49df-a7e1-c212ae7b4816',
                    title: 'Federal Collection',
                    can_read: true,
                    can_write: false,
                    description: 'STIX Objects Shareable with the Federal Community',
                    media_types: ['application/stix+json;version=2.1'],
                },
                {
                    id: 'a6313101-fa6c-4276-bb96-7e826f0b248a',
                    title: 'Public Collection',
                    can_read: true,
                    can_write: false,
                    description: 'STIX Objects Shareable with the Public Community',
                    media_types: ['application/stix+json;version=2.1'],
                },
                {
                    id: 'dfdb73d4-a84e-4d4a-bdaf-56fd633e0d35',
                    title: 'CISCP Collection',
                    can_read: true,
                    can_write: false,
                    description: 'STIX Objects Shareable with the CISCP Community',
                    media_types: ['application/stix+json;version=2.1'],
                },
            ],
        },
    ];
    taxiiServer = {
        url: this.stixService.taxiiServer.url,
        username: this.stixService.taxiiServer.username,
        password: this.stixService.taxiiServer.password,
        certificate: null,
        apiRoot: '',
        childRoot: '',
        availableCollections: [],
        collection: null,
    };
    taxiiServerAuthType = this.stixService.taxiiServerAuthType;
    taxiiServerType = this.stixService.taxiiServerType;
    required = [];

    searchText: string = '';
    searchTextAnalyst1: string = '';
    prevSearch: string = '';
    searchResults: string = '';
    searchIndex: number = 0;
    searchMatches: Array<string> = [];
    rownumber: number = -1;
    objnumber: number = -1;

    apiRootProcessingError = '';
    apiRootProcessingErrorURL = '';
    aisUrl = this.envService.env.aisTaxiiProxy.url;
    selectedAPIRoot = null;
    APIRoots = [];
    noResults = true;
    selectedCollection;
    apiRoots = [];
    collections = [];
    taxiiServerBaseUrl = '';
    activeTab = 'jsonViewer';
    customObjects: any[] = []; //Derek - I think this is deprecated

    upload: any = [];
    bad_uploads: any[] = [];
    selectedFile;
    importingObjects: boolean = false;
    savingBundle: boolean = false;
    loadingBundle: boolean = false;
    deletedCISAIdentity: boolean = false;
    bundleName: string = '';
    invalidName: string = '';
    selectedBundle: string = '';
    selectedBundle2: string = '';
    savedBundleDict: any = {};
    isSavingBundle = false;

    selectedObjects: any[] = [];
    objectsQueryResults = {};

    promptDel: any[] = [];
    toDelete: any[] = [];
    prevDel: any = null;
    nextDel: any;
    origID: string = '';
    reqRefProps: string[] = [];
    opened = false;
    editedRef = false;

    guidedUI: boolean;

    analyst1Objects: any = [];
    analyst1TotalPages: number = 0;
    analyst1currentPage: number = 0;
    loadingStixNext: boolean = false;
    addingStixToBundle: boolean = false;
    publishA1: boolean = false;

    checkRefsModalRef: MatDialogRef<LoadingModalComponent> = null;

    mispTitle = '';
    mispProducer = 'imx';

    mispServers = [];
    mispUrl = '';
    mispApi = '';
    saveMisp = false;

    expandMisp = false;
    publishMisp = false;
    loadingMisp = false;
    editorOptions = {
        theme: 'vs',
        language: 'json',
        minimap: {
            enabled: false,
        },
        readOnly: true,
        overviewRulerLanes: 0,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
    };
    mispJson = 'Fill in Report Title and Producer, then click "Convert" to convert STIX Bundle to MISP JSON';
    mispObj = null;

    taxiiServerUrl: string = ''; // This is global purely for the guided ui - can definitely be fixed

    page: Map<string, number>;
    customPage: number = 1;

    modalRef: any;

    unassignedObjMarkingRefObjs = null;
    tlpOptions = [];
    tlpCounts = [];

    elem: any;
    fullScreenMode: boolean = false;

    viewingSavedBundles: boolean = false;
    savedBundleResults: string = '';
    bundleRowNumber: number = -1;

    savingModalData: any = {};
    loadingModalData: any = {};
    isReset: boolean = false;

    events: any = [];
    impacts: any = [];
    tasks: any = [];

    newVersionObjectsLoad = [];
    loadedBundleName: string = '';

    duplicates: any = [];
    references: any = [];
    environment = this.envService.env;
    showDuplicatedObjectToast = false;

    expandedObjectTypes = [];
    expandedTlpTypes = [];

    objectsExpanded = false;

    saveConfig = false;
    stixConfigSaved = false;
    fullScreenPress = null;
    lastExpanded = null;

    globalTLP = null;
    selectedTlpOption = null;
    applyTlpToAll = false;

    acsConfiguration;

    //New Editor variables
    expandSidebar = false;
    toolExpanded = false;
    tlpExpanded = false;
    reportName = '';
    loadingPublishModal = false;

    autoCheck: 'true' | 'false' = 'false';
    objCheckMap: Map<string, boolean> = new Map();

    private cancelDuplicate$ = new Subject<void>();
    private cancelReferences$ = new Subject<void>();

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullscreen(event: KeyboardEvent) {
        if (!this.lastExpanded) {
            this.lastExpanded = Math.floor(Date.now() / 1000);
        } else {
            let timeNow = Math.floor(Date.now() / 1000);
            if (timeNow - this.lastExpanded <= 1) {
                return;
            }
            this.lastExpanded = timeNow;
        }

        setTimeout(() => {
            if (!this.fullScreenPress) {
                this.fullScreenPress = 'expand';

                if (this.fullScreenMode) {
                    this.stixService.sendData({ type: 'full-screen', value: true });
                } else {
                    this.stixService.sendData({ type: 'full-screen', value: false });
                }
                return;
            }

            if (this.fullScreenPress === 'expand') {
                this.fullScreenPress = null;
                this.stixService.sendData({ type: 'full-screen', value: false });
                this.stixService.sendData({ type: 'close-full-screen', value: false });
            }
        }, 200);
    }

    @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
        setTimeout(() => {
            this.stixService.sendData({ type: 'full-screen', value: false });
            this.stixService.sendData({ type: 'close-full-screen', value: false });
        }, 200);
    }

    private readonly httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

    private readonly httpHeadersJSON = new HttpHeaders()
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

    constructor(
        public readonly envService: EnvService,
        private readonly announcementService: AnnouncementService,
        private readonly modalService: NgbModal,
        public stixService: StixService,
        public mispStix: MispStixService,
        private readonly router: Router,
        private readonly httpClient: HttpClient,
        public matDialog: MatDialog,
        public relationshipDialog: MatDialog,
        private readonly loggingService: LoggingService,
        private readonly changeDetector: ChangeDetectorRef,
        @Inject(DOCUMENT) private readonly document: any,
        private readonly savedBundlesService: SavedBundlesService,
        private readonly submissions: SubmissionsService,
        public readonly guidedService: GuidedService,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
        private readonly mispService: MispService
    ) {
        this.bundle = this.stixService.bundle;
        this.duplicates = [];
        this.customObjects = this.stixService.getCustomObjects();
        if (this.stixService.added) this.parseDeletionQueue();
        this.stixService.added = false;
        this.stixService.deletionQueue = [];
        if (this.envService.env.taxiiServer.username === 'keycloak') {
            this.taxiiServerAuthType = 'keycloak';
            this.stixService.taxiiServerAuthType = 'keycloak';
        }

        this.guidedUI = this.stixService.guidedUI;

        if (stixService.acsObject) {
            stixService.acsSelection = stixService.acsObject.type;
        } else {
            stixService.acsSelection = '';
        }
    }

    setTlpOptions() {
        if (this.envService.env.tlpConfig.enabledTlpVersions.length === 1) {
            const tlpVersion = this.envService.env.tlpConfig.enabledTlpVersions[0].value;
            this.tlpOptions = this.stixService.getTlpOptions(tlpVersion);
            this.tlpOptions.unshift({ key: 'UNASSIGNED', name: 'Unassigned', css: 'TLP-UNASSIGNED', short: 'UNASSIGNED' });

            if (tlpVersion === 'v2') {
                const tlpWhite = this.stixService.getTlpOptions('v1').find((elem) => elem.key === 'TLP:WHITE');
                this.tlpOptions.push(tlpWhite);
            }
        }
    }

    async ngOnInit(): Promise<void> {
        if (!this.envService.init) {
            await this.envService.waitInit();
        }

        if (this.stixService.expandedObjectTypes == undefined || this.stixService.expandedObjectTypes == null)
            this.stixService.expandedObjectTypes = [];

        if (this.stixService.expandedTlpTypes == undefined || this.stixService.expandedTlpTypes == null) this.stixService.expandedTlpTypes = [];

        const autoCheck = localStorage.getItem('auto-check-enabled');

        if (autoCheck === 'true') this.autoCheck = 'true';
        else this.autoCheck = 'false';

        this.reportName = this.stixService.reportName;

        this.stixService.getUnreadAlerts();

        this.setTlpOptions();

        if (this.showBundleObjectsSectionOnly) {
            this.showBundleSection = false;
        }

        // Add CISA identity
        let ids = JSON.parse(JSON.stringify({ arr: [] }));
        const existingIdentity = localStorage.getItem('identity');

        if (!existingIdentity) localStorage.setItem('identity', this.envService.env.defaultIdentity.id);

        let localStorageIdentities = localStorage.getItem('identities');

        if (localStorageIdentities) {
            try {
                ids = JSON.parse(localStorageIdentities);
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }

        const existingCISAIdentity = ids.arr.find((i) => i.id === this.envService.env.defaultIdentity.id);

        if (!existingCISAIdentity) {
            ids.arr.push(this.envService.env.defaultIdentity);
            localStorage.setItem('identities', JSON.stringify(ids));
        }

        this.stixService.db.imxCache.toArray().then((result) => {
            if (result.length < 1 && existingCISAIdentity !== undefined) {
                this.stixService.addComponent(existingCISAIdentity);
            } else if (result.length < 1) {
                this.stixService.addComponent(this.envService.env.defaultIdentity);
            }
        });

        if (this.stixService.taxiiServer?.url?.length === 0 || this.stixService.taxiiServerType == 'ais') {
            this.serverSettingsChanged(this.stixService.taxiiServerType);
        }

        if (this.taxiiServerType === 'custom') {
            this.selectedAPIRoot = null;
        }

        this.stixService.getData().subscribe((data) => {
            if (data?.type && data.type === 'loading-objects-complete') {
                this.loadingStix = false;
            }
        });

        this.getUnassignedObjects();
        this.countTLP();

        this.page = new Map();

        for (let stixObject of this.stixObjects) {
            for (let object of stixObject.objects) {
                this.page.set(object.type, 1);
            }
        }

        this.elem = document.documentElement;
        this.pullCoreExtensionObjects();

        // add sorting observed-data by first_observed under request during customer meeting
        const byFirstObserved = (a, b) => {
            if (a['type'] !== 'observed-data' || b['type'] !== 'observed-data') {
                return 0;
            } else {
                a = new Date(a['first_observed']).getTime();
                b = new Date(b['first_observed']).getTime();
            }

            return a - b;
        };
        // Only clear origID if there are no pending reference prompts to handle
        if (this.stixService.promptDelete.length === 0) {
            this.stixService.origID = '';
        }

        this.bundle.objects.sort(byFirstObserved);
        this.filteredBundle = this.stixService.bundle.objects;
        this.customBundle = this.stixService.customObjects;

        this.loadedBundleName = JSON.parse(localStorage.getItem('bundle-name'))?.bundleName;

        if (this.taxiiServerType == 'default')
            setTimeout(() => {
                this.checkDupesAndRefs();
            }, 1500);

        this.stixService.getData().subscribe((data) => {
            if (data.type === 'close-full-screen') {
                this.closeFullscreen();
            }
        });

        setTimeout(() => {
            if (this.stixService.expandAll !== null) {
                this.objectsExpanded = this.stixService.expandAll;
            }

            if (this.stixService.expandedObjectTypes && this.stixService.expandedObjectTypes.length > 0) {
                this.stixService.expandedObjectTypes.forEach((t) => {
                    this.toggleObjectTypeToShow(t, true);
                });
            }

            if (this.stixService.isGroupByTLP) {
                let event = { target: { value: 'true' } };
                this.selectGroupByTLP(event);
            }

            if (this.stixService.expandedTlpTypes && this.stixService.expandedTlpTypes.length > 0) {
                this.stixService.expandedTlpTypes.forEach((t) => {
                    this.toggleTlpTypeToShow(t);
                });
            }

            this.clearSearchResults();
        }, 500);
    }

    ngOnDestroy() {
        this.cancelReferences$.next();
        this.cancelDuplicate$.next();

        if (this.checkRefsModalRef !== null) {
            this.checkRefsModalRef.close();
            this.checkRefsModalRef = null;
        }
    }

    toggleSidebar() {
        this.expandSidebar = !this.expandSidebar;
    }

    enableSidebar() {
        this.expandSidebar = true;
    }

    disableSidebar() {
        this.expandSidebar = false;
    }

    openFileUpload(event) {
        event.stopPropagation();
        this.fileInput.nativeElement.click();
    }

    openJson(event, component, objectType, custom = false, initialTab: 'json' | 'vt' | 'misp' = 'json', modal = null) {
        event.stopPropagation();
        let modalRef;

        if (initialTab == 'json') {
            modalRef = this.modalService.open(JsonModalComponent, { size: 'xl' });
        } else {
            modalRef = this.modalService.open(JsonModalComponent, { windowClass: 'json-modal', centered: true });
        }

        modalRef.componentInstance.component = component;
        modalRef.componentInstance.objectType = objectType;
        modalRef.componentInstance.disableEditObject = this.disableEditObject.bind(this);
        modalRef.componentInstance.mispEligible = initialTab != 'json' && this.isMispEligible(component);

        if (initialTab == 'vt') {
            if (this.isIntegrationEligible(component)) {
                const vtInfo = this.getIntegrationIndicator(component);
                if (vtInfo) {
                    modalRef.componentInstance.vtIndicator = vtInfo.value;
                    modalRef.componentInstance.vtIndicatorType = vtInfo.type;
                    modalRef.componentInstance.activeTab = initialTab;
                    const cachedData = this.vtCache.get(vtInfo.value);
                    if (cachedData) {
                        modalRef.componentInstance.vtCachedData = cachedData;
                    }
                }
            }
        } else if (initialTab == 'misp') {
            if (this.isMispEligible(component)) {
                let indicators = this.mispService.buildIndicatorString(component);

                const classification = this.mispService.validateAndClassifyInputs(indicators);

                modalRef.componentInstance.activeTab = initialTab;

                this.mispService
                    .searchMisp(this.mispService.mapClassification(classification))
                    .then((res) => {
                        modalRef.componentInstance.mispResults = res;
                    })
                    .catch((e) => {
                        this.announcementService.show('Error retrieving from MISP', e, 'error', false);
                    });
            }
        }

        const saveVtCache = () => {
            if (modalRef.componentInstance.vtCachedData) {
                const vtInfo = this.getIntegrationIndicator(component);
                if (vtInfo) {
                    this.vtCache.set(vtInfo.value, modalRef.componentInstance.vtCachedData);
                }
            }
        };

        modalRef.result.then(
            (data) => {
                saveVtCache();
                if (!data) return;
                if (data.action === 'delete') {
                    this.removeObject(data.object.id);
                } else if (data.action === 'edit') {
                    this.editObject(data.object, custom);
                } else if (data.action === 'custom') {
                    this.createCustomObject(component);
                } else if (data.action === 'vtImport') {
                    this.importVtObjects(data.objects);
                } else if (data.action === 'mispImport') {
                    this.importMispObjects(data, modal);
                }
            },
            () => {
                saveVtCache();
            }
        );
    }

    openReport() {
        const modalRef = this.modalService.open(ReportModalComponent);
        modalRef.result.then((data) => {
            this.reportName = this.stixService.reportName;
        });
    }

    openVisualizer() {
        const modalRef = this.modalService.open(VisualizerModalComponent, { size: 'xl', windowClass: 'visualizer-modal' });
        modalRef.componentInstance.getStixPreview = this.getStixPreview;
    }

    openObjectMenu(event) {
        this.envService.checkAuth(window.location.pathname);
        event.stopPropagation();
        this.modalService.open(ObjectsModalComponent, { size: 'xl', centered: true });
    }

    expandTlpDropdown(event) {
        event.stopPropagation();
        if (!this.expandSidebar) {
            this.expandSidebar = true;
            this.tlpExpanded = true;
        } else {
            this.tlpExpanded = !this.tlpExpanded;
        }
    }

    openTlpMenu(event) {
        event.stopPropagation();
        this.openGlobalTLPConfig();
    }

    removeTlpMenu(event, modal) {
        event.stopPropagation();
        this.removeTlp(modal);
    }

    openAcsMenu(event) {
        event.stopPropagation();
        this.openStixConfig();
    }

    openRelationshipMenu(event) {
        event.stopPropagation();
        if (this.selectedObjects.length != 2) return;

        this.createRelationship();
    }

    openAnalyst1Menu(event) {
        event.stopPropagation();
        this.openAnalyst1Modal();
    }

    openVirusTotalMenu(event, modal) {
        event.stopPropagation();
        this.vtDialog(modal);
    }

    openSaveBundleMenu(event, modal) {
        event.stopPropagation();
        this.saveBundleModal(modal, true);
    }

    openResetMenu(event, modal) {
        event?.stopPropagation();
        this.resetBundle(modal);
    }

    openPublishMenu(event, modal) {
        event.stopPropagation();
        if (this.loadingPublishModal) return;

        this.loadingPublishModal = true;
        this.reportName = this.stixService.reportName;
        this.modalCurrentStep = 2;
        this.openPublishModal(modal);
    }

    downloadBundleItem(event) {
        event.stopPropagation();
        this.downloadBundle();
    }

    openUploadFile(event) {
        console.info(event);
    }

    clickTool(event) {
        event.stopPropagation();

        if (!this.expandSidebar) {
            this.expandSidebar = true;
            this.toolExpanded = true;
        } else {
            this.toolExpanded = !this.toolExpanded;
        }
    }

    openRawDataMenu(event, modal) {
        event.stopPropagation();
        this.copyPaste(modal);
    }

    expandCollapse() {
        this.objectsExpanded = !this.objectsExpanded;

        this.stixService.expandAll = this.objectsExpanded;

        if (!this.objectsExpanded) {
            this.stixService.expandedTlpTypes = [];
            this.expandedTlpTypes = [];
        } else if (this.objectsExpanded) {
            this.expandedObjectTypes = [];
            this.expandedTlpTypes = [];

            for (let tlp of this.tlpOptions) {
                if (
                    (tlp.key === 'UNASSIGNED' && this.unassignedObjMarkingRefObjs?.length > 0) ||
                    (tlp.key !== 'UNASSIGNED' && this.tlpCount(tlp) > 0)
                ) {
                    this.expandedTlpTypes.push(tlp.key);
                }
            }

            this.stixService.expandedTlpTypes = this.expandedTlpTypes;
        }

        this.bundle.objects.forEach((o) => {
            this.toggleObjectTypeToShow(o.type);
        });

        this.stixService.customObjects.forEach((co) => {
            this.toggleObjectTypeToShow('custom');
        });

        const categories = [
            'REPORT',
            'WHAT (Impact)',
            'HOW (CWE)',
            'HOW (TTP)',
            'HOW (Query)',
            'HOW (Observable)',
            'HOW (Detection)',
            'WHERE (Location)',
            'WHO',
        ];

        categories.forEach((cat) => this.toggleObjectTypeToShow(cat));
    }

    toggleObjectTypeToShow(objectType, direct = false) {
        let expandedObjects: any = localStorage.getItem('expanded-objects');
        if (expandedObjects) expandedObjects = JSON.parse(expandedObjects);
        else expandedObjects = {};

        let foundObjectTypeIndex = this.expandedObjectTypes.findIndex((o) => o === objectType);
        if (foundObjectTypeIndex >= 0 && (direct || !this.objectsExpanded)) {
            this.expandedObjectTypes.splice(foundObjectTypeIndex, 1);
            expandedObjects[objectType] = false;
        } else if (foundObjectTypeIndex < 0 && (direct || this.objectsExpanded)) {
            this.expandedObjectTypes.push(objectType);
            expandedObjects[objectType] = true;
        }

        localStorage.setItem('expanded-objects', JSON.stringify(expandedObjects));
        this.stixService.expandedObjectTypes = this.expandedObjectTypes;
    }

    toggleTlpTypeToShow(tlpType) {
        let expandedTlp: any = localStorage.getItem('expanded-tlp');

        if (expandedTlp) {
            expandedTlp = JSON.parse(expandedTlp);

            //Fixing past mistake
            if (typeof expandedTlp === 'boolean') {
                expandedTlp = {};
            }
        } else expandedTlp = {};

        let foundtlpTypeIndex = this.expandedTlpTypes.findIndex((o) => o === tlpType);

        if (foundtlpTypeIndex >= 0) {
            this.expandedTlpTypes.splice(foundtlpTypeIndex, 1);
            expandedTlp[tlpType] = false;
        } else if (foundtlpTypeIndex < 0) {
            this.expandedTlpTypes.push(tlpType);
            expandedTlp[tlpType] = true;
        }

        localStorage.setItem('expanded-tlp', JSON.stringify(expandedTlp));
        this.stixService.expandedTlpTypes = this.expandedTlpTypes;
    }

    expandTlp(tlpType) {
        if (this.expandedTlpTypes && this.expandedTlpTypes.length > 0) {
            return this.expandedTlpTypes.some((t) => tlpType === t);
        }
        return false;
    }

    showObjectType(objectType) {
        return this.expandedObjectTypes.some((o) => o === objectType);
    }

    switchAutoCheck() {
        if (this.autoCheck == 'true') {
            this.autoCheck = 'false';
        } else {
            this.autoCheck = 'true';
        }

        localStorage.setItem('auto-check-enabled', this.autoCheck);
    }

    async checkDuplicate(obj) {
        let publishedObjects: any = await db.getAllPublishedObjects();
        let notDuplicate: any = JSON.parse(localStorage.getItem('not-duplicates')) ?? [];

        let duplicated = this.stixService.checkDuplicates(obj);

        if (duplicated) {
            publishedObjects.push(obj);
            await db.savePublishedObject(obj);

            await new Promise((resolve) => {
                duplicated.subscribe({
                    next: (data: any) => {
                        if (data?.body?.founds && data.body.founds.length > 0) {
                            let dupsFound = [];
                            let rcPairs = [];
                            data.body.founds.forEach((o) => {
                                dupsFound.push(o.object);
                                rcPairs.push(o.fcPairs);
                            });

                            this.duplicates.push({
                                original: obj,
                                duplicated: dupsFound,
                                rcPairs: rcPairs,
                            });
                        }

                        return resolve(true);
                    },
                    error: (err) => {
                        console.error(err);
                        return resolve(true);
                    },
                });
            });
        } else {
            notDuplicate.push(obj.id);
            localStorage.setItem('not-duplicate', JSON.stringify(notDuplicate));
        }
    }

    async checkDuplicates() {
        if (this.taxiiServerType === 'custom') return;

        this.duplicates = [];
        let originals = [];
        this.cancelDuplicate$ = new Subject<void>();

        let allCheckDuplicates: Observable<any>[] = [];
        let publishedObjects: any = await db.getAllPublishedObjects();
        let notDuplicate: any = JSON.parse(localStorage.getItem('not-duplicates')) ?? [];

        for (const o of this.bundle.objects) {
            await new Promise((res) => {
                setTimeout(
                    async () => {
                        try {
                            originals.push(o);
                            let duplicated = this.stixService.checkDuplicates(o);

                            if (duplicated) {
                                allCheckDuplicates.push(duplicated);
                                publishedObjects.push(o);
                                await db.savePublishedObject(o);
                            } else {
                                notDuplicate.push(o.id);
                                localStorage.setItem('not-duplicate', JSON.stringify(notDuplicate));
                            }

                            return res(true);
                        } catch (err) {
                            console.error(err);
                            return res(true);
                        }
                    },
                    this.stixService.isLoading ? 25000 : 100
                );
            });
        }

        forkJoin(allCheckDuplicates)
            .pipe(takeUntil(this.cancelDuplicate$))
            .subscribe((data: any) => {
                data.forEach((d: any, i: number) => {
                    if (d?.body?.founds && d.body.founds.length > 0) {
                        let dupsFound = [];
                        let rcPairs = [];
                        d.body.founds.forEach((o) => {
                            dupsFound.push(o.object);
                            rcPairs.push(o.fcPairs);
                        });

                        this.duplicates.push({
                            original: originals[i],
                            duplicated: dupsFound,
                            rcPairs: rcPairs,
                        });
                    }
                });
            });
    }

    async checkReferences() {
        this.references = [];
        const batchSize = 5;
        this.cancelReferences$ = new Subject<void>();

        try {
            for (let i = 0; i < this.bundle.objects.length; i += batchSize) {
                let allCheckReferences: Observable<any>[] = [];
                const batch = this.bundle.objects.slice(i, i + batchSize);

                batch.forEach((o: any) => {
                    let referenced = this.stixService.checkReferences(o);

                    if (referenced) {
                        allCheckReferences.push(referenced);
                    } else {
                        allCheckReferences.push(of(null));
                    }
                });

                await new Promise((resolve, reject) => {
                    forkJoin(allCheckReferences)
                        .pipe(
                            takeUntil(this.cancelReferences$),
                            catchError((err) => {
                                console.log(err);
                                return of([]);
                            })
                        )
                        .subscribe((data: any) => {
                            if (data.length == 0) return resolve(false);
                            data.forEach((d: any, i: number) => {
                                if (!d) return resolve(false);

                                let allReferencedInRelationship: Observable<any>[] = [];
                                let allReferencedInRelationshipIndex: number[] = [];

                                if (d?.body?.founds && d.body.founds.length > 0) {
                                    let refsFound = [];
                                    let rcPairs = [];
                                    d.body.founds.forEach((o) => {
                                        refsFound.push(o.object);
                                        rcPairs.push(o.fcPairs);

                                        if (o.object.type === 'relationship') {
                                            let objectId = null;

                                            if (this.bundle.objects[i].id === o.object.source_ref) {
                                                objectId = o.object.target_ref;
                                            }

                                            if (this.bundle.objects[i].id === o.object.target_ref) {
                                                objectId = o.object.source_ref;
                                            }

                                            if (objectId) {
                                                let referenced = this.stixService.checkId(objectId);

                                                if (referenced) {
                                                    allReferencedInRelationship.push(referenced);
                                                    allReferencedInRelationshipIndex.push(i);
                                                }
                                            }
                                        }
                                    });
                                    if (allReferencedInRelationship.length > 0) {
                                        forkJoin(allReferencedInRelationship).subscribe((data: any) => {
                                            this.pushReferencesDataForEach(data, refsFound, rcPairs, allReferencedInRelationshipIndex);
                                        });
                                    } else {
                                        this.references.push({
                                            original: this.bundle.objects[i],
                                            referenced: refsFound,
                                            rcPairs: rcPairs,
                                        });
                                    }
                                }

                                return resolve(true);
                            });
                        });
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    pushReferencesDataForEach(data, refsFound, rcPairs, allReferencedInRelationshipIndex) {
        data.forEach((d: any, i: number) => {
            if (d?.body?.founds && d.body.founds.length > 0) {
                d.body.founds.forEach((o) => {
                    refsFound.push(o.object);
                    rcPairs.push(o.fcPairs);
                });

                this.references.push({
                    original: this.bundle.objects[allReferencedInRelationshipIndex[i]],
                    referenced: refsFound,
                    rcPairs: rcPairs,
                });
            }
        });
    }

    pushReferencesRefDataForEach(refData, refsFound, rcPairs, obj) {
        if (refData?.body?.founds && refData.body.founds.length > 0) {
            refData.body.founds.forEach((refO) => {
                refsFound.push(refO.object);
                rcPairs.push(refO.fcPairs);
            });

            this.references.push({
                original: obj,
                referenced: refsFound,
                rcPairs: rcPairs,
            });
        }
    }

    async checkReference(obj) {
        let referenced = this.stixService.checkReferences(obj);

        if (referenced) {
            await new Promise((res) => {
                referenced.subscribe({
                    next: (data: any) => {
                        if (data?.body?.founds && data.body.founds.length > 0) {
                            let refsFound = [];
                            let rcPairs = [];
                            let checkId;

                            data.body.founds.forEach((o) => {
                                refsFound.push(o.object);
                                rcPairs.push(o.fcPairs);

                                if (o.object.type === 'relationship') {
                                    let objectId = null;

                                    if (obj.id === o.object.source_ref) {
                                        objectId = o.object.target_ref;
                                    }

                                    if (obj.id === o.object.target_ref) {
                                        objectId = o.object.source_ref;
                                    }

                                    if (objectId) {
                                        checkId = this.stixService.checkId(objectId);
                                    }
                                }
                            });

                            if (checkId) {
                                checkId.subscribe(
                                    (refData: any) => {
                                        this.pushReferencesRefDataForEach(refData, refsFound, rcPairs, obj);

                                        return res(true);
                                    },
                                    (err) => {
                                        return res(true);
                                    }
                                );
                            } else {
                                this.references.push({
                                    original: obj,
                                    referenced: refsFound,
                                    rcPairs: rcPairs,
                                });

                                return res(true);
                            }
                        }

                        return res(true);
                    },
                    error: (err) => {
                        console.error(err);
                        return res(true);
                    },
                });
            });
        }
    }

    isDuplicated(id) {
        return this.duplicates.some((d: any) => {
            return d.original.id === id;
        });
    }

    isReferenced(id) {
        return this.references.some((d: any) => {
            return d.original.id === id;
        });
    }

    ref(id) {
        let ref = this.references.find((r) => r.original.id === id);
        return ref;
    }

    @HostListener('click', ['$event'])
    viewDuplicates(event, component) {
        if (event.target.localName.includes('img')) {
            event.stopPropagation();

            let duplicates = this.duplicates.find((d: any) => d.original.id === component.id);

            if (duplicates) {
                let duplicated = [...duplicates.duplicated];
                let rcPairs = [...duplicates.rcPairs];

                if (duplicated.length > 0) {
                    this.openObjectViewerModal(
                        duplicated,
                        rcPairs,
                        'Duplicated Objects',
                        'Existing similar objects across all roots and collections on the selected server.'
                    );
                }
            }
        }
    }

    viewReferences(event, component) {
        if (event.target.localName.includes('img')) {
            event.stopPropagation();

            let references = this.references.find((r: any) => r.original.id === component.id);

            if (references) {
                let referenced = [...references.referenced];
                let rcPairs = [...references.rcPairs];

                if (referenced.length > 0) {
                    this.openObjectViewerModal(
                        referenced,
                        rcPairs,
                        'Referencing Objects',
                        'Objects referencing this object across all roots and collections.'
                    );
                }
            }
        }
    }

    openObjectViewerModal(objects, rcPairs, title, description = null) {
        const modalRef = this.modalService.open(ObjectsViewerComponent, { size: 'xl' });
        modalRef.componentInstance.objects = objects;
        modalRef.componentInstance.rcPairs = rcPairs;
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.description = description;

        modalRef.result.then((resp) => {
            if (resp.type === 'add') {
                setTimeout(() => {
                    this.checkDupesAndRefs();
                }, 500);
            }
        });
    }

    async checkDupesAndRefs() {
        if (this.autoCheck === 'true') {
            this.checkRefsModalRef = this.matDialog.open(LoadingModalComponent, {
                disableClose: true,
                hasBackdrop: true,
            });

            this.checkRefsModalRef.afterClosed().subscribe((canceled) => {
                if (canceled) {
                    this.cancelCheckDupesAndRefs();
                }
            });

            try {
                this.checkDuplicates();
                await this.checkReferences();
            } catch (e) {
                console.log(e);
            }

            if (this.checkRefsModalRef !== null) {
                this.checkRefsModalRef.close();
                this.checkRefsModalRef = null;
            }
        }
    }

    cancelCheckDupesAndRefs() {
        this.cancelDuplicate$.next();
        this.cancelReferences$.next();

        this.switchAutoCheck();

        if (this.checkRefsModalRef !== null) {
            this.checkRefsModalRef.close();
            this.checkRefsModalRef = null;
        }
    }

    async checkDupeAndRef(obj, event) {
        event.stopPropagation();

        if (this.taxiiServerType === 'custom') return;

        this.objCheckMap.set(obj.id, true);

        const promises = [];
        promises.push(this.checkDuplicate(obj));
        promises.push(this.checkReference(obj));

        Promise.all(promises).then(() => {
            this.objCheckMap.set(obj.id, false);
        });
    }

    pullCoreExtensionObjects(): void {
        this.events = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'event'); // && obj["extensions"]["extension-definition—-​4ca6de00-5b0d-45ef-a1dc-ea7279ea910e"]);
        this.impacts = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'impact');
        this.tasks = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'task');
        this.events = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'malware-behavior');
        this.impacts = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'malware-method');
        this.tasks = this.stixService.bundle.objects.filter((obj) => obj['type'] == 'malware-objective');
    }

    public changeShow(objIndex, rowIndex): void {
        if (objIndex == this.objnumber && rowIndex == this.rownumber) {
            this.rownumber = -1;
        } else {
            this.objnumber = objIndex;
            this.rownumber = rowIndex;
        }
    }

    importObjects(modal: any) {
        this.loadingBundle = false;
        this.importingObjects = true;
        this.stixService.hasObjectsToLoad = false;
        this.announcementService.remove();
        if (this.stixService.bundle.objects.length > 0) {
            this.modalService.dismissAll();
            this.activeTab = 'jsonViewer';
            this.modalService.open(modal, { ariaLabelledBy: 'save-modal-title', size: 'xl', windowClass: 'publish-modal' }).result.finally(() => {
                if (this.stixService.importReportName && !this.stixService.reportName)
                    this.stixService.setReportName(this.stixService.importReportName);

                if (localStorage.getItem('creating-bundle-from-report') == 'true' && this.isDiscarding) {
                    const reportN = localStorage.getItem('creating-bundle-from-report-name');
                    if (reportN) this.stixService.setReportName(reportN);
                }

                // Reset Values
                this.stixService.importReportName = '';
                this.importingObjects = false;
                this.savingBundle = false;
                this.stixService.objectsToLoad = [];
                this.bundleName = '';
                this.invalidName = '';
                this.selectedBundle2 = '';
                this.isUploading = false;
                this.isDiscarding = false;
                this.isMerging = false;
                localStorage.setItem('creating-bundle-from-report', 'false');
                localStorage.removeItem('creating-bundle-from-report-name');
            });
        } else {
            this.importingObjects = false;
            this.stixService.importReportName = '';
            this.addObjectsAsync(this.stixService.objectsToLoad);
        }

        this.changeDetector.detectChanges();
    }

    async clearBundle(): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                this.stixService.clearBundle();
                this.searchText = '';
                this.reportName = '';
                this.bundle = this.stixService.bundle;
                this.bundle.id = `bundle--${uuid()}`;
                this.customObjects = [];
                this.isResetNeeded = false;
                this.stixService.addComponent(this.envService.env.defaultIdentity);
                this.deletedCISAIdentity = false;
                this.rownumber = -1;
                this.objnumber = -1;
                this.updateGroupByTLP();
                localStorage.setItem('acsIgnore', JSON.stringify([]));
                localStorage.setItem('reportsToNotTrack', JSON.stringify([]));
                localStorage.removeItem('user-acs');
                await db.clearPublishedObjects();

                if (this.guidedService) {
                    this.guidedService.cachedCart = [];
                    localStorage.setItem('cached-cart', JSON.stringify(this.guidedService.cachedCart));
                    this.guidedService.cart = {};
                    localStorage.setItem('guided-cart', JSON.stringify(this.guidedService.cart));
                    this.guidedService.editCart = {};
                    localStorage.setItem('edit-cart', JSON.stringify(this.guidedService.editCart));
                    this.guidedService.currentCartIndex = null;
                    localStorage.setItem('cart-index', JSON.stringify(this.guidedService.currentCartIndex));

                    this.guidedService.organizeCart();
                    this.guidedService.organizeCategories();
                    this.guidedService.cartLengths = {
                        total: 0,
                        'who-individual': 0,
                        'how-event-detection': 0,
                        'how-observable': 0,
                        'how-pattern-builder': 0,
                        'how-ttp': 0,
                        'how-cwe': 0,
                        'what-impact': 0,
                        'where-location': 0,
                    };
                }
                resolve();
            }, 100);
        });
    }

    async resetBundle(modal: any) {
        await this.envService.checkAuth('/bundle');
        await db.clearPublishedObjects();
        localStorage.setItem('acsIgnore', JSON.stringify([]));
        localStorage.setItem('reportsToNotTrack', JSON.stringify([]));
        this.isReset = true;
        this.savingBundle = false;
        this.loadingBundle = false;
        this.showingVisualizer = false;
        this.newVersionObjectsLoad = [];
        this.stixService.newVersionObjects = [];
        this.modalService.dismissAll();
        this.activeTab = 'jsonViewer';
        this.modalService.open(modal, { ariaLabelledBy: 'save-modal-title', size: 'l', windowClass: 'publish-modal', centered: true });
    }

    async saveBundleModal(modal: any, clearCallback: boolean) {
        await this.envService.checkAuth('/bundle');
        this.isReset = false;
        if (clearCallback) this.stixService.tempStatusCallback = undefined;
        this.showingVisualizer = false;
        this.modalService.dismissAll();
        this.activeTab = 'jsonViewer';
        this.savingBundle = false;
        this.loadingBundle = false;
        this.modalService.open(modal, { ariaLabelledBy: 'save-modal-title', size: 'xl', windowClass: 'publish-modal', centered: true });
    }

    categorizeBundle(): void {
        if (!this.categorizedBundle) {
            for (let stixObject of this.stixObjects) {
                for (let object of stixObject.objects) {
                    this.categorizedBundle[object.type] = { page: 1, objects: [] };
                }
            }
        }
    }

    dismissModal(): void {
        this.modalService.dismissAll();
    }

    removeBundleName(): void {
        localStorage.removeItem('bundle-name');
        this.loadedBundleName = '';
    }

    discardBundle(): void {
        this.isDiscarding = true;
        setTimeout(async () => {
            const objectsToLoad = [...this.stixService.objectsToLoad];
            this.modalService.dismissAll();
            this.addingStixToBundle = true;
            try {
                await this.clearBundle();
                await this.addObjectsAsync(objectsToLoad);

                if (this.stixService.uploadErrors) {
                    this.announcementService.show(
                        'STIX validation issues encountered while uploading',
                        this.stixService.uploadErrors,
                        'upload-error',
                        false,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        0,
                        false
                    );
                }
                this.updateGroupByTLP();
                this.loadVersioning();
                setTimeout(() => {
                    this.checkDupesAndRefs();
                }, 500);
            } catch (error) {
                this.announcementService.show(
                    'Unexpected error while uploading',
                    `${error}\n~~~~~\n\n${this.stixService.uploadErrors}`,
                    'upload-error',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    0,
                    false
                );
            } finally {
                this.addingStixToBundle = false;
                this.isDiscarding = false;
                this.loadingBundle = false;
                this.stixService.objectsToLoad = [];
                this.stixService.newVersionObjects = [];
                this.stixService.uploadErrors = '';
                this.newVersionObjectsLoad = [];
                this.clearSearchResults();
            }
        });
    }

    mergeBundle(objectsToLoad: any): void {
        this.isMerging = true;

        setTimeout(async () => {
            this.modalService.dismissAll();
            this.addingStixToBundle = true;
            this.searchText = '';
            try {
                await this.addObjectsAsync(objectsToLoad);

                this.loadVersioning();
                if (this.stixService.uploadErrors) {
                    this.announcementService.show(
                        'STIX validation issues encountered while uploading',
                        this.stixService.uploadErrors,
                        'upload-error',
                        false,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        0,
                        false
                    );
                }

                setTimeout(() => {
                    this.checkDupesAndRefs();
                }, 500);
            } catch (error) {
                this.announcementService.show(
                    'Unexpected error while uploading',
                    `${error}\n~~~~~\n\n${this.stixService.uploadErrors}`,
                    'upload-error',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    0,
                    false
                );
            } finally {
                this.addingStixToBundle = false;
                this.stixService.uploadErrors = '';
                this.isMerging = false;
                this.loadingBundle = false;
                this.stixService.newVersionObjects = [];
                this.updateGroupByTLP();
                this.clearSearchResults();
            }
        });
    }

    async discard() {
        await this.clearBundle();
        await this.addObjectsAsync(this.stixService.objectsToLoad);
        this.dismissModal();
        this.stixService.objectsToLoad = [];
        this.removeBundleName();
        this.clearSearchResults();
        this.updateGroupByTLP();
    }

    async addObjectsAsync(objects: any): Promise<void> {
        const customObjects = this.upload.filter((obj: any) => !STIX_OBJECTS_LIST.includes(obj.type));
        objects = customObjects.concat(objects);

        const objectsToAdd = objects.map((object) => ({
            id: object.id,
            index: this.stixService.imxCacheIndex++,
            object,
        }));

        await this.stixService.db.imxCache.bulkPut(objectsToAdd);
        const addedBundle = await this.stixService.db.imxCache.orderBy('index').toArray();
        const newBundle = addedBundle.map((obj) => obj.object);
        const bundleObjects = newBundle.filter((obj) => STIX_OBJECTS_LIST.includes(obj.type));
        const customObjs = newBundle.filter((obj) => !STIX_OBJECTS_LIST.includes(obj.type));

        // Ensure changes happen inside Angular’s zone and use new references
        this.ngZone.run(() => {
            this.stixService.bundle.objects = [...bundleObjects];
            this.stixService.customObjects = [...customObjs];
            this.customObjects = [...customObjs];
            this.bundle = { ...this.stixService.bundle, objects: [...bundleObjects] };
            this.cdr.markForCheck(); // Trigger view update in OnPush components
        });

        this.stixService.imxCacheIndex = addedBundle.length > 0 ? addedBundle[addedBundle.length - 1].index + 1 : 1;

        for (const obj of objects) {
            this.stixService.addIdentity(obj);
        }
        this.stixService.updateMarkingDef();

        this.upload = [];
    }

    async loadBundle(modal: any) {
        this.savingBundle = false;

        this.savedBundleDict = {};
        for (let obj of this.stixService.savedBundles) {
            let bundle = obj;
            this.savedBundleDict[bundle.name] = bundle.bundle;
        }
        this.activeTab = 'jsonViewer';
        this.loadingBundle = false;
        this.modalService.open(modal, { ariaLabelledBy: 'load-modal-title', size: 'xl', windowClass: 'publish-modal' }).result.finally(() => {
            // Reset Values
            this.loadingBundle = false;
            this.selectedBundle = '';
        });
    }

    updateSaveModal(event) {
        if (event.status === 'save') {
            this.savingModalData = event;

            if (event.isNew === true) {
                this.saveBundle(event.destination).then((data) => {
                    this.stixService.setReportName(event.name);
                    this.reportName = this.stixService.reportName;
                });
            } else {
                this.overwriteBundle().then((data) => {
                    this.stixService.setReportName(event.name);
                    this.reportName = this.stixService.reportName;
                });
            }
        } else if (event.status === 'load') {
            this.loadingBundle = true;
            this.loadingModalData = event;
            const newVersionObjects =
                event.destination === 'local' ? event?.bundle?.new_version_objects : this.loadingModalData?.bundle?._source?.new_version_objects;
            this.newVersionObjectsLoad = newVersionObjects ?? [];
            this.selectedBundle = this.loadingModalData.name;
        }
    }

    updateLoadModal(event) {
        if (event.status === 'load') {
            this.loadingBundle = true;
            this.loadingModalData = event;
            this.selectedBundle = this.loadingModalData.name;
        }
    }

    uploadFile(modal: any) {
        this.modalService.open(modal, { ariaLabelledBy: 'load-modal-title', size: 'xl', windowClass: 'publish-modal' }).result.finally(() => {
            // Reset Values
            this.loadingBundle = false;
            this.selectedBundle = '';
        });
    }

    sendBundle() {
        this.stixService.objectsToLoad = this.getStixPreview().objects;
        this.selectedBundle2 = this.selectedBundle;
        this.modalService.dismissAll();
        this.stixService.hasObjectsToLoad = true;
    }

    setNewVersionBundle() {
        let newVersionBundle = [];
        const newObjects: Array<any> = JSON.parse(localStorage.getItem('new_version_objects'));

        if (newObjects && newObjects.length > 0) {
            this.bundle.objects.forEach((obj) => {
                if (newObjects.includes(obj.id)) newVersionBundle.push(obj.id);
            });
        }

        return newVersionBundle;
    }

    setZoneString(timestamp) {
        let timeArr = timestamp.split('(');
        let timezone = timeArr[1];
        let zoneArr = timezone.split(' ');
        let zoneString = '';

        for (let word of zoneArr) {
            zoneString += word.substring(0, 1);
        }

        return zoneString;
    }

    async ifSavingModalDataDestinationProfile(tempBundle) {
        let tempDoc = this.savingModalData.bundle;
        tempDoc._source = tempBundle;

        let res: any = await this.savedBundlesService.updateSavedBundle(tempDoc);
        if (!res.data && !res.data.result && res.data.result !== 'updated') {
            this.announcementService.show(
                'Error in Saving Bundle',
                'Error saving Bundle to IMX Server, please either try again or saved locally',
                'error',
                false
            );
        } else {
            this.announcementService.show('Bundle Saved', 'The Bundle was successfully overwritten to My Profile', 'success', false);
            this.addObjectsAsync(this.stixService.objectsToLoad);
            if (this.selectedBundle2 != '') {
                this.stixService.serverSavedBundles = this.stixService.serverSavedBundles.filter((bundle) => bundle.name !== this.selectedBundle2);
            }
        }
    }

    async overwriteBundle(): Promise<void> {
        const newVersionBundle = this.setNewVersionBundle();

        let timestamp = new Date().toString();
        let zoneString = this.setZoneString(timestamp);
        let timeString = `${timestamp.substring(0, 24)} ${zoneString}`;

        const bundle =
            this.savingModalData.destination === 'profile' ? this.savingModalData.bundle._source.bundle : this.savingModalData.bundle.bundle;

        let tempBundle = {
            reportNo:
                this.savingModalData.destination === 'profile' ? this.savingModalData.bundle._source.reportNo : this.savingModalData.bundle.reportNo,
            name: this.savingModalData.name,
            bundle: this.savingModalData.isChangingName ? bundle : this.bundle.objects,
            created:
                this.savingModalData.destination === 'profile' ? this.savingModalData.bundle._source.created : this.savingModalData.bundle.created,
            modified: timeString,
            owner: this.envService.getUsername(),
            tlp: this.findTlpColor(this.bundle.objects),
            submissionID:
                this.savingModalData.destination === 'profile'
                    ? this.savingModalData.bundle._source.submissionID
                    : this.savingModalData.bundle.submissionID,
            publicationServer:
                this.savingModalData.destination === 'profile'
                    ? this.savingModalData.bundle._source.publicationServer
                    : this.savingModalData.bundle.publicationServer,
            publicationRoot:
                this.savingModalData.destination === 'profile'
                    ? this.savingModalData.bundle._source.publicationRoot
                    : this.savingModalData.bundle.publicationRoot,
            publicationStatus:
                this.savingModalData.destination === 'profile'
                    ? this.savingModalData.bundle._source.publicationStatus
                    : this.savingModalData.bundle.publicationStatus,
            internal_status:
                this.savingModalData.destination === 'profile'
                    ? this.savingModalData.bundle._source.internal_status
                    : this.savingModalData.bundle.internal_status,
            new_version_objects: newVersionBundle,
        };

        if (this.stixService.tempStatusCallback) {
            tempBundle.submissionID = this.stixService.tempStatusCallback.data._id;
            let submission: any = await this.submissions.getSubmissionByID(tempBundle.submissionID);

            tempBundle.publicationServer = `Taxii: ${submission.type}`;
            tempBundle.publicationRoot = `Root/Col: ${submission.root}/${submission.collection.title}`;
            tempBundle.publicationStatus = `Status: ${submission.res.status}`;
            tempBundle.new_version_objects = this.stixService.newVersionObjects;
        }

        switch (this.savingModalData.destination) {
            case 'profile':
                await this.ifSavingModalDataDestinationProfile(tempBundle);
                break;
            case 'local':
                await this.stixService.db.savedBundles
                    .where({ name: this.savingModalData.bundle.name, owner: this.envService.getUsername() })
                    .modify(tempBundle);
                this.announcementService.show('Bundle Saved', 'The Bundle was successfully overwritten locally', 'success', false);
                break;
        }

        this.modalService.dismissAll();
        await this.stixService.getSavedBundles(1, '', this.envService.getUsername());
    }

    async saveBundle(destination): Promise<void> {
        const newVersionBundle = this.setNewVersionBundle();

        this.isSavingBundle = true;

        this.stixService.reportNo++;

        let timestamp = new Date().toString();
        let timeArr = timestamp.split('(');
        let timezone = timeArr[1];
        let zoneArr = timezone.split(' ');
        let zoneString = '';
        for (let word of zoneArr) {
            zoneString += word.substring(0, 1);
        }
        let timeString = `${timestamp.substring(0, 24)} ${zoneString}`;

        let tempBundle = {
            reportNo: this.stixService.reportNo,
            name: this.savingModalData.name,
            bundle: this.bundle.objects,
            created: timeString,
            modified: '',
            owner: this.envService.getUsername(),
            tlp: this.findTlpColor(this.bundle.objects),
            submissionID: '',
            publicationServer: '',
            publicationRoot: '',
            publicationStatus: '',
            internal_status: this.savingModalData.bundle.internal_status !== 'TBD' ? this.savingModalData.bundle.internal_status : 'TBD',
            new_version_objects: newVersionBundle,
        };

        if (this.stixService.tempStatusCallback) {
            tempBundle.submissionID = this.stixService.tempStatusCallback.data._id;
            let submission: any = await this.submissions.getSubmissionByID(tempBundle.submissionID);
            tempBundle.publicationServer = `Taxii: ${submission.type}`;
            tempBundle.publicationRoot = `Root/Col: ${submission.root}/${submission.collection.title}`;
            tempBundle.publicationStatus = `Status: ${submission.res.status}`;
            tempBundle.new_version_objects = this.stixService.newVersionObjects;
        }

        try {
            if (destination === 'local') {
                this.announcementService.show('Bundle Saved', 'The Bundle was Saved Locally', 'success', false);
            } else {
                let res: any = await this.savedBundlesService.postSavedBundle(tempBundle);

                if (res.status !== 201) {
                    this.announcementService.show(
                        'Error in Saving Bundle',
                        'Error saving Bundle to IMX Server, please either try again or report the error',
                        'error',
                        false
                    );
                } else {
                    this.announcementService.show('Bundle Saved', 'The Bundle was Saved to Server', 'success', false);
                    this.addObjectsAsync(this.stixService.objectsToLoad);
                    if (this.selectedBundle2 != '') {
                        this.stixService.serverSavedBundles = this.stixService.serverSavedBundles.filter(
                            (bundle) => bundle.name !== this.selectedBundle2
                        );
                    }
                }
            }
        } catch (err) {
            console.error('Error saving bundle:', err);
            this.announcementService.show(
                'Error in Saving Bundle',
                'Error saving Bundle to IMX Server, please either try again or report the error',
                'error',
                false
            );
        } finally {
            this.isSavingBundle = false;
            this.modalService.dismissAll();
            await this.stixService.getSavedBundles(1, '', this.envService.getUsername());
        }
    }

    invalidBundleName(): boolean {
        for (let bundle of this.stixService.savedBundles) {
            this.savedBundleDict[bundle.name] = bundle.bundle;
        }

        if (this.bundleName != this.selectedBundle2 && this.savedBundleDict[this.bundleName]) {
            this.invalidName = 'Name already in use';
            return true;
        }
        this.invalidName = '';
        return false;
    }

    ifCustomContructTaxiiServerUrl() {
        let apiRoot = '';
        if (typeof this.selectedAPIRoot == 'string') {
            apiRoot = this.selectedAPIRoot;
        } else if (this.selectedAPIRoot.apiPath) {
            apiRoot = this.selectedAPIRoot.apiPath;
        } else {
            apiRoot = this.selectedAPIRoot['api-root'];
        }

        if (this.taxiiServerBaseUrl.includes('/taxii/v2.1-os')) {
            return `${this.taxiiServerBaseUrl}${apiRoot}/collections/${this.selectedCollection.id}/objects/`;
        } else {
            return `${this.taxiiServerBaseUrl}taxii/v2.1-os/${apiRoot}/collections/${this.selectedCollection.id}/objects/`;
        }
    }

    constructTaxiiServerURL(a1?: string): string {
        if (this.taxiiServerType === 'custom') {
            this.taxiiServer.username = this.stixService.taxiiServer.username;
            this.taxiiServer.password = this.stixService.taxiiServer.password;
            this.taxiiServer.url = this.stixService.taxiiServer.url;
        }

        if (a1 || this.publishA1) {
            this.taxiiServer.url = this.envService.env.taxiiServer.url;
            this.taxiiServer.username = this.envService.env.taxiiServer.username;
            this.taxiiServer.password = this.envService.env.taxiiServer.password;
        }

        if ((a1 && a1 == 'a1') || this.publishA1) {
            return `${this.envService.env.taxiiServer.a1ChildRoot}collections/${this.envService.env.taxiiServer.a1CollectionId}/objects/`;
        } else if (a1 && a1 == 'raw') {
            return `${this.envService.env.taxiiServer.a1ChildRoot}collections/${this.envService.env.taxiiServer.a1RawCollectionId}/objects/`;
        } else if (a1) {
            return '';
        } else if (
            (this.taxiiServerType === 'default' || this.taxiiServerType === 'cma') &&
            this.taxiiServer.url &&
            this.taxiiServer.childRoot &&
            this.selectedCollection?.id
        )
            return `${this.taxiiServer.childRoot}collections/${this.selectedCollection.id}/objects/`;
        else if (this.taxiiServerType === 'custom' && this.taxiiServer.url && this.taxiiServer.username && this.taxiiServer.password) {
            return this.ifCustomContructTaxiiServerUrl();
        } else if (this.taxiiServerType === 'ais') {
            return `${this.taxiiServer.childRoot}collections/3a5910b5-b4f5-4f1e-8852-a8eec1664847/objects/`;
        } else if (this.taxiiServerType === 'sandbox') {
            return `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/${this.envService.env.customConfiguration.sandbox.apiRoot}/collections/${this.envService.env.customConfiguration.sandbox.collectionId}/objects/`;
        } else if (this.taxiiServerType === 'cisa') {
            return `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/${this.envService.env.customConfiguration.cisa.apiRoot}/collections/${this.envService.env.customConfiguration.cisa.collectionId}/objects/`;
        } else if (this.taxiiServerType === 'cisaAis') {
            return `${this.envService.env.aisTaxiiProxy.url}${this.envService.env.customConfiguration.cisaAis.apiRoot}/collections/${this.taxiiServer.collection?.id}/objects/`;
        }

        return '';
    }

    createObject(): void {
        this.creatingObject = !this.creatingObject;
    }

    createRelationship(): void {
        let options: any[] = [];
        let objs = this.bundle.objects.concat(this.stixService.customObjects);

        for (let selected of this.selectedObjects) {
            for (let obj of objs) {
                if (obj.id === selected) {
                    options.push(obj);
                }
            }
        }

        let source = options[0];
        let target = options[1];

        const dialogRef = this.relationshipDialog.open(RelationshipDialogComponent, {
            data: { options: options, source: source, target: target, from: 'bundle' },
            height: '400px',
            width: `${window.innerWidth / 2}px`,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && !this.guidedUI) this.router.navigateByUrl('/add-component/relationship', { state: result });
            if (result && this.guidedUI) {
                const relationshipEvent = {
                    type: 'create-relationship-go-forward',
                };
                this.stixService.sendData(relationshipEvent);

                setTimeout(() => {
                    const relationshipEvent = {
                        type: 'create-relationship',
                        value: result,
                    };
                    this.stixService.sendData(relationshipEvent);
                }, 300);
            }
        });
    }

    createSighting() {
        const relationshipEvent = {
            type: 'create-sighting-go-forward',
        };
        this.stixService.sendData(relationshipEvent);

        setTimeout(() => {
            const relationshipEvent = {
                type: 'create-sighting',
                value: {
                    sighting: this.selectedObjects,
                },
            };
            this.stixService.sendData(relationshipEvent);
        }, 500);
    }

    getStixObjectID(type): string {
        type = type.toLowerCase();
        type.replace(' ', '-');

        return type;
    }

    searchCompare(object: any, target: string): boolean {
        let data = JSON.stringify(object);
        if (data.toLowerCase().includes(target.toLowerCase())) {
            return true;
        }

        return false;
    }

    searchCategory(searchText) {
        for (const category in this.guidedService.categories) {
            this.guidedService.filteredCategories[category] = [];

            this.guidedService.categories[category].forEach((elem) => {
                if (this.searchCompare(elem, searchText)) {
                    this.guidedService.filteredCategories[category].push(elem);

                    if (this.stixService.expandedObjectTypes && !this.stixService.expandedObjectTypes.some((t) => t === elem.type)) {
                        this.toggleObjectTypeToShow(category, true);
                        this.showObjectType(category);
                    }
                }
            });
        }
    }

    findMatches(tempSearch) {
        for (let i = 0; i < this.stixObjects.length; i++) {
            for (let j = 0; j < this.stixObjects[i].objects.length; j++) {
                let stix_type = this.stixObjects[i].objects[j].type;
                let count = 0;

                for (let currObj of this.bundle.objects) {
                    let bundle_type = currObj.type;

                    if (stix_type === bundle_type && this.searchCompare(currObj, tempSearch)) {
                        this.searchMatches.push(this.getComponentId(currObj, i, j, count));
                        count++;
                    } else if (stix_type === bundle_type) {
                        count++;
                    }
                }
            }
        }
    }

    search(type): void {
        if (this.searchText === '') return;

        if (this.prevSearch === this.searchText) {
            if (type === 'enter') this.searchIndex++;
            else this.searchIndex--;
        } else {
            this.prevSearch = this.searchText;
            this.searchIndex = 0;
            this.searchResults = '';
            this.searchMatches = [];

            this.findMatches(this.searchText.toLowerCase());
        }

        if (this.searchIndex < 0) this.searchIndex = this.searchMatches.length - 1;
        else if (this.searchIndex >= this.searchMatches.length) this.searchIndex = 0;

        this.searchResults = `${this.searchIndex + 1} of ${this.searchMatches.length}`;

        let el = document.getElementById(this.searchMatches[this.searchIndex]);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    getFirstBundleObject(): string {
        for (let objI of this.stixObjects) {
            for (let objJ of objI.objects) {
                let stix_type = objJ.type;

                for (let objK of this.bundle.objects) {
                    let bundle_type = objK.type;

                    if (stix_type === bundle_type) {
                        return objK.type;
                    }
                }
            }
        }
        return '';
    }

    clearSearch(): void {
        let target = this.getFirstBundleObject();

        this.searchResults = '';
        this.searchText = '';
        this.filteredBundle = this.stixService.bundle.objects;
        this.customBundle = this.stixService.customObjects;

        let el = document.getElementById(target);

        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    clearSearchResults() {
        if (!this.searchText) {
            if (!this.guidedUI) {
                this.filteredBundle = this.stixService.bundle.objects;
                this.customBundle = this.stixService.customObjects;
            } else {
                for (const cat in this.guidedService.categories) {
                    this.guidedService.filteredCategories[cat] = [...this.guidedService.categories[cat]];
                }
            }
            return;
        }

        this.searchResults = '';

        if (!this.guidedUI) {
            this.filteredBundle = this.stixService.bundle.objects.filter((o) => {
                return this.highlightSearch(o);
            });

            this.customBundle = this.stixService.customObjects.filter((o) => {
                return this.highlightSearch(o);
            });
        } else {
            this.searchCategory(this.searchText);
        }

        // this.filteredBundle.objects.forEach((o) => {
        //     this.highlightSearch(o);
        // });
    }

    clearSearchAnalyst1() {
        this.searchTextAnalyst1 = '';
    }

    highlightSearch(component: any): boolean {
        if (this.searchText === '') return false;
        let tempSearch = this.searchText.toLowerCase();

        if (this.searchCompare(component, tempSearch)) {
            if (this.stixService.expandedObjectTypes && !this.stixService.expandedObjectTypes.some((t) => t === component.type)) {
                this.toggleObjectTypeToShow(component.type, true);
                this.showObjectType(component.type);
            }

            const tlpObj: any = this.getTlp(component);
            let tlpType = '';
            if (tlpObj?.length == 0) {
                tlpType = 'UNASSIGNED';
            } else {
                tlpType = tlpObj[0].name;
            }

            if (this.stixService.expandedTlpTypes && !this.stixService.expandedTlpTypes.some((t) => t === tlpType)) {
                this.objectsExpanded = true;
                this.toggleTlpTypeToShow(tlpType);
            }
            return true;
        }

        return false;
    }

    getComponentId(component: any, i: number, j: number, k: number): string {
        let result = `${this.getComponentDisplay(component)}${i}${j}${k}`;

        return result;
    }

    getComponentDisplayAcsOrMarkingDef(acs, component) {
        if (acs[component.id]) {
            return acs[component.id];
        }

        if (this.stixService.markingDefinition[component.id]) {
            return this.stixService.markingDefinition[component.id];
        }

        return `(${component.id})`;
    }

    getComponentDisplayEmailMessage(component) {
        if (component.subject) {
            return `${component.subject}`;
        }

        return `No Subject Included: (${component.id})`;
    }

    getComponentDisplayMarkingDef(component) {
        let componentDisplay = '';
        let acs = JSON.parse(localStorage.getItem('acs-type')) ?? {};

        // Display as CUI or CONTROLLED if extensions include extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a
        if (component?.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']) {
            componentDisplay = this.stixService.getCuiDisplay(
                component.extensions['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a'],
                component.id
            );
        } else {
            componentDisplay = this.getComponentDisplayAcsOrMarkingDef(acs, component);

            if (componentDisplay === 'Federal and non-Federal Entities' && this.stixService.taxiiServerType === 'ais')
                componentDisplay = 'Federal and CISCP';
        }

        return componentDisplay;
    }

    getComponentDisplayArtifact(component) {
        let componentDisplay = '';

        if (component.payload_bin) {
            if (component.hashes) {
                const keys = Object.keys(component.hashes);
                componentDisplay = component.hashes[keys[0]];
            } else {
                componentDisplay = component.id;
            }
        } else {
            componentDisplay = component.url;
        }

        return componentDisplay;
    }

    getComponentDisplayFile(component) {
        let componentDisplay = '';

        if (component.name) componentDisplay = component.name;
        else if (component.hashes) componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayProcess(component) {
        let componentDisplay = '';

        if (component.pid) componentDisplay = component.pid;
        else if (component.cwd) componentDisplay = component.cwd;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayRelationship(component) {
        let componentDisplay = '';

        if (component.source_ref && component.target_ref) {
            let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.source_ref);
            let targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
            let sourceDisplay = sourceRefObject.length > 0 ? this.getComponentDisplay(sourceRefObject[0]) : component.source_ref;
            let targetDisplay = targetRefObject.length > 0 ? this.getComponentDisplay(targetRefObject[0]) : component.target_ref;
            let relationship_type = component.relationship_type;

            componentDisplay = `${sourceDisplay} <i>${relationship_type}</i> ${targetDisplay}`;
        } else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayUserAccount(component) {
        let componentDisplay = '';

        if (component.user_id) componentDisplay = component.user_id;
        else if (component.account_login) componentDisplay = component.account_login;
        else if (component.display_name) componentDisplay = component.display_name;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayWindowsRegistryKey(component) {
        let componentDisplay = '';

        if (component.key) componentDisplay = component.key;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayX509(component) {
        let componentDisplay = '';

        if (component.subject) componentDisplay = component.subject;
        else if (component.serial_number) componentDisplay = component.serial_number;
        else if (component.hashes) componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
        else if (component.issuer) componentDisplay = component.issuer;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayObservedString(component) {
        let componentDisplay = '';

        if (component.value) componentDisplay = component.value;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplay(component: any): string {
        if (!component?.type) {
            return component?.name ?? '<NO NAME>';
        }

        let componentDisplay = '';
        switch (component.type) {
            case 'marking-definition':
                componentDisplay = this.getComponentDisplayMarkingDef(component);
                break;
            case 'malware-analysis':
                componentDisplay = component.id;
                break;
            case 'artifact':
                componentDisplay = this.getComponentDisplayArtifact(component);
                break;
            case 'autonomous-system':
                componentDisplay = `${component.number} ${component.name ? '(' + component.name + ')' : ''}`;
                break;
            case 'directory':
                componentDisplay = component.path;
                break;
            case 'email-message':
                componentDisplay = this.getComponentDisplayEmailMessage(component);
                break;
            case 'file':
                componentDisplay = this.getComponentDisplayFile(component);
                break;
            case 'domain-name':
            case 'email-addr':
            case 'url':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr':
                componentDisplay = component.value;
                break;
            case 'impact':
                componentDisplay = component.impact_category
                    ? component.impact_category.charAt(0).toUpperCase() + component.impact_category.slice(1)
                    : `(${component.id})`;
                break;
            case 'mutex':
            case 'software':
                componentDisplay = component.name;
                break;
            case 'process':
                componentDisplay = this.getComponentDisplayProcess(component);
                break;
            case 'relationship':
                componentDisplay = this.getComponentDisplayRelationship(component);
                break;
            case 'user-account':
                componentDisplay = this.getComponentDisplayUserAccount(component);
                break;
            case 'windows-registry-key':
                componentDisplay = this.getComponentDisplayWindowsRegistryKey(component);
                break;
            case 'x509-certificate':
                componentDisplay = this.getComponentDisplayX509(component);
                break;
            case 'observed-string':
                componentDisplay = this.getComponentDisplayObservedString(component);
                break;
            default:
                if (this.guidedUI) return component.name ? `${component.name} (${this.getType(component.type)})` : `<NO NAME> (${component.id})`;
                else return component.name ? `${component.name}` : `<NO NAME> (${component.id})`;
        }

        if (this.guidedUI) {
            componentDisplay += ` (${this.getType(component.type)})`;
        }

        return componentDisplay;
    }

    getType(string) {
        if (string == 'ipv4-addr') {
            return 'IPv4 Address';
        } else if (string == 'ipv6-addr') {
            return 'IPv6 Address';
        } else if (string == 'mac-addr') {
            return 'Mac Address';
        } else if (string == 'email-addr') {
            return 'Email Address';
        }
        return string.split('-').reduce((prev: string, next: string) => {
            if (prev) prev += ' ';
            prev += next.charAt(0).toUpperCase() + next.slice(1);

            return prev;
        }, '');
    }

    pascalCase(type: string) {
        const split = type.split('-');
        let str = '';

        split.forEach((s) => {
            if (str) str += ' ';

            str += s.charAt(0).toUpperCase() + s.slice(1);
        });

        return str;
    }

    getTlp(component: any): Array<{ name: string; type: string }> {
        let tlp = [];
        if (component.object_marking_refs) {
            component.object_marking_refs.forEach((objMark) => {
                let markingName: string;

                markingName = TLP_OPTIONS.find((obj) => obj.id === objMark)?.name;
                if (markingName !== undefined) return tlp.push({ name: markingName, type: 'tlpv1' });

                markingName = TLP20_OPTIONS.find((obj) => obj.id === objMark)?.name;
                if (markingName !== undefined) return tlp.push({ name: markingName, type: 'tlpv2' });

                //Check if the acs is stored in localStorage and pull its display name
                const acs_type = localStorage.getItem('acs-type');
                if (!acs_type) markingName = this.stixService.acsMarkings[objMark];
                else {
                    let acs = JSON.parse(acs_type);
                    markingName = acs[objMark] ?? this.stixService.acsMarkings[objMark];
                }
                if (markingName !== undefined) return tlp.push({ name: markingName, type: 'acs' });

                //If marking definition is not an ACS, check if the other has a name
                const marking_defs = localStorage.getItem('objectMarkingRefs');

                if (!marking_defs) markingName = this.stixService.markingDefinition[objMark];
                else {
                    let mDefs = JSON.parse(marking_defs);
                    markingName = mDefs[objMark] ?? this.stixService.markingDefinition[objMark];
                }

                if (markingName !== undefined) return tlp.push({ name: markingName, type: 'acs' });

                return null;
            });
        }
        tlp.sort((a, b) => {
            const order = ['acs', 'tlpv2', 'tlpv1'];
            return order.indexOf(a.type) - order.indexOf(b.type);
        });
        return tlp;
    }

    getTlpStyle(tlp: { name: string; type: string }): string {
        let tlpStyle = '';
        const { name, type } = tlp;

        if (type === 'acs') {
            return 'acs-marking-bundle';
        } else {
            switch (name) {
                case 'TLP:CLEAR': {
                    tlpStyle = 'tlp-clear-bundle';
                    break;
                }
                case 'TLP:GREEN': {
                    tlpStyle = 'tlp-green-bundle';
                    break;
                }
                case 'TLP:AMBER': {
                    tlpStyle = 'tlp-amber-bundle';
                    break;
                }
                case 'TLP:AMBER+STRICT': {
                    tlpStyle = 'tlp-amber-bundle';
                    break;
                }
                case 'TLP:RED': {
                    tlpStyle = 'tlp-red-bundle';
                    break;
                }
                case 'TLP:WHITE': {
                    tlpStyle = 'tlp-white-bundle';
                    break;
                }
            }
        }

        return tlpStyle;
    }

    // The reason for the copy is that if we edit component directly, we edit the bundle because of the linkages going on.
    getJsonDisplayForComponent(component): any {
        let copy = structuredClone(component); // Create a copy for displaying purposes

        if (copy.contents && typeof copy.contents === 'object' && copy.contents.length > 0) {
            let contentsString = '';

            for (let currContent of copy.contents) {
                let newContent = new Content();

                newContent.lang = currContent.lang;
                newContent.fields = currContent.fields;
                newContent.fieldName = currContent.fieldName;

                contentsString += '{' + newContent.toString() + '},';
            }

            contentsString = contentsString.slice(0, -1); // Remove the last comma
            copy.contents = JSON.parse(`[ ${contentsString} ]`);
        }

        return copy;
    }

    isConnectDisabled(bypassStep = false): boolean {
        // Checking TAXII Server Information
        if (this.modalCurrentStep === 2 || bypassStep) {
            // Custom TAXII Server
            // Check for url/username/password
            if (
                (this.taxiiServerType === 'custom' &&
                    this.taxiiServerAuthType !== 'keycloak' &&
                    (!this.taxiiServer.url || !this.taxiiServer.username || !this.taxiiServer.password)) ||
                (this.taxiiServerType === 'custom' && this.taxiiServerAuthType === 'keycloak' && !this.taxiiServer.url)
            ) {
                return true;
            }
        }
        return false;
    }

    isNextDisabledCustomTaxii() {
        if (this.taxiiServerAuthType === 'keycloak' && !this.stixService.taxiiServer.url) {
            console.debug('Custom Keycloak Taxii Server missing URL');
            return true;
        } else if (!this.stixService.taxiiServer.url || !this.stixService.taxiiServer.username || !this.stixService.taxiiServer.password) {
            console.debug('Custom taxii server without url/username/password');
            return true;
        } else if (!this.selectedAPIRoot || !this.selectedCollection) {
            console.debug('API Root or Collection missing');
            return true;
        }

        return false;
    }

    isNextDisabled(): boolean {
        // Checking TAXII Server Information
        if (this.modalCurrentStep === 2) {
            if (this.reportName == '') {
                return true;
            }

            if (this.stixService.taxiiServerType === 'custom') {
                let result = this.isNextDisabledCustomTaxii();
                if (result === true) return true;
            }

            if (
                (this.stixService.taxiiServerType === 'default' || this.taxiiServerType === 'cma') &&
                // Derek - feature branch had (!this.taxiiServer.apiRoot || !this.taxiiServer.collection)) {
                (!this.taxiiServer.apiRoot || !this.selectedCollection)
            ) {
                console.debug('Default taxii server without api root or collection id');
                return true;
            }

            if ((this.taxiiServerType === 'default' || this.taxiiServerType === 'cma') && this.taxiiServer.apiRoot && !this.selectedCollection.id) {
                console.debug('API Root selected but collection not defined');
                return true;
            }
        } else if (this.modalCurrentStep === 0) {
            let result = !this.requiredCheckAll(this.stixService.taxiiServer.required, '');
            return result;
        }
        return false;
    }

    getStixPreview(): Bundle {
        let tempBundle = JSON.parse(JSON.stringify(this.stixService.bundle));
        tempBundle.objects = [...tempBundle.objects, ...this.stixService.customObjects];

        if (this.stixService.taxiiServerType === 'ais') tempBundle.objects.forEach((obj) => delete obj.granular_markings);

        if (this.loadingBundle) {
            let bundleLocation: any[];
            switch (this.loadingModalData.destination) {
                case 'profile':
                    bundleLocation = this.loadingModalData.bundle._source.bundle;
                    break;
                case 'local':
                    bundleLocation = this.loadingModalData.bundle.bundle;
                    break;
            }
            tempBundle = new Bundle(bundleLocation);
        }

        return tempBundle;
    }

    previewObjectsToLoad(): Bundle {
        this.showingVisualizer = false;

        let tempBundle = {
            type: this.bundle.type,
            id: `bundle`,
            objects: [],
        };

        tempBundle.objects = [...this.stixService.objectsToLoad];

        return tempBundle;
    }

    routeToNewTab(route) {
        window.open('/' + route, '_blank');
    }

    retrieveAPIRoot(apiRootURL): string {
        if (apiRootURL.startsWith('https://')) {
            const splitRootURL = apiRootURL.split('/');
            if (apiRootURL.endsWith('/')) {
                return splitRootURL[splitRootURL.length - 2];
            } else {
                return splitRootURL[splitRootURL.length - 1];
            }
        } else if (apiRootURL.startsWith('/')) {
            if (apiRootURL.endsWith('/')) return apiRootURL.substring(1, apiRootURL.length - 1);
            else return apiRootURL.substring(1, apiRootURL.length);
        } else {
            this.apiRootProcessingError = 'Could not retrieve API Root information from the TAXII server.';
            return null;
        }
    }

    getAPIRootInformation(api_root?: string): Observable<unknown> {
        return this.httpClient.get(this.taxiiServerBaseUrl + api_root + '/', { headers: this.httpHeaders });
    }

    onAPIRootChanged(apiRoot: any) {
        this.loadingApiRoots = true;
        this.selectedCollection = '';
        this.collections = [];
        this.taxiiServer.availableCollections = [];
        this.selectedAPIRoot = apiRoot;
        if (this.stixService.taxiiServerType == 'custom') {
            let urlArray = this.stixService.taxiiServer.url.split('/');
            this.taxiiServerBaseUrl = `${urlArray[0]}//${urlArray[2]}/taxii/v2.1-os/`;
        }
        this.getCollectionsIds();
    }

    onCollectionChanged(collection) {
        this.selectedCollection = collection;
        this.taxiiServer.collection = collection;
    }

    private getCollectionsIds(root = undefined) {
        let rootIndex;

        if (this.selectedAPIRoot == null) {
            console.info('No API Root Selected');
            return null;
        }

        if (typeof this.selectedAPIRoot == 'string') {
            rootIndex = this.stixService.apiRoots2.findIndex((r) => r['apiPath'] === this.selectedAPIRoot);
        } else if (this.selectedAPIRoot['api-root']) {
            rootIndex = this.stixService.apiRoots2.findIndex((r) => r['apiPath'] === this.selectedAPIRoot['api-root']);
        } else {
            rootIndex = this.stixService.apiRoots2.findIndex((r) => r['apiPath'] === this.selectedAPIRoot['apiPath']);
        }

        if (rootIndex > -1) {
            if (this.taxiiServerType == 'ais2') {
                this.collections = [].concat(this.AIS_COLLECTIONS[0]['collections']);
            } else {
                this.collections = this.stixService.apiRoots2[rootIndex]['collections'];
            }
            this.collections = this.collections.filter((c) => c.can_write);
            this.loadingApiRoots = false;
        }

        this.taxiiServer.availableCollections = this.collections;

        if (this.taxiiServer.availableCollections.length === 1) {
            this.taxiiServer.collection = this.taxiiServer.availableCollections[0];
        } else {
            this.taxiiServer.collection = null;
        }
    }

    requiredCheckAll(required, when): boolean {
        if (when === 'init') {
            this.required = [];
        }

        for (let field of required) {
            let result = this.requiredCheck(field);

            if (result === false) {
                if (when === 'init') {
                    this.required.push({ label: field, showInPopup: true });
                } else {
                    return false;
                }
            }
        }

        if (when === 'init' && this.required.length !== 0) {
            return false;
        }
        return true;
    }

    requiredCheck(field): boolean {
        if (field === 'ACS Markings') {
            for (let object of this.bundle.objects) {
                if (object.type === 'marking-definition' && object.extensions)
                    if (object.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']) return true;
            }

            return false;
        }

        return true;
    }

    getDocNamePublishModal(report) {
        if (report) {
            let evidence = localStorage.getItem('evidence');

            if (evidence) return report.name.replaceAll(' ', '_') + '_' + localStorage.getItem('evidence');

            return report.name.replaceAll(' ', '_');
        }

        return '';
    }

    async openPublishModal(modal) {
        try {
            await this.envService.checkAuth('/bundle');
            await this.stixService.getAPIRoots();

            let passesRequiredCheck = this.stixService.taxiiServer.required.length === 0;
            if (!passesRequiredCheck) {
                passesRequiredCheck = this.requiredCheckAll(this.stixService.taxiiServer.required, 'init');
                if (!passesRequiredCheck) {
                    this.modalCurrentStep = 0;
                }
            }

            this.stixService.reportName = localStorage.getItem('report-name') ? localStorage.getItem('report-name') : '';
            //Update later to work with multiple reports/no report present
            if (!this.stixService.reportName) {
                let report = this.stixService.bundle.objects.find((elem) => elem.type === 'report');
                let docName = this.getDocNamePublishModal(report);
                this.stixService.reportName = docName;
            }

            localStorage.setItem('report-name', this.stixService.reportName);

            this.prevShowingVisualizer = this.showingVisualizer;
            this.showingVisualizer = false;

            this.loadingPublishModal = false;
            this.modalService
                .open(modal, { ariaLabelledBy: 'publish-modal-title', size: 'xl', windowClass: 'publish-modal', centered: true })
                .result.finally(() => {
                    // Reset Values
                    this.modalCurrentStep = 2;
                    this.modalStepCount = 3;
                    this.taxiiServer = {
                        url: this.stixService.taxiiServer.url,
                        username: this.stixService.taxiiServer.username,
                        password: this.stixService.taxiiServer.password,
                        certificate: null,
                        apiRoot: '',
                        childRoot: '',
                        availableCollections: [],
                        collection: null,
                    };
                    this.isPublishing = false;
                    this.publishA1 = false;
                    this.taxiiServerType = 'default';
                    this.showingVisualizer = this.prevShowingVisualizer;
                    this.selectedAPIRoot = null;
                    this.selectedCollection = null;

                    //MISP
                    this.publishMisp = false;
                    this.mispJson = 'Fill in Report Title and Producer, then click "Convert" to convert STIX Bundle to MISP JSON';
                    this.mispObj = null;
                    this.loadingMisp = false;
                    this.expandMisp = false;
                    this.mispTitle = this.reportName;
                    this.mispProducer = 'imx';
                    this.mispApi = '';
                    this.mispUrl = '';
                    this.saveMisp = false;
                });
        } catch (e) {
            console.error(e);
            this.loadingPublishModal = false;
        }
    }

    openModal(modal) {
        this.deletedCISAIdentity = false;
        this.modalService.open(modal, { size: 'xl' });
    }

    updatedIDModal(modal) {
        this.origID = this.stixService.origID;
        this.stixService.origID = '';
        this.modalService.open(modal, { size: 'xl' });
    }

    refreshApiRootsCollections() {
        this.stixService
            .refreshTaxiiUrls()
            .then((_) => {
                console.debug('API Roots loaded successfully!');
            })
            .catch((err) => {
                console.error(err);
            });
    }

    getLogApiRoot(a1) {
        if ((a1 && a1 == 'a1') || this.publishA1) {
            return this.envService.env.taxiiServer.a1ApiRoot;
        } else if (a1 && a1 == 'raw') {
            return this.envService.env.taxiiServer.a1ApiRoot;
        } else {
            return this.selectedAPIRoot ? this.selectedAPIRoot['api-root'] : this.taxiiServer.apiRoot;
        }
    }

    getLogCollection(a1) {
        if ((a1 && a1 == 'a1') || this.publishA1) {
            return this.envService.env.taxiiServer.a1CollectionId;
        } else if (a1 && a1 == 'raw') {
            return this.envService.env.taxiiServer.a1RawCollectionId;
        } else {
            return this.selectedCollection ? this.selectedCollection.id : this.taxiiServer.collection.id;
        }
    }

    getApiRootString() {
        if (typeof this.selectedAPIRoot == 'string') {
            return this.selectedAPIRoot;
        } else if (this.selectedAPIRoot.apiPath) {
            return this.selectedAPIRoot.apiPath;
        } else {
            return this.selectedAPIRoot['api-root'];
        }
    }

    getTaxiiServerUrlPublishBundle(a1, result) {
        if (a1 || this.publishA1) {
            return `${this.envService.env.taxiiServer.a1ChildRoot}status/` + result['id'] + '/';
        } else if ((this.taxiiServerType === 'default' || this.taxiiServerType === 'cma') && this.taxiiServer.url && this.taxiiServer.childRoot) {
            return `${this.taxiiServer.childRoot}status/` + result['id'] + '/';
        } else if (this.taxiiServerType === 'sandbox') {
            return (
                `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/${this.envService.env.customConfiguration.sandbox.apiRoot}/status/` +
                result['id'] +
                '/'
            );
        } else if (this.taxiiServerType === 'cisa') {
            return (
                `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/${this.envService.env.customConfiguration.cisa.apiRoot}/status/` +
                result['id'] +
                '/'
            );
        } else if (this.taxiiServerType === 'custom' && this.taxiiServer.url && this.taxiiServer.username && this.taxiiServer.password) {
            let apiRoot = this.getApiRootString();

            if (this.taxiiServerBaseUrl.includes('/taxii/v2.1-os')) {
                return `${this.taxiiServerBaseUrl}${apiRoot}/status/` + result['id'] + '/';
            } else {
                return `${this.taxiiServerBaseUrl}taxii/v2.1-os/${apiRoot}/status/` + result['id'] + '/';
            }
        } else if (this.taxiiServerType === 'ais' && this.taxiiServer.url && this.taxiiServer.username && this.taxiiServer.password) {
            return `${this.taxiiServer.childRoot}status/` + result['id'] + '/';
        } else if (this.taxiiServerType === 'cisaAis' && this.taxiiServer.url && this.taxiiServer.username && this.taxiiServer.password) {
            return `${this.taxiiServer.childRoot}status/` + result['id'] + '/';
        }

        return '';
    }

    publishBundle(showAnnouncement: boolean = true, a1?: string): void {
        this.stixService.reportName = this.reportName;
        localStorage.setItem('report-name', this.stixService.reportName);

        if (this.stixService.taxiiServerType === 'custom') {
            this.taxiiServer.username = this.stixService.taxiiServer.username;
        }

        let logApiRoot = this.getLogApiRoot(a1);
        let logCollection = this.getLogCollection(a1);

        this.isPublishing = true;

        let ids = JSON.parse(JSON.stringify({ arr: [] }));
        if (localStorage.getItem('identities')) {
            try {
                ids = JSON.parse(localStorage.getItem('identities')) ?? JSON.parse(JSON.stringify({ arr: [] }));
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
                localStorage.removeItem('identities');
            }
        }

        const bundleObjs = this.stixService.bundle.objects;
        for (let obj of bundleObjs) {
            if (obj.type === 'identity') {
                const idStorageIndex = ids.arr.findIndex((idStorage) => idStorage.id === obj.id);
                if (idStorageIndex !== -1) {
                    ids.arr.splice(idStorageIndex, 1, obj);
                } else {
                    ids.arr.push(obj);
                }
            }
        }

        localStorage.setItem('identities', JSON.stringify(ids));
        this.stixService
            .publishBundle(
                this.constructTaxiiServerURL(a1),
                this.taxiiServer.username,
                this.taxiiServer.password,
                this.taxiiServerAuthType,
                this.selectedCollection
            )
            .then((result) => {
                console.debug('Successful return from STIX service for publication');
                console.debug(result);

                this.isResetNeeded = true;
                this.taxiiServerUrl = '';
                if (result['id']) {
                    this.taxiiServerUrl = this.getTaxiiServerUrlPublishBundle(a1, result);
                    this.announcementService.getStatus(this.taxiiServerUrl, this.taxiiServer.collection, showAnnouncement);
                }

                this.modalCurrentStep = 4;
                this.stixService.sendData({ type: 'publish-success' });

                try {
                    this.getBundleManifest().subscribe(async (resp: any) => {
                        if (resp?.body?.objects) {
                            let manifestObjs = resp.body.objects;

                            for (const mo of manifestObjs) {
                                await db.savePublishedObject(mo);
                            }
                        }

                        setTimeout(() => {
                            this.checkDupesAndRefs();
                        }, 500);
                    });
                } catch (e) {
                    console.error(e);
                    console.error('Error in getting bundle manifests');
                }
            })
            .catch((err) => {
                // Send to Announcement Service
                console.error('Error received from STIX Service Publish Bundle');
                console.error(err);

                if (err?.error?.title) {
                    this.announcementService.show(
                        'Publication Unsuccessful',
                        `There was an error publishing your STIX document. Error: ${err.error.title}`,
                        'error',
                        false
                    );
                } else if (JSON.stringify(err).length > 2) {
                    this.announcementService.show('Publication Unsuccessful', `${JSON.stringify(err)}`, 'error', true);
                }
                this.modalService.dismissAll();

                this.stixService.sendData({ type: 'publish-error', err });
            })
            .finally(() => {
                this.isPublishing = false;
                this.publishA1 = false;
            });
    }

    getBundleManifest() {
        let collectionId = this.selectedCollection?.id || this.taxiiServer.collection?.id;
        let url = `${this.taxiiServer.childRoot}collections/${collectionId}/manifest/?match[id]=`;
        let ids = this.stixService.bundle.objects.map((o) => o.id).join(',');
        url += ids;
        return this.stixService.taxiiHttpReq('get', url, { headers: this.httpHeaders, observe: 'response' });
    }

    // Allows for Guided UI to close most recent announcement
    removeAnnouncement() {
        this.announcementService.remove();
    }

    openRemoveMultiObjects() {
        if (this.selectedObjects.length < 1) return;

        let modalRef = this.modalService.open(RemoveObjectComponent, { size: 'xl' });
        modalRef.componentInstance.removingObjects = this.selectedObjects;

        modalRef.result.then((data) => {
            if (data == 'confirm') {
                this.removeObjects();
            }
        });
    }

    async removeObjects() {
        if (this.selectedObjects.length < 1) return;

        console.info(this.selectedObjects);
        for (const selectedObj of this.selectedObjects) {
            console.info(selectedObj);
            await this.removeObject(selectedObj);
        }

        this.selectedObjects = [];
    }

    removeObject(id: string) {
        if (id == this.envService.env.defaultIdentity.id) {
            this.deletedCISAIdentity = true;
        }

        this.stixService.removedCustomObj = [];
        this.opened = false;

        return new Promise(async (resolve, reject) => {
            try {
                await this.stixService.removeComponent(id);

                // Updates BundleComponent for children Custom Objects that were removed
                for (let customObj of this.stixService.removedCustomObj) {
                    this.stixService.removeComponent(customObj['id']);
                }
                this.stixService.removedCustomObj = [];
                this.rownumber = -1;
                this.objnumber = -1;

                this.updateGroupByTLP();

                if (this.guidedUI) {
                    for (let workflow of this.guidedService.cachedCart) {
                        for (let page in workflow) {
                            for (let type in workflow[page]) {
                                const typeInCachedCart = workflow[page][type];
                                workflow[page][type] = typeInCachedCart.filter((obj) => obj.id !== id);
                            }
                        }
                    }

                    localStorage.setItem('cached-cart', JSON.stringify(this.guidedService.cachedCart));

                    for (const type in this.guidedService.simplifiedCart) {
                        this.guidedService.simplifiedCart[type] = this.guidedService.simplifiedCart[type].filter((obj) => obj.id !== id);
                    }
                    this.guidedService.organizeCategories();
                }

                this.clearSearchResults();

                const new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));
                if (!new_version_objects) return resolve(true);
                if (!new_version_objects.includes(id)) return resolve(true);
                localStorage.setItem('new_version_objects', JSON.stringify(new_version_objects.filter((elem) => elem !== id)));
                return resolve(true);
            } catch (e) {
                console.error(e);
                return resolve(true);
            }
        });
    }

    async downloadBundle(guided = false) {
        await this.envService.checkAuth('/bundle');
        if (this.bundle.type === undefined || this.bundle.id === '' || this.bundle.id === undefined) {
            this.bundle = this.stixService.refreshBundle();
        }

        if (guided) {
            this.bundle = this.stixService.refreshBundle(false, this.bundle.id);
        }
        let tempBundle = {
            type: this.bundle.type,
            id: this.bundle.id,
            objects: [],
        };

        for (let object of this.bundle.objects) {
            tempBundle.objects.push(object);
        }

        for (let object of this.stixService.customObjects) {
            tempBundle.objects.push(object);
        }

        const a = document.createElement('a');
        const file = new Blob([JSON.stringify(tempBundle, null, 2)], { type: 'application/taxii+json;version=2.1' });
        a.href = URL.createObjectURL(file);

        if (this.reportName) {
            if (this.reportName.endsWith('.json')) a.download = this.reportName;
            else a.download = `${this.reportName}.json`;
        } else a.download = `bundle_name.json`;
        setTimeout(() => {
            a.click();
        }, 400);
    }

    setStringOnFileChanged(cleanString) {
        let string = '{"objects":[';

        let arr = cleanString.split('}');

        for (let i = 0; i < arr.length; i++) {
            let comma = false; // could definitely be cleaner but this is simpler
            let temp = arr[i] + '}';
            //temp = temp.replace(/.,./g, "}");
            if (temp.startsWith(',')) {
                comma = true;
                temp = temp.substring(1, arr[i].length) + '}';
            }

            while ((temp.match(/{/g) || []).length > (temp.match(/}/g) || []).length) {
                if (arr[i + 1]) {
                    temp += arr[i + 1];
                }
                temp += '}';
                i++;
            }
            try {
                JSON.parse(temp);
                if (comma) {
                    string = string + ',';
                }
                string = string + temp;
            } catch (e) {
                console.error(e);
            }
        }

        string = string + ']}';

        try {
            let result = {
                string: string,
                objects: JSON.parse(string).objects,
                bad: false,
            };

            return result;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    setObjectOnFileChanged(string, cleanString) {
        let objects;
        let bad = false;

        try {
            objects = JSON.parse(string);
        } catch (error2) {
            console.error(error2);
            try {
                string = '{"objects":[' + string + ']}';
                objects = JSON.parse(string);
            } catch (error3) {
                bad = true;
                console.error(error3);
            }
        }

        if (!bad) {
            if (objects.objects) {
                objects = objects.objects;
            }
            if (objects['type'] && objects['id'] && objects['spec_version']) {
                objects = [objects];
            }
            if (!objects.length) {
                bad = true;
            }
        } else if ((cleanString.match(/{/g) ?? []).length == (cleanString.match(/}/g) ?? []).length) {
            if (cleanString.indexOf('"objects":[')) {
                cleanString = cleanString.substring(cleanString.indexOf('"objects":[') + 11, cleanString.length - 1);
            }

            let result = this.setStringOnFileChanged(cleanString);
            string = result.string ?? string;
            bad = result.bad ?? bad;
            objects = result.objects ?? objects;
        }

        return { bad: bad, objects: objects, string: string };
    }

    onFileChanged(event) {
        this.upload = [];
        this.bad_uploads = [];
        const promises = [];
        const fileNames = [];

        this.openLoading();

        for (let file of event.target.files) {
            promises.push(
                new Promise((res, rej) => {
                    fileNames.push(file.name);
                    const fileReader = new FileReader();

                    fileReader.readAsText(file, 'UTF-8');
                    fileReader.onload = () => {
                        let string = <string>fileReader.result;

                        string = Minify(string).replace(/\n/g, '').replace(/}/g, '},').replace(/,,/g, ',').replace(/,}/g, '}').replace(/,]/g, ']');
                        while (string.endsWith(',')) string = string.substring(0, string.length - 1);

                        let cleanString = string;

                        try {
                            let result = this.setObjectOnFileChanged(string, cleanString);
                            let bad = result.bad;
                            let objects = result.objects ?? undefined;

                            if (!bad) {
                                for (let obj of objects) {
                                    // Removes empty fields
                                    let cleanObj = Object.fromEntries(
                                        Object.entries(obj).filter(
                                            ([key, value]) => value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)
                                        )
                                    );
                                    this.upload = this.upload.concat(cleanObj);
                                }

                                res(true);
                            } else {
                                //See if file is MISP
                                let misp;

                                if (objects.response) misp = objects.response[0];
                                else if (objects['Event']) misp = objects;

                                console.info('MISP', misp);

                                if (misp) {
                                    this.mispStix.mispToStix(JSON.stringify(misp)).then((response: any) => {
                                        console.info(response);
                                        if (response?.type === 'bundle' && response.id.startsWith('bundle--') && response.objects?.length > 0) {
                                            this.upload = this.upload.concat(response.objects);
                                            res(true);
                                        } else {
                                            this.bad_uploads = this.bad_uploads.concat(file.name);
                                            rej(new Error('Response data type is not bundle'));
                                        }
                                    });
                                } else {
                                    this.bad_uploads = this.bad_uploads.concat(file.name);
                                    rej(new Error('Error with MISP'));
                                }
                            }
                        } catch (error) {
                            this.bad_uploads = this.bad_uploads.concat(file.name);
                            console.error(error);
                            rej(new Error(error));
                        }
                    };
                    fileReader.onerror = (error) => {
                        console.error(error);
                        this.announcementService.show(
                            'Upload Unsuccessful',
                            `There was an error publishing your STIX document. Error: ${JSON.stringify(error)}`,
                            'error',
                            false
                        );
                        rej(new Error(JSON.stringify(error)));
                    };
                })
            );
        }

        Promise.all(promises).then(() => {
            if (this.upload.length > 0) {
                if (fileNames.length > 0) {
                    this.stixService.importReportName = fileNames[0];
                }

                this.uploadBundle();
            } else {
                this.closeLoading();
            }
        });
    }

    openLoading() {
        this.addingStixToBundle = true;
        this.isUploading = true;
    }

    closeLoading() {
        this.addingStixToBundle = false;
        this.isUploading = true;
    }

    cleanEmptyArraysInObj(obj) {
        for (let prop in obj) {
            if (Array.isArray(obj[prop]) && obj[prop].length === 0) {
                delete obj[prop];
            }
        }

        return obj;
    }

    getPublishedObjects(report, ids, obj, published_objects, previous_published_objects, errors) {
        if (report.errors.length == 0) {
            ids.push(obj['id']);
            this.stixService.objectsToLoad.push(obj);

            if (!published_objects.includes(obj.id)) {
                published_objects.push(obj.id);
            } else {
                previous_published_objects = previous_published_objects.filter((element) => element !== obj.id);
            }
        } else {
            let path: any = report.errors[0]['path'];
            if (path.length == 0) {
                path = report.errors[0]['instance']['type'];
            }
            let message: string = report.errors[0]['message'];
            let err = `${obj.id}: ${path} ${message}\n`;

            for (let i = 1; i < report.errors.length; i++) {
                path = report.errors[i]['path'];
                if (path.length == 0) {
                    path = report.errors[i]['instance']['type'];
                }
                message = report.errors[i]['message'];

                err = `${err}${path} ${message}\n`;
            }
            err = err + '~~~~~\n\n';

            errors.push(err);
            console.error('validation failed');

            this.stixService.objectsToLoad.push(obj);

            if (!published_objects.includes(obj.id)) {
                published_objects.push(obj.id);
            } else {
                previous_published_objects = previous_published_objects.filter((element) => element !== obj.id);
            }
        }

        return {
            published_objects: published_objects,
            previous_published_objects: previous_published_objects,
        };
    }

    async uploadBundle() {
        await this.envService.checkAuth('/bundle');

        this.savingBundle = false;
        this.isUploading = true;
        this.stixService.uploadErrors = '';
        let published_objects = JSON.parse(localStorage.getItem('new_version_objects')) ?? [];
        let previous_published_objects = [...published_objects];

        setTimeout(() => {
            if (this.upload.length < 1) {
                let title = 'Upload Unsuccessful';
                let error = `The following file(s) are of an incorrect format.\nError: ${this.bad_uploads.toString()}`;
                this.isUploading = false;
                this.announcementService.show(title, error, 'error', false);
                this.closeLoading();
                return;
            }

            let errors: string[] = [];
            let error = '';
            if (this.bad_uploads.length > 0) {
                error = `The following file(s) are of an incorrect format or contain an unrecognized object.\nError: ${this.bad_uploads.toString()}~~~~~\n\n`;
            }

            let v = new Validator();

            let ids: string[] = [];
            for (let obj of this.upload) {
                let report = { errors: [] };

                obj = this.cleanEmptyArraysInObj(obj);
                report = validateStix(obj);

                if (!(obj.id == 'identity--b1160532-b8f3-4cfa-9b7d-423e253fbc59' && ids.includes(obj.id))) {
                    let result = this.getPublishedObjects(report, ids, obj, published_objects, previous_published_objects, errors);

                    published_objects = result.published_objects;
                    previous_published_objects = result.previous_published_objects;
                }
            }

            if (error.length > 0 || errors.length > 0) {
                for (let err of errors) {
                    error = error + err;
                }
                console.error(error);
                this.stixService.uploadErrors = error;
            }

            this.selectedFile = undefined;
            this.closeLoading();
            this.stixService.hasObjectsToLoad = true;
            localStorage.setItem('new_version_objects', JSON.stringify(published_objects));
            localStorage.setItem('previous_new_version_objects', JSON.stringify(previous_published_objects));
        });
    }

    getA1OrRawCollectionId(type) {
        if (type === 'a1') return this.envService.env.taxiiServer.a1CollectionId;
        else if (type === 'raw') return this.envService.env.taxiiServer.a1RawCollectionId;

        return null;
    }

    serverSettingsChangedIsA1OrRaw(type) {
        let collection = null;
        let res = this.stixService.apiRoots.find((r) => {
            collection = r.collections.find((c) => c.id === this.getA1OrRawCollectionId(type));
            return !!collection;
        });

        console.debug(res);

        this.taxiiServer.url = this.envService.env.taxiiServer.url;
        this.taxiiServer.username = this.envService.env.taxiiServer.username;
        this.taxiiServer.password = this.envService.env.taxiiServer.password;
        this.taxiiServer.apiRoot = this.envService.env.taxiiServer.a1ApiRoot;
        this.taxiiServer.childRoot = this.envService.env.taxiiServer.a1ChildRoot;
        this.taxiiServer.collection = {
            id: this.envService.env.taxiiServer.a1CollectionId,
            title: collection ? collection.title : '',
        };

        switch (type) {
            case 'a1':
                this.taxiiServer.collection.title = 'Vetted';
                break;
            case 'raw':
                this.taxiiServer.collection.title = 'Raw';
        }
    }

    serverSettingsChagedSandbox() {
        this.taxiiServer.url = this.envService.env.taxiiServer.url;
        this.taxiiServer.username = this.envService.env.taxiiServer.username;
        this.taxiiServer.password = this.envService.env.taxiiServer.password;
        this.taxiiServer.apiRoot = this.envService.env.customConfiguration.sandbox.apiRoot;
        this.taxiiServer.childRoot =
            this.envService.env.taxiiServer.url +
            'taxii/' +
            this.envService.env.taxiiServer.apiVersion +
            '/' +
            this.envService.env.customConfiguration.sandbox.apiRoot +
            '/';

        let sandboxCollection = null;
        let res = this.stixService.apiRoots2.find((r) => {
            const collection = r.collections.find((c) => c.id === this.envService.env.customConfiguration.sandbox.collectionId);

            if (collection) {
                sandboxCollection = collection;
                return true;
            }
            return false;
        });
        console.debug(res);

        this.taxiiServer.collection = {
            id: this.envService.env.customConfiguration.sandbox.collectionId,
            title: sandboxCollection ? sandboxCollection.title : this.envService.env.customConfiguration.sandbox.collectionId,
        };
    }

    serverSettingsChangedCisa() {
        this.taxiiServer.url = this.envService.env.taxiiServer.url;
        this.taxiiServer.username = this.envService.env.taxiiServer.username;
        this.taxiiServer.password = this.envService.env.taxiiServer.password;
        this.taxiiServer.apiRoot = this.envService.env.customConfiguration.cisa.apiRoot;
        this.taxiiServer.childRoot =
            this.envService.env.taxiiServer.url +
            'taxii/' +
            this.envService.env.taxiiServer.apiVersion +
            '/' +
            this.envService.env.customConfiguration.cisa.apiRoot +
            '/';

        let cisaCollection = null;
        let res = this.stixService.apiRoots2.find((r) => {
            const collection = r.collections.find((c) => c.id === this.envService.env.customConfiguration.cisa.collectionId);

            if (collection) {
                cisaCollection = collection;
                return true;
            }
            return false;
        });
        console.debug(res);

        this.taxiiServer.collection = {
            id: this.envService.env.customConfiguration.cisa.collectionId,
            title: cisaCollection ? cisaCollection.title : this.envService.env.customConfiguration.cisa.collectionId,
        };
    }

    serverSettingsChangedCisaAis() {
        this.taxiiServer.url = this.envService.env.aisTaxiiProxy.url;
        this.taxiiServer.username = this.envService.env.aisTaxiiProxy.username;
        this.taxiiServer.password = this.envService.env.aisTaxiiProxy.password;
        this.taxiiServer.apiRoot = this.envService.env.customConfiguration.cisaAis.apiRoot;
        this.taxiiServer.childRoot = this.envService.env.aisTaxiiProxy.url + this.envService.env.customConfiguration.cisaAis.apiRoot + '/';

        let aisCollection = null;
        let res = this.stixService.apiRoots2.find((r) => {
            const collection = r.collections.find((c) => c.id === this.envService.env.customConfiguration.cisaAis.collectionId);

            if (collection) {
                aisCollection = collection;
                return true;
            }
            return false;
        });
        console.debug(res);

        this.taxiiServer.collection = {
            id: this.envService.env.customConfiguration.cisaAis.collectionId,
            title: aisCollection ? aisCollection.title : this.envService.env.customConfiguration.cisaAis.collectionId,
        };
    }

    serverSettingsChanged(type: string): void {
        this.taxiiServerType = type;

        switch (type) {
            case 'default':
                this.taxiiServer.url = this.envService.env.taxiiServer.url;
                this.taxiiServer.username = this.envService.env.taxiiServer.username;
                this.taxiiServer.password = this.envService.env.taxiiServer.password;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            case 'a1':
            case 'raw':
                this.serverSettingsChangedIsA1OrRaw(type);
                break;
            case 'custom':
            case 'ais':
                this.taxiiServer.url = this.stixService.taxiiServer.url;
                this.taxiiServer.username = this.stixService.taxiiServer.username;
                this.taxiiServer.password = this.stixService.taxiiServer.password;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
                break;
            case 'sandbox':
                this.serverSettingsChagedSandbox();
                break;
            case 'cisa':
                this.serverSettingsChangedCisa();
                break;
            case 'cisaAis':
                this.serverSettingsChangedCisaAis();
                break;
            default:
                this.APIRoots = [];
                this.selectedAPIRoot = null;
                this.apiRoots = [];
                this.selectedCollection = null;
                this.taxiiServer.apiRoot = null;
                this.taxiiServer.childRoot = null;
                this.taxiiServer.collection = null;
        }
    }

    showBundle(): void {
        this.showingBundle = !this.showingBundle;
    }

    showVisualizer(): void {
        this.showingVisualizer = !this.showingVisualizer;
    }

    updateSelectedObjects(id: string) {
        let len = this.selectedObjects.length; // Starting length
        this.selectedObjects = this.selectedObjects.filter((x) => x !== id);

        if (len === this.selectedObjects.length)
            // If the object was not found (already checked)
            this.selectedObjects.push(id);
    }

    editObjectIfMarkingDef(obj) {
        // Navigate to page and pre-fill input fields
        if (obj.type === 'marking-definition' && obj?.extensions?.['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']) {
            const userAcs = localStorage.getItem('user-acs');
            if (userAcs) {
                const acsConfig = JSON.parse(userAcs);

                if (acsConfig.id === obj.id) this.acsConfiguration = acsConfig;
                else this.acsConfiguration = null;
            } else {
                this.acsConfiguration = null;
            }

            if (this.acsConfiguration) {
                this.openStixConfig();
                return true;
            }
        }

        return false;
    }

    editObjectNotGuidedUI(custom, obj, isNewVersion) {
        if (!this.stixService.guidedUI) {
            if (!custom) {
                if (['event', 'impact', 'task'].includes(obj.type)) {
                    this.stixService.currentType = obj.type;
                    this.router.navigate(['/incident-obj']);
                } else if (['malware-behavior', 'malware-method', 'malware-objective'].includes(obj.type)) {
                    this.stixService.currentType = obj.type;
                    this.router.navigate(['/malware-obj']);
                } else {
                    isNewVersion
                        ? this.router.navigate(['/add-component/' + obj.type], { queryParams: { new_version: true, fromBundle: true } })
                        : this.router.navigate(['/add-component/' + obj.type]);
                }
            } else {
                this.stixService.customObjInfo = { new: false };
                this.router.navigate(['/custom-object']);
            }
        }
    }

    cartObjectPageIsIncident(cartObjData) {
        this.guidedService.cart = this.guidedService.cachedCart[cartObjData.cartIndex];
        localStorage.setItem('guided-cart', JSON.stringify(this.guidedService.cart));
        localStorage.setItem('edit-cart', JSON.stringify(this.guidedService.editCart));

        this.guidedService.currentCartIndex = cartObjData.cartIndex;
        localStorage.setItem('cart-index', this.guidedService.currentCartIndex.toString());

        this.guidedService.editCartObject = cartObjData.guidedObject;
        this.guidedService.editCartObject.component = 'how-event-detection';

        this.guidedService.cartLengths['total'] = 0;

        for (let page in this.guidedService.cart) {
            if (page === 'relationships') continue;

            let count = 0;
            for (let type in this.guidedService.cart[page]) {
                count += this.guidedService.cart[page][type].length;
            }
            this.guidedService.cartLengths[page] = count;
            this.guidedService.cartLengths['total'] += this.guidedService.cartLengths[page];
        }
        if (this.guidedService.cart['Incident']) {
            this.guidedService.cartLengths['how-event-detection']++;
        }

        return 'how-event-detection';
    }

    cartObjectPageNotIncident(cartObjData) {
        if (cartObjData.page === 'relationships') {
            const cartIndex: any = cartObjData.guidedObject;
            const relationshipObj = this.guidedService.cachedCart[cartObjData.cartIndex]?.relationships?.relationships[Number(cartIndex.index)];
            if (relationshipObj) {
                const sourceObj = relationshipObj.target_ref.startsWith('attack-pattern--')
                    ? this.stixService.bundle.objects.find((obj) => obj.id === relationshipObj.target_ref)
                    : this.stixService.bundle.objects.find((obj) => obj.id === relationshipObj.source_ref);
                cartObjData = this.findObjInCart(sourceObj);
            }
        }

        this.guidedService.cart = this.guidedService.cachedCart[cartObjData.cartIndex];
        localStorage.setItem('guided-cart', JSON.stringify(this.guidedService.cart));
        localStorage.setItem('edit-cart', JSON.stringify(this.guidedService.editCart));
        this.guidedService.currentCartIndex = cartObjData.cartIndex;
        localStorage.setItem('cart-index', this.guidedService.currentCartIndex.toString());

        this.guidedService.editCartObject = cartObjData.guidedObject;
        this.guidedService.editCartObject.component = cartObjData.page;
        this.guidedService.cartLengths['total'] = 0;

        for (let page in this.guidedService.cart) {
            if (page === 'relationships') continue;

            let count = 0;
            for (let type in this.guidedService.cart[page]) {
                count += this.guidedService.cart[page][type].length;
            }
            this.guidedService.cartLengths[page] = count;
            this.guidedService.cartLengths['total'] += this.guidedService.cartLengths[page];
        }
        if (this.guidedService.cart['Incident']) {
            this.guidedService.cartLengths['how-event-detection']++;
        }

        return cartObjData.page;
    }

    editObjectIsGuidedUI(obj, custom, isNewVersion) {
        if (this.stixService.guidedUI) {
            const stixObj = this.stixObjects.find((so) => {
                return so.objects.find((o) => o.type === obj.type);
            });

            let menuSelection = 'additional-info-1';

            let cartObjData = this.findObjInCart(obj);

            if (cartObjData.found === true) {
                if (cartObjData.page === 'Incident') {
                    menuSelection = this.cartObjectPageIsIncident(cartObjData);
                } else {
                    menuSelection = this.cartObjectPageNotIncident(cartObjData);
                }
            }

            let data: any = {
                type: !custom || this.guidedService.currentCartIndex !== null ? 'edit-object' : 'edit-custom-object',
                value: obj,
                stixObj: stixObj,
                queryParams: isNewVersion ? { new_version: true, fromBundle: true } : undefined,
                menuSelection: menuSelection,
            };

            this.stixService.sendData(data);
        }
    }

    async editObject(obj: any, custom: boolean): Promise<void> {
        if (this.editObjectIfMarkingDef(obj)) return;

        if (obj.type === 'language-content') this.stixService.convertLanguageContentsToArray(obj);
        const new_version_objects = JSON.parse(localStorage.getItem('new_version_objects'));
        const isNewVersion = new_version_objects ? new_version_objects.includes(obj.id) : false;

        if (isNewVersion) {
            obj = JSON.parse(JSON.stringify(obj));
            if (obj.modified) {
                obj.modified = new Date().toISOString();
            }
        }

        await db.saveItemBeingEdited(obj);

        if (!obj.spec_version) {
            localStorage.setItem('missing-attributes', 'spec_version');
        } else {
            localStorage.setItem('missing-attributes', '');
        }

        this.editObjectNotGuidedUI(custom, obj, isNewVersion);
        this.editObjectIsGuidedUI(obj, custom, isNewVersion);
    }

    setGuidedServiceEditCartTypeOnTargetPage(page, typeOnTargetPage, item) {
        if (!this.guidedService.editCart[page]) {
            this.guidedService.editCart[page] = {};
            this.guidedService.editCart[page][typeOnTargetPage] = [item];
        } else if (this.guidedService.editCart[page][typeOnTargetPage]) {
            this.guidedService.editCart[page][typeOnTargetPage].push(item);
        } else {
            this.guidedService.editCart[page][typeOnTargetPage] = [item];
        }
    }

    setGuidedServiceEditCartRelationships(cartIndex, item) {
        for (let relationship of this.guidedService.cachedCart[cartIndex]['relationship']['relationship']) {
            if (relationship.source_ref === item.id) {
                let found = false;

                for (let relInEditCart of this.guidedService.editCart['relationship']['relationship']) {
                    if (relInEditCart.id === relationship.id) {
                        found = true;
                        break;
                    }
                }

                if (found === false) {
                    this.guidedService.editCart['relationship']['relationship'].push(relationship);
                }
            }
        }
    }

    setGuidedServiceEditCartForFindObj(page, cartIndex) {
        for (let typeOnTargetPage in this.guidedService.cachedCart[cartIndex][page]) {
            for (let item of this.guidedService.cachedCart[cartIndex][page][typeOnTargetPage]) {
                this.setGuidedServiceEditCartTypeOnTargetPage(page, typeOnTargetPage, item);

                if (!this.guidedService.cachedCart[cartIndex]['relationship']) continue;

                this.setGuidedServiceEditCartRelationships(cartIndex, item);
            }
        }
    }

    ifFindObjInCartIdsMatch(result, page, type, i, cartIndex) {
        result.found = true;
        result.guidedObject = {
            component: page === 'Incident' ? 'how-event-detection' : page,
            key: type,
            index: i,
            specialFlag: page === 'Incident',
        };
        result.cartIndex = cartIndex;
        result.page = page;

        if (page === 'Incident') {
            let eventPage = 'how-event-detection';
            let eventType = 'Event';

            if (this.guidedService.cachedCart[cartIndex][eventPage] && this.guidedService.cachedCart[cartIndex][eventPage][eventType].length !== 0) {
                this.guidedService.editCart[eventPage] = {
                    Event: [],
                };

                for (let event of this.guidedService.cachedCart[cartIndex][eventPage][eventType]) {
                    this.guidedService.editCart[eventPage]['Event'].push(event);
                }
            }
        }

        this.setGuidedServiceEditCartForFindObj(page, cartIndex);

        return { found: true, result: result };
    }

    nextFindObjInCart(pageArray, obj, cartIndex, page, type, result) {
        if (pageArray.length > 0 && obj.type == this.guidedService.cachedCart[cartIndex][page][type][0].type) {
            for (let i in this.guidedService.cachedCart[cartIndex][page][type]) {
                let cartObj = this.guidedService.cachedCart[cartIndex][page][type][i];
                if (cartObj.id === obj.id) {
                    return this.ifFindObjInCartIdsMatch(result, page, type, i, cartIndex);
                }
            }
        }

        return { found: false, result: result };
    }

    findObjInCart(obj) {
        let result = {
            guidedObject: {},
            cartIndex: null,
            page: '',
            found: false,
        };

        if (!this.guidedService.cachedCart || this.guidedService.cachedCart.length === 0) {
            return result;
        }

        this.guidedService.editCart = {};
        for (let cartIndex in this.guidedService.cachedCart) {
            for (let page in this.guidedService.cachedCart[cartIndex]) {
                for (let type in this.guidedService.cachedCart[cartIndex][page]) {
                    const pageArray = this.guidedService.cachedCart[cartIndex][page][type];

                    let status = this.nextFindObjInCart(pageArray, obj, cartIndex, page, type, result);
                    if (status.found) return status.result;
                }
            }
        }

        return result;
    }

    disableEditObject(obj: any) {
        return (
            obj.created_by_ref &&
            obj.created_by_ref !== this.envService.env.defaultIdentity.id &&
            obj.created_by_ref !== localStorage.getItem('identity')
        );
    }

    isIntegrationEligible(component: any): boolean {
        if (component.type === 'file' && component.hashes) {
            return true;
        }
        if (component.type === 'ipv4-addr' || component.type === 'ipv6-addr') {
            return !!component.value;
        }
        if (component.type === 'domain-name' && component.value) {
            return true;
        }
        if (component.type === 'url' && component.value) {
            return true;
        }
        return false;
    }

    isMispEligible(component: any): boolean {
        if (component.type === 'file') {
            return !!(component.hashes?.['SHA-1'] || component.hashes?.['SHA-256'] || component.hashes?.['MD5']);
        }
        return component.type === 'ipv4-addr' || component.type === 'ipv6-addr';
    }

    getIntegrationIndicator(component: any): { value: string; type: 'hash' | 'ip' | 'domain' | 'url' } | null {
        if (component.type === 'file' && component.hashes) {
            const hashes = component.hashes;
            const value = hashes['SHA-256'] || hashes['SHA-1'] || hashes['MD5'] || hashes[Object.keys(hashes)[0]];
            return value ? { value, type: 'hash' } : null;
        }
        if (component.type === 'ipv4-addr' || component.type === 'ipv6-addr') {
            return component.value ? { value: component.value, type: 'ip' } : null;
        }
        if (component.type === 'domain-name') {
            return component.value ? { value: component.value, type: 'domain' } : null;
        }
        if (component.type === 'url') {
            return component.value ? { value: component.value, type: 'url' } : null;
        }
        return null;
    }

    onIntegrationAction(event: Event, action: string, component: any, objectType: string, modal = null) {
        event.stopPropagation();
        if (action === 'vt') {
            this.openJson(event, component, objectType, false, 'vt');
        } else if (action === 'misp') {
            this.openJson(event, component, objectType, false, 'misp', modal);
        }
    }

    importVtObjects(objects: any[]) {
        if (!objects || objects.length === 0) return;
        this.addingStixToBundle = true;
        setTimeout(() => {
            try {
                const existingIds = new Set(this.stixService.bundle.objects.map((o) => o.id));
                for (const obj of objects) {
                    if (!existingIds.has(obj.id)) {
                        this.stixService.addComponent(obj);
                    }
                }
            } finally {
                this.addingStixToBundle = false;
            }
        }, 0);
    }

    importMispObjects(result, modal) {
        if (result?.selectedObjects?.length !== 0) {
            this.stixService.objectsToLoad = result.selectedObjects.objects;

            this.importObjects(modal);
        }
    }

    getCustomObjectHeading(component: any): string {
        if (component['name'] && typeof component['name'] == 'string') {
            return component['name'];
        }
        return component['type'] + ' (' + component['id'] + ')';
    }

    parseDeletionQueue(): void {
        for (let request of this.stixService.deletionQueue) {
            this.stixService.removeExtensionDefChildren(request[0], request[1], undefined, false, request[2]);
        }

        // Updates BundleComponent for children Custom Objects that were removed
        for (let customObj of this.stixService.removedCustomObj) {
            this.removeObject(customObj['id']);
        }
        this.stixService.removedCustomObj = [];
    }

    collectionsCanWriteTo() {
        // The below check is needed for Guided UI since it currently uses the deprecated local calls/variables
        if (this.selectedAPIRoot) {
            this.getCollectionsIds();
        }

        return this.taxiiServer.availableCollections.some((c) => c.can_write === true);
    }

    showAnalyst1(): void {
        this.showingAnalyst1 = !this.showingAnalyst1;
    }

    getAnalyst1Objects() {
        this.loadingStix = true;

        // Current approach: API call to proxy and get selected objects when add to bundle
        let url = this.taxiiServer.url + 'A1/indicator/?searchTerm=' + this.searchTextAnalyst1 + '*&pageSize=20';

        this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe((resp: any) => {
            console.info('Server response: ', resp);
            this.analyst1Objects = resp.results;
            this.analyst1Objects.forEach((o) => {
                o['checked'] = false;
            });
            this.analyst1currentPage = resp.page;
            this.analyst1TotalPages = resp.totalPages;
            this.loadingStix = false;
        });
    }

    checkAllAnalyst1Objects(event) {
        this.analyst1Objects.forEach((o) => {
            o.checked = event.target.checked;
        });
    }

    async addAnalyst1ToBundle() {
        let objectReqs = [];
        this.addingStixToBundle = true;
        const checkedAnalyst1Objects = this.analyst1Objects
            .filter((o) => o.checked)
            .forEach((o) => {
                let url = this.taxiiServer.url + 'A1/indicator/' + o.id + '/stix/';
                objectReqs.push(this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }));
            });
        console.debug(checkedAnalyst1Objects);

        try {
            const responses: any = await Promise.all(objectReqs.map((req) => lastValueFrom(req)));
            let count = 0;
            for (let resp of responses) {
                count++;
                if (count === resp.length) {
                    this.addingStixToBundle = false;
                }

                for (let object of resp.objects) {
                    this.stixService.addComponent(object, true);
                }
            }
        } catch (err) {
            console.error(err, 'Error requesting individual Analyst1 object.');
            throw err;
        }
    }

    updateAnalyst1Checked(object) {
        object.checked = !object.checked;
    }

    showNextAnalyst1Page() {
        return this.analyst1currentPage < this.analyst1TotalPages;
    }

    getNextAnalyst1Page() {
        this.loadingStixNext = true;
        // API call to proxy and get selected objects when add to bundle
        let url =
            this.taxiiServer.url + 'A1/indicator/?searchTerm=' + this.searchTextAnalyst1 + '*&pageSize=20&page=' + (this.analyst1currentPage + 1);

        this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe((resp: any) => {
            console.info('Server response: ', resp);
            this.analyst1Objects = resp.results;
            this.analyst1Objects.forEach((o) => {
                o['checked'] = false;
            });
            this.analyst1currentPage = resp.page;
            this.analyst1TotalPages = resp.totalPages;
            this.loadingStixNext = false;
        });
    }

    enableAddToBundle() {
        return this.analyst1Objects.some((o) => o.checked);
    }

    async openAnalyst1Modal() {
        await this.envService.checkAuth('/bundle');
        const modalRef = this.modalService.open(Analyst1DialogComponent, { size: 'analyst1' });
        modalRef.result
            .then((result) => {
                if (result === 'added') {
                    this.addingStixToBundle = true;
                    setTimeout(() => {
                        this.addingStixToBundle = false;
                    }, 1500);
                }
            })
            .catch(() => {});
    }

    /**
     * Switch to MISP page
     */
    switchToMisp() {
        const httpHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );

        const url = `${this.envService.env.imxServer.url}/misp-server`;
        this.httpClient.get(url, { headers: httpHeaders }).subscribe(
            (resp: any) => {
                this.mispServers = resp.data;
                this.modalCurrentStep = 5;

                this.mispTitle = this.reportName;
                this.mispProducer = 'imx';
                this.mispApi = '';
                this.mispUrl = '';
                this.saveMisp = false;

                this.publishMisp = true;
            },
            (err) => {
                this.mispServers = [];
                this.modalCurrentStep = 5;

                this.mispTitle = this.reportName;
                this.mispProducer = 'imx';
                this.mispApi = '';
                this.mispUrl = '';
                this.saveMisp = false;

                this.publishMisp = true;
            }
        );
    }

    openMispLink(event) {
        event.stopPropagation();

        window.open(this.getMispEventUrl(), '_blank');
    }

    enableMispExport() {
        return this.mispJson != 'Fill in Report Title and Producer, then click "Convert" to convert STIX Bundle to MISP JSON';
    }

    convertStixToMisp() {
        this.loadingMisp = true;

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
        });

        const url = `${this.envService.env.imxServer.url}/stix-to-misp`;

        const data = {
            producer: this.mispProducer,
            title: this.reportName,
            bundle: this.bundle,
        };

        this.mispStix
            .stixToMisp(data)
            .then((resp: any) => {
                console.info(resp);
                this.mispJson = JSON.stringify(resp.data, null, 2);
                this.loadingMisp = false;
                this.expandMisp = false;
            })
            .catch((err) => {
                console.error(err);
                this.loadingMisp = false;
                this.expandMisp = false;
                this.announcementService.show(
                    'Failed to convert to MISP',
                    `Unexpected error occurred while trying to convert STIX to MISP. Error: ${err.error?.message ? err.error.message : err.message}`,
                    'error',
                    false
                );
            });
    }

    toggleMisp() {
        this.expandMisp = !this.expandMisp;
    }

    downloadMisp() {
        this.loadingMisp = true;
        const a = this.document.createElement('a');
        const file = new Blob([this.mispJson], { type: 'application/json' });
        a.href = URL.createObjectURL(file);

        a.download = this.mispTitle + '_' + this.mispProducer + '.json';

        setTimeout(() => {
            a.click();
            this.loadingMisp = false;
        }, 400);
    }

    submitMisp() {
        this.modalCurrentStep = 6;
    }

    exportMisp() {
        this.loadingMisp = true;

        const url = `${this.envService.env.imxServer.url}/export-misp`;

        const header = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`);

        const body = {
            url: this.mispUrl.endsWith('/') ? this.mispUrl : this.mispUrl + '/',
            api: this.mispApi,
            json: this.mispJson,
            report: this.mispTitle,
        };

        this.httpClient.post(url, body, { headers: header }).subscribe({
            next: (resp: any) => {
                const mispPostUrl = `${this.envService.env.imxServer.url}/misp-server`;

                const body = {
                    url: this.mispUrl,
                    api: this.mispApi,
                };

                if (this.saveMisp) {
                    this.httpClient.post(mispPostUrl, body, { headers: header }).subscribe({
                        next: (resp2: any) => {
                            this.loadingMisp = false;
                            this.expandMisp = false;
                            this.modalCurrentStep = 7;
                            this.mispJson = JSON.stringify(resp, null, 2);
                            this.mispObj = resp;
                        },
                    });
                } else {
                    this.loadingMisp = false;
                    this.expandMisp = false;
                    this.modalCurrentStep = 7;
                    this.mispJson = JSON.stringify(resp, null, 2);
                    this.mispObj = resp;
                }
            },
            error: (err) => {
                console.error(err);
                this.announcementService.show(
                    'Failed to submit to MISP',
                    `Unexpected error ocurred while submitting to MISP. Error: ${err.error?.message ? err.error.message : err.message}`,
                    'error',
                    false
                );
                this.loadingMisp = false;
                this.expandMisp = false;
            },
        });
    }

    getMispEventUrl() {
        if (this.mispUrl.endsWith('/')) return `${this.mispUrl}events/view/${this.mispObj['Event'].id}`;
        else return `${this.mispUrl}/events/view/${this.mispObj['Event'].id}`;
    }

    increaseCurrentStep() {
        if (this.stixService.publishToA1) {
            this.modalCurrentStep = this.modalCurrentStep + 2;
            return;
        }
        if (this.modalCurrentStep == 1) {
            if (this.taxiiServerType == 'ais2') {
                this.apiRoots = this.AIS_COLLECTIONS;
            } else {
                this.apiRootsPublishTo();
            }
        }
        this.modalCurrentStep = this.modalCurrentStep + 1;
    }

    decreaseCurrentStep() {
        if (this.stixService.publishToA1) {
            this.modalCurrentStep = this.modalCurrentStep - 2;
            return;
        }

        if (this.publishMisp) {
            if (this.modalCurrentStep == 5) {
                this.modalCurrentStep = 2;
                this.publishMisp = false;
                this.loadingMisp = false;
                this.expandMisp = false;
                this.mispTitle = this.reportName;
                this.mispProducer = 'imx';
                this.mispUrl = '';
                this.saveMisp = false;
                this.mispApi = '';
                this.mispJson = 'Fill in Report Title and Producer, then click "Convert" to convert STIX Bundle to MISP JSON';
                this.mispObj = null;
            } else if (this.modalCurrentStep == 6) {
                this.modalCurrentStep -= 1;
                this.loadingMisp = false;
                this.expandMisp = false;
            } else if (this.modalCurrentStep == 7) {
                this.modalCurrentStep = 5;
                this.loadingMisp = false;
                this.expandMisp = false;
                this.mispTitle = this.reportName;
                this.mispProducer = 'imx';
                this.mispUrl = '';
                this.saveMisp = false;
                this.mispApi = '';
                this.mispJson = 'Fill in Report Title and Producer, then click "Convert" to convert STIX Bundle to MISP JSON';
                this.mispObj = null;
            }
            return;
        }

        this.modalCurrentStep = this.modalCurrentStep - 1;
        if (this.modalCurrentStep <= 2) {
            this.publishA1 = false;
        }
    }

    selectApiRoot(apiRoot) {
        if (this.selectedAPIRoot?.title !== apiRoot.title) {
            this.selectedCollection = '';
        }
        this.selectedAPIRoot = apiRoot;
        this.taxiiServer.apiRoot = apiRoot.title;
        this.taxiiServer.childRoot = apiRoot.childRoot;
        this.getCollectionsIds();
    }

    apiRootsPublishTo() {
        let that = this;
        this.stixService.apiRoots2 = this.stixService.apiRoots2.filter(function (item, pos) {
            return that.stixService.apiRoots2.indexOf(item) == pos;
        });

        this.apiRoots = this.stixService.apiRoots2.filter((r) => r.collections.some((c) => c.can_write));

        return this.apiRoots;
    }

    selectAcsMarking(event) {
        this.stixService.acsSelection = event.target.value;
    }

    discardBundleHandler(message = null) {
        this.modalRef = this.modalService.open(MessageDialogComponent);
        if (this.guidedUI) message = message ?? 'Please confirm you would like to start a new report.';
        else message = message ?? 'Please confirm you would like to discard current bundle.';

        let messageData = {
            title: 'Discard Bundle',
            message: message,
        };

        if (this.guidedUI) {
            messageData.title = 'Restart Report';
        }

        this.modalRef.componentInstance.messageObj = messageData;

        this.modalRef.result.then(async (resp) => {
            if (resp === 'confirm') {
                await this.clearBundle();
                this.stixService.objectsToLoad = [];
                const discardEvent = {
                    type: 'discard-bundle',
                };
                this.stixService.sendData(discardEvent);
                setTimeout(() => {
                    this.discardBundle();
                }, 500);
            }
        });
    }

    getUnassignedObjects() {
        this.unassignedObjMarkingRefObjs = this.stixService.getUnassignedObjects();
    }

    ifBundleObjectTypeKeyUnassigned() {
        const bundle = this.filteredBundle.filter((o) => {
            const tlpObj = this.getTlp(o);
            if (tlpObj.length === 0 || tlpObj.every((o) => o.type.toLowerCase() === 'acs')) {
                return true;
            }
            return false;
        });

        this.customBundle.forEach((o) => {
            const tlpObj = this.getTlp(o);
            if (tlpObj.length === 0 || tlpObj.every((o) => o.type.toLowerCase() === 'acs')) {
                bundle.push(o);
            }
        });

        return bundle;
    }

    ifBundleObjectTypeKeyIsExpected(type) {
        const tlps = this.filteredBundle.filter((o) => {
            const tlpObj: any = this.getTlp(o);
            if (tlpObj.length > 0 && tlpObj[tlpObj.length - 1].name === type.key) {
                return true;
            }
            return false;
        });

        this.customBundle.forEach((o) => {
            const tlpObj: any = this.getTlp(o);
            if (tlpObj.length > 0 && tlpObj[tlpObj.length - 1].name === type.key) {
                tlps.push(o);
            }
        });

        return tlps;
    }

    bundleObjectType(type) {
        switch (type.key) {
            case 'UNASSIGNED':
                return this.ifBundleObjectTypeKeyUnassigned();
            case 'TLP:CLEAR':
            case 'TLP:GREEN':
            case 'TLP:AMBER':
            case 'TLP:AMBER+STRICT':
            case 'TLP:WHITE':
            case 'TLP:RED':
                return this.ifBundleObjectTypeKeyIsExpected(type);
            default:
                return this.filteredBundle;
        }
    }

    countTLP() {
        this.tlpCounts = this.stixService.countTLP();

        this.tlpCounts.forEach((tlp) => {
            if (tlp.count === 0) return;
            if (!this.tlpOptions.find((opt) => opt.key === tlp.tlp.key)) {
                this.tlpOptions.push(tlp.tlp);
            }
        });
    }

    tlpShown(tlp) {
        return this.tlpCounts.find((obj) => obj.tlp.key === tlp.key);
    }

    tlpCount(tlp) {
        let sum = 0;
        sum += this.tlpCounts.reduce((currentVal, currentTlp) => {
            if (currentTlp.tlp.key === tlp.key) currentVal += currentTlp.count;
            return currentVal;
        }, 0);

        return !sum ? 0 : sum;
    }

    tlpMargin(tlp) {
        if (tlp.key === 'TLP:AMBER+STRICT') {
            return 'strict';
        }
        if (tlp.key === 'TLP:AMBER') {
            return 'amber';
        }
        return 'other';
    }

    tlpAccordianDataTargetId(tlp) {
        return 'collapse' + tlp.short;
    }

    selectGroupByTLP(event) {
        if (event?.target?.value) {
            this.isGroupByTLP = event.target.value === 'true';
            this.updateGroupByTLP();

            this.stixService.isGroupByTLP = this.isGroupByTLP;
        }
    }

    updateGroupByTLP() {
        this.getUnassignedObjects();
        this.countTLP();
        this.clearSearchResults();
    }

    openFullscreen() {
        this.fullScreenMode = true;

        if (this.elem.requestFullscreen) {
            this.elem.requestFullscreen();
        } else if (this.elem.mozRequestFullScreen) {
            // Firefox
            this.elem.mozRequestFullScreen();
        } else if (this.elem.webkitRequestFullscreen) {
            // Chrome, Safari and Opera
            this.elem.webkitRequestFullscreen();
        } else if (this.elem.msRequestFullscreen) {
            // IE/Edge
            this.elem.msRequestFullscreen();
        }

        window.scrollTo(0, 0);
    }

    closeFullscreen() {
        console.debug('closeFullscreen');
    }

    viewSavedBundles() {
        if (this.viewingSavedBundles === true) {
            this.viewingSavedBundles = false;
        } else {
            this.viewingSavedBundles = true;
        }
    }

    appendTLP1(result, ref) {
        for (let tlp of TLP_OPTIONS) {
            if (ref === tlp.id) {
                let nameArr = tlp.name.split(':');
                let color = nameArr[1];
                if (!result.includes(color)) {
                    if (result !== '') result += ', ';
                    result += color;
                }
            }
        }

        return result;
    }

    appendTlp2(result, ref) {
        for (let tlp of TLP20_OPTIONS) {
            if (ref === tlp.id) {
                let nameArr = tlp.name.split(':');
                let color = nameArr[1];
                if (!result.includes(color)) {
                    if (result !== '') result += ', ';
                    result += color;
                }
            }
        }

        return result;
    }

    findTlpColor(bundle) {
        let result: string = '';

        for (let object of bundle) {
            if (object.object_marking_refs) {
                for (let ref of object.object_marking_refs) {
                    result = this.appendTLP1(result, ref);
                    result = this.appendTlp2(result, ref);
                }
            }
        }

        return result;
    }

    async copyPaste(modal) {
        await this.envService.checkAuth('/bundle');

        this.savingBundle = false;
        this.isReset = false;
        const copyPasteRef = this.modalService.open(CopyPasteDialogComponent, {
            // size: 'xl',
            scrollable: true,
            centered: true,
            backdrop: 'static',
            windowClass: 'tools-modal',
        });

        copyPasteRef.result
            .then((result) => {
                if (result?.selectedObjects?.length !== 0) {
                    this.stixService.objectsToLoad = result.selectedObjects.objects;
                    this.importObjects(modal);
                }
            })
            .catch(() => {
                /* dismissed */
            });
    }

    loadVersioning(): void {
        const new_version = JSON.parse(localStorage.getItem('new_version_objects'));
        const submissionId =
            this.loadingModalData?.destination === 'local'
                ? this.loadingModalData?.bundle?.submissionID
                : this.loadingModalData?.bundle?._source?.submissionID;
        const discarding = this.isDiscarding;
        if (!this.newVersionObjectsLoad || this.newVersionObjectsLoad.length === 0) {
            if (!submissionId) return console.error('Submission ID missing');

            this.submissions.getSubmissionByID(submissionId).then((res: any) => {
                const result = res.res;
                result.successes = result.successes ?? [];

                if (result.failures && result.failures.length > 0) {
                    const duplicates = result.failures.filter((f) => f.message === 'duplicate collection/object/version\n');
                    if (duplicates && duplicates.length > 0) {
                        result['successes'] = [...result.successes, ...duplicates];
                    }
                }
                result.successes = result.successes.map((elem) => elem.id);
                if (new_version && new_version.length > 0 && !discarding) {
                    result.successes.forEach((elem) => {
                        if (!new_version.includes(elem)) new_version.push(elem);
                    });
                    localStorage.setItem('new_version_objects', JSON.stringify(new_version));
                } else localStorage.setItem('new_version_objects', JSON.stringify(result.successes));
            });
            return;
        }

        if (discarding || !new_version || new_version.length === 0)
            return localStorage.setItem('new_version_objects', JSON.stringify(this.newVersionObjectsLoad));

        this.newVersionObjectsLoad.forEach((element) => {
            if (!new_version.includes(element)) new_version.push(element);
        });

        return localStorage.setItem('new_version_objects', JSON.stringify(new_version));
    }

    formalDeterminationView(formalDet) {
        return formalDet;
    }

    openStixConfig(custom = false, obj = null) {
        this.saveConfig = false;
        const configModalRef = this.modalService.open(AcsDialogComponent, { ariaLabelledBy: 'stix-config-modal', size: 'xl' });
        configModalRef.componentInstance.custom = custom;
        configModalRef.componentInstance.customAcs = obj;
        configModalRef.result.then((data) => {
            this.acsConfiguration = null;
            console.info(data);

            if (!custom && data.tlp) {
                this.updateGroupByTLP();
            } else {
                this.clearSearchResults();
            }
        });
    }

    openGlobalTLPConfig() {
        const modalRef = this.modalService.open(GlobalTlpComponent, { size: 'xl', windowClass: 'global-tlp-modal' });

        modalRef.result.then((resp) => {
            if (resp?.type === 'confirm') {
                setTimeout(() => {
                    this.selectedTlpOption = resp.data;
                    this.applyTlpToAll = resp.applyToAll;
                    this.updateBundleUnassignedTLP();
                }, 500);
            }
        });
    }

    filterTlp(o) {
        if (!o.object_marking_refs) return o;

        const tlp1 = this.stixService.getTlpOptions('v1').map((tlp) => tlp.value);
        const tlp2 = this.stixService.getTlpOptions('v2').map((tlp) => tlp.value);

        o.object_marking_refs = o.object_marking_refs.filter((id) => {
            if (tlp1.includes(id) || tlp2.includes(id)) return false;

            return true;
        });

        return o;
    }

    filterTlpFromReport(o) {
        o.object_refs = o.object_refs ?? [];

        const tlp1 = this.stixService.getTlpOptions('v1').map((tlp) => tlp.value);
        const tlp2 = this.stixService.getTlpOptions('v2').map((tlp) => tlp.value);

        o.object_refs = o.object_refs.filter((ref) => !tlp1.includes(ref) && !tlp2.includes(ref));
    }

    updateBundleUnassignedTLP() {
        if (this.applyTlpToAll) {
            this.unassignedObjMarkingRefObjs = this.stixService.bundle.objects;
        } else {
            this.unassignedObjMarkingRefObjs = this.stixService.getUnassignedObjects();
        }

        const storedIdentity = localStorage.getItem('identity');

        this.unassignedObjMarkingRefObjs = this.unassignedObjMarkingRefObjs.filter(
            (o) =>
                o.type !== 'marking-definition' &&
                o.id !== this.envService.env.defaultIdentity.id &&
                (o.created_by_ref == this.envService.env.defaultIdentity.id ||
                    (storedIdentity && o.created_by_ref === storedIdentity) ||
                    !o.created_by_ref)
        );
        if (this.stixService.objectMarkingReferences.length > 0 && this.selectedTlpOption) {
            this.unassignedObjMarkingRefObjs.forEach((o) => {
                this.filterTlp(o);
                if (!o.object_marking_refs) o['object_marking_refs'] = [this.selectedTlpOption.value];
                else o.object_marking_refs.push(this.selectedTlpOption.value);

                if (o.type === 'report') {
                    this.filterTlpFromReport(o);
                    o.object_refs.push(this.selectedTlpOption.value);
                }
            });

            console.info(this.unassignedObjMarkingRefObjs);
            this.stixService.db.imxCache.toArray().then(async (results) => {
                for (const obj of this.unassignedObjMarkingRefObjs) {
                    const matchedObj = results.find((elem) => obj.id === elem.id);
                    if (matchedObj) matchedObj.object = obj;
                }
                await this.stixService.db.imxCache.bulkPut(results);
                this.unassignedObjMarkingRefObjs = this.stixService.getUnassignedObjects();
            });
        }
    }
    generateUploadError(): void {
        if (this.stixService.uploadError.length > 0) {
            this.announcementService.show(
                'STIX validation issues encountered while uploading',
                this.stixService.uploadError,
                'upload-error',
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                0,
                false
            );
        }
        this.stixService.uploadError = '';
    }

    createCustomObject(component: any): void {
        let types = component['extension_types'].filter((type) => type.includes('new'));
        if (types) {
            this.stixService.parentExtensionID = component.id;
            this.stixService.customObjInfo = { new: true, parent: component.id, types: types };
            this.router.navigate(['/custom-object']);
        } else {
            console.error('ERROR: Object has no associated custom types');
        }
    }

    async vtDialog(modal) {
        await this.envService.checkAuth('/bundle');

        this.savingBundle = false;
        this.isReset = false;
        const vtDialogRef = this.matDialog.open(VtDialogComponent, {
            data: {},
            width: '95vw',
            height: '95vh',
            panelClass: 'modal-analyst1',
            position: {
                top: '60px',
            },
        });

        vtDialogRef.afterClosed().subscribe((result) => {
            if (result?.selectedObjects?.length !== 0) {
                this.stixService.objectsToLoad = result.selectedObjects.objects;
                this.importObjects(modal);
            }
        });
    }

    updateReferences(): void {
        this.stixService.promptDelete = [];

        for (let obj of this.promptDel) {
            obj = JSON.parse(JSON.stringify(obj).split(this.origID).join(this.stixService.newID));
            this.stixService.addComponent(obj);
        }
    }

    //Derek - This will cause issues when it comes to sub-sub+ properties and minimum property/count requirements
    promptDelete(deleteModal): void {
        // Calling directly from StixService breaks the modal iterating (opens all at once)
        this.opened = true;
        this.promptDel = this.stixService.promptDelete;
        this.stixService.promptDelete = [];
        this.editedRef = this.stixService.origID.length > 0;
        if (this.promptDel.length > 0) {
            this.nextDel = this.promptDel.pop();
            this.promptDeleteHelper(deleteModal, []);
        }
    }

    promptDeleteHelper(deleteModal, reqs): void {
        if (this.nextDel) {
            const modalRef = this.matDialog.open(DeleteDialogComponent, {
                data: { object: this.nextDel, parents: this.promptDel, reqs: reqs },
                maxHeight: '85vh',
                width: '850px',
                maxWidth: '90vw',
                position: { top: '64px' },
            });
            modalRef.afterClosed().subscribe(async (result) => {
                if (result?.clicked) {
                    if (result.clicked == 'delete') {
                        await this.deleteRefHelper(result.obj);
                    } else if (result.clicked == 'deleteAll') {
                        await this.deleteRefHelper(result.obj);
                        for (let obj of this.promptDel) {
                            await this.deleteRefHelper(obj);
                        }
                        this.promptDel = [];
                    } else if (result.clicked == 'closeAll') {
                        this.promptDel = [];
                    } else if (result.clicked == 'updateAll') {
                        for (let obj of this.promptDel) {
                            this.stixService.addComponent(
                                JSON.parse(JSON.stringify(obj).split(this.stixService.origID).join(this.stixService.newID))
                            );
                        }

                        this.promptDel = [];
                    }
                }

                this.nextDel = this.promptDel.pop();
                if (!this.nextDel) {
                    this.stixService.promptDelete = [];
                }
                this.promptDeleteHelper(deleteModal, reqs);
            });
        }
    }

    ifPropIsArray(obj, prop) {
        if (obj[prop].every((elem) => typeof elem === 'string')) {
            obj[prop] = obj[prop].filter((elem) => elem !== this.stixService.origID);
        } else {
            for (let i in obj[prop]) {
                // Derek - this will still cause issues with deeper subproperties
                for (let j in obj[prop][i]) {
                    if (JSON.stringify(obj[prop][i][j]).includes(this.stixService.origID) && j != 'contains_refs') {
                        delete obj[prop][i][j];
                    }
                }
            }
        }

        if (obj[prop].length === 0) delete obj[prop];

        return obj;
    }

    ifPropNotArray(obj, prop) {
        for (let i in obj[prop]) {
            if (JSON.stringify(obj[prop][i]).includes(this.stixService.origID)) {
                if (typeof obj[prop][i] == 'string') {
                    delete obj[prop][i];
                } else {
                    obj = this.ifPropContainsSubProps(obj, prop, i);
                }
            }
        }

        return obj;
    }

    ifPropContainsSubProps(obj, prop, i) {
        for (let j in obj[prop][i]) {
            if (JSON.stringify(obj[prop][i][j]).includes(this.stixService.origID) && j != 'contains_refs') {
                delete obj[prop][i][j];
            }
        }

        return obj;
    }

    ifPropIncludesRefs(prop, obj) {
        if (prop.includes('refs')) {
            if (Array.isArray(obj[prop])) {
                obj = this.ifPropIsArray(obj, prop);
            } else {
                obj = this.ifPropNotArray(obj, prop);
            }
        } else {
            delete obj[prop];
        }

        return obj;
    }

    async deleteRefHelper(obj: any): Promise<void> {
        this.stixService.origID = '';
        await this.stixService.removeComponent(obj.id);
    }

    async removeTlp(modal) {
        await this.envService.checkAuth('/bundle');

        this.modalService.open(modal, { ariaLabelledBy: 'tlp-title', size: 'md', centered: true });
    }

    confirmRemoveTlp() {
        this.modalService.dismissAll();

        this.stixService.db.imxCache.toArray().then(async (results) => {
            results.forEach((obj) => {
                if (obj.id === this.envService.env.defaultIdentity.id) return;

                this.filterTlp(obj.object);

                if (!obj.object.object_marking_refs || obj.object.object_marking_refs.length === 0) delete obj.object.object_marking_refs;
            });

            this.stixService.db.imxCache.bulkPut(results);
        });
    }

    hasTlp(): boolean {
        return this.bundle.objects.some((obj) => {
            if (!obj.object_marking_refs || obj.id === this.envService.env.defaultIdentity.id) return false;

            const tlp1 = this.stixService.getTlpOptions('v1').map((tlp) => tlp.value);
            const tlp2 = this.stixService.getTlpOptions('v2').map((tlp) => tlp.value);

            const allTlp = [...tlp1, ...tlp2];

            return obj.object_marking_refs.some((markRef) => allTlp.includes(markRef));
        });
    }

    selectMisp(misp) {
        this.mispUrl = misp.url;
        this.mispApi = misp.api;
    }

    openMispDialog(event, modal) {
        event.stopPropagation();
        this.mispDialog(modal);
    }

    async mispDialog(modal, data = {}) {
        await this.envService.checkAuth('/bundle');

        const mispDialogRef = this.matDialog.open(MispDialogComponent, {
            data: data,
            width: '95vw',
            height: '95vh',
            panelClass: 'modal-analyst1',
            position: {
                top: '60px',
            },
        });

        mispDialogRef.afterClosed().subscribe((result) => {
            if (result.selectedObjects) {
                this.importMispObjects(result, modal);
            }
        });
    }
}
