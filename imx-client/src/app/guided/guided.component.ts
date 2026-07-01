import { Component, OnInit, ViewChild, HostListener, Inject, DOCUMENT, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { faQuestionCircle, faCheckCircle, faTimesCircle, faEdit, faPlusSquare, faChartBar } from '@fortawesome/free-regular-svg-icons';
import {
    faTrash,
    faFileImport,
    faInfo,
    faInfoCircle,
    faUpload,
    faFileUpload,
    faHeart,
    faBan,
    faPaperPlane,
    faExclamationTriangle,
    faArrowLeft,
    faArrowRight,
    faFile,
    faSearch,
    faCheck,
    faTimes,
    faMousePointer,
    faWaveSquare,
    faPen,
    faBackspace,
    faRandom,
    faProjectDiagram,
    faFileDownload,
    faSave,
    faPlus,
    faUndo,
    faTools,
    faHome,
    faCartPlus,
} from '@fortawesome/free-solid-svg-icons';
import { faCube, faServer } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, forkJoin } from 'rxjs';
import { BundleComponent } from '../bundle/bundle.component';
import { HelpDialogComponent } from '../dialogs/help-dialog/help-dialog.component';
import { MessageDialogComponent } from '../dialogs/message-dialog/message-dialog.component';
import { GuidedMenuComponent } from '../guided-menu/guided-menu.component';
import { STIX_OBJECTS } from '../models/stix-objects';
import { Content } from '../models/content';
import { StixService } from '../stix-service.service';
import { StringArrayComponent } from '../string-array/string-array.component';
import { EnvService } from '../env-service/env.service';
import all_schemas from '../bundle/schemas.json';
import { AppComponent } from '../app.component';
import { ThreatActorComponent } from '../guided-report/threat-actor/threat-actor.component';
import { ObjectAdditionComponent } from '../guided-report/object-addition/object-addition.component';
import { AddIndicatorToBundleComponent } from '../guided-components/add-indicator-to-bundle/add-indicator-to-bundle.component';
import { WhoIndividualComponent } from '../guided-components/who-individual/who-individual.component';
import { AddComponentComponent } from '../add-component/add-component.component';
import { HowTtpComponent } from '../guided-components/how-ttp/how-ttp.component';
import { HowPatternBuilderComponent } from '../guided-components/how-pattern-builder/how-pattern-builder.component';
import { HowObservableComponent } from '../guided-components/how-observable/how-observable.component';
import { HowEventDetectionComponent } from '../guided-components/how-event-detection/how-event-detection.component';
import { MatDialog } from '@angular/material/dialog';
import { PatternBuilderComponent } from '../dialogs/pattern-builder/pattern-builder.component';
import { EventEmitter } from '@angular/core';
import { WhenSightingComponent } from '../guided-components/when-sighting/when-sighting.component';
import { HowEventComponent } from '../guided-components/how-event/how-event.component';
import { HowCweComponent } from '../guided-components/how-cwe/how-cwe.component';
import { WhyCommonBehaviorsComponent } from '../guided-components/why-common-behaviors/why-common-behaviors.component';
import { WhyAttackerComponent } from '../guided-components/why-attacker/why-attacker.component';
import { WhereLocationComponent } from '../guided-components/where-location/where-location.component';
import { WhatImpactComponent } from '../guided-components/what-impact/what-impact.component';
import { GuidedService } from '../guided.service';
import { ReportAssessmentComponent } from '../guided-components/report-assessment/report-assessment.component';
import { WhenEventComponent } from '../guided-components/when-event/when-event.component';
import { GuidedCartComponent } from '../guided-components/guided-cart/guided-cart.component';
import { DeciderServiceService } from '../decider-service/decider-service.service';
import { Analyst1DialogComponent } from '../dialogs/analyst1-dialog/analyst1-dialog.component';
import { validateStix } from '../shared/utils/validation.utils';

declare const require: any;
const Validator = require('jsonschema').Validator;
@Component({
    selector: 'app-guided',
    templateUrl: './guided.component.html',
    styleUrls: ['./guided.component.css'],
    standalone: false,
})
export class GuidedComponent implements OnInit {
    @ViewChild('menu', { static: false }) guidedMenu: GuidedMenuComponent;
    @ViewChild('bundle', { static: true }) guidedBundle: BundleComponent;
    @ViewChild('bundleForReview', { static: false }) guidedBundleForReview: BundleComponent;
    @ViewChild('objectMarking', { static: true }) objectMarking: StringArrayComponent;
    @ViewChild('appRoot', { static: true }) appRoot: AppComponent;
    @ViewChild('loadModal', { static: true }) loadModal: any;

    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;
    @ViewChild('threatActor', { static: false }) threatActor: ThreatActorComponent;
    @ViewChild('objectAddition', { static: false }) objectAddition: ObjectAdditionComponent;
    @ViewChild('addIndicatorToBundle', { static: false }) addIndicatorToBundle: AddIndicatorToBundleComponent;
    @ViewChild('whoIndividual', { static: false }) whoIndividual: WhoIndividualComponent;
    @ViewChild('whenSighting', { static: false }) whenSighting: WhenSightingComponent;
    @ViewChild('howEvent', { static: false }) howEvent: HowEventComponent;
    @ViewChild('howCwe', { static: false }) howCwe: HowCweComponent;
    @ViewChild('reportAssessment', { static: false }) reportAssessment: ReportAssessmentComponent;
    @ViewChild('whenEvent', { static: false }) whenEvent: WhenEventComponent;
    @ViewChild('howEventDetection', { static: false }) howEventDetection: HowEventDetectionComponent;
    @ViewChild('howPatternBuilder', { static: false }) howPatternBuilder: HowPatternBuilderComponent;
    @ViewChild('howObservable', { static: false }) howObservable: HowObservableComponent;
    @ViewChild('howTtp', { static: false }) howTtp: HowTtpComponent;
    @ViewChild('whyCommonBehaviors', { static: false }) whyCommonBehaviors: WhyCommonBehaviorsComponent;
    @ViewChild('whyAttacker', { static: false }) whyAttacker: WhyAttackerComponent;
    @ViewChild('whereLocation', { static: false }) whereLocation: WhereLocationComponent;
    @ViewChild('whatImpact', { static: false }) whatImpact: WhatImpactComponent;
    @ViewChild('guidedCartFooter', { static: false }) guidedCartFooter: GuidedCartComponent;

    @ViewChild('saveModal') saveModal!: TemplateRef<any>;
    @ViewChild('uploadFile') uploadFile!: TemplateRef<any>;

    patternBuilderEmitter = new EventEmitter<string>();
    deciderToolEmitter = new EventEmitter<any>();

    faQuestionCircle = faQuestionCircle;
    faCheckCircle = faCheckCircle;
    faCube = faCube;
    faUpload = faUpload;
    faFileUpload = faFileUpload;
    faTimesCircle = faTimesCircle;
    faHeart = faHeart;
    faEdit = faEdit;
    faPlusSquare = faPlusSquare;
    faPaperPlane = faPaperPlane;
    faBan = faBan;
    faInfo = faInfo;
    faExclamationTriangle = faExclamationTriangle;
    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    faFile = faFile;
    faSearch = faSearch;
    faCheck = faCheck;
    faTimes = faTimes;
    faSelect = faMousePointer;
    faConnect = faWaveSquare;
    faPen = faPen;
    faBackspace = faBackspace;
    faMerge = faRandom;
    faVisualize = faProjectDiagram;
    faFileDownload = faFileDownload;
    faSave = faSave;
    faPlus = faPlus;
    faCartPlus = faCartPlus;
    faUndo = faUndo;
    faTools = faTools;
    faChartBar = faChartBar;
    faHome = faHome;

    menuSelection: string;
    tlpSelection: string;
    modalRef: any;
    indicatorSelection: string;
    activeTab: any;
    stixObjects = JSON.parse(JSON.stringify(STIX_OBJECTS));
    stixObjectsOriginal = JSON.parse(JSON.stringify(STIX_OBJECTS));
    allIOCObjects: any = [];
    tabs: any = [];
    objectSelection: any;
    objectPropertyTypeSelection: any;
    createRelationship: boolean;
    relationshipTypeSelection: string;
    relationshipSelection: string;
    createAnotherObject: boolean;
    reviewOption: string = 'Bundle';
    activePublishTab: any;
    taxiiServerType: string;
    env = this.envService.env;

    disableDeciderTool: boolean = true;
    isAddEnabled: boolean;
    subscription: Subscription;
    errorMessages: any;
    tlpVersion: string;

    searchText: string = '';
    prevSearch: string = '';
    searchResults: string = '';
    searchIndex: number = 0;
    searchMatches: Array<any> = [];

    popupMsgs = [];
    onPageMsgs = [];
    customObject = false;
    queryParams = undefined;

    menuNumber: string;
    init = true;

    // ANALYST1
    file: File = null;
    evidenceSubmissions = [];
    private httpHeaders: HttpHeaders;
    evidenceId: number = null;
    evidenceIdUserInput: number = this.evidenceId;
    evidenceIdFromFile: number = this.evidenceId;
    httpHeadersJSON: any;

    faTrash = faTrash;
    faAddToBundle = faFileImport;
    faInfoCircle = faInfoCircle;
    faServer = faServer;

    // Analyst1 Evidence
    showingAnalyst1 = true;
    searchTextAnalyst1: string = '';
    analyst1Objects: any = [];
    analyst1ObjectsInCart: any = [];
    analyst1TotalPages: number = 0;
    analyst1currentPage: number = 0;
    loadingStixNext: boolean = false;
    addingStixToPending: boolean = false;

    loadingStix = false;
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
    coll: any = null;
    rownumber: number = -1;
    objnumber: number = -1;

    step = 0;
    pendingObjects = [];
    pendingStixObjects = [];
    activeTabAnalyst1EvidenceType = 'Evidence ID';
    activeTabAnalyst1ObjType = 'indicator';
    objectIdMapping = [];

    attackers: string[] = [];

    useGeneralApi = false;
    useBatchCheckApi = false;
    useEvidenceApi = false;

    formData: FormData = null;

    addAnalyst1ToBundleType = null;
    evidenceTypeTabs = ['Evidence ID', 'File', 'Search'];
    evidenceUploadResponse = null;
    evidenceUploadClicked = false;
    evidenceUploadTimerId = null;
    // End Analyst1 Evidence

    questionsFavorited = [];
    isPrimaryPropertiesDisabled = false;
    relationshipTabs = [];
    activeTabRelationship = null;
    relationshipTypes = ['based on source and target object type if same or not'];

    analyst1ObjectsObservable = null;

    a1 = '';
    publishStatus: string = 'none';
    publishFeedback: any = {};
    statusStartTime: number = 0;
    additionalStatusMessage: string = '';

    unassignedObjMarkingRefObjs = [];
    tlp_options = [];
    mostStrictTlpOption = null;
    selectedTlpOption = null;
    tlpCounts = [];
    reportTLP = null;
    reportObject = null;

    expandAdvancedDetails = true;
    expandSuccess = false;
    expandFailure = false;
    isPublishing = false;
    expandedSuccesses = new Set<string>();
    expandedFailures = new Set<string>();

    permissions = [];
    initialIngestWritable = false;
    a1Writable = false;
    sandbox = [];
    oneClickPages = ['indicator-type-1', 'indicator-type-2', 'additional-info-3', 'relationship-1', 'object-addition', 'publish-polling'];

    isGroupByTLP = false;
    reviewOptions = ['Bundle', 'JSON', 'Visual', 'Visual (Full Screen)'];
    bundleRefresh = false;

    elem: any;
    fullScreenMode: boolean = false;

    grTypeOptions: any = [
        { key: 'attack-pattern', value: 'Attack Pattern' },
        { key: 'campaign', value: 'Campaign' },
        { key: 'identity', value: 'Identity' },
        { key: 'indicator', value: 'Indicator' },
        { key: 'intrusion-set', value: 'Intrusion Set' },
        { key: 'malware', value: 'Malware' },
        { key: 'observed-data', value: 'Observed Data' },
        { key: 'threat-actor', value: 'Threat Actor' },
        { key: 'threat-report', value: 'Threat Report' },
        { key: 'tool', value: 'Tool' },
        { key: 'vulnerability', value: 'Vulnerability' },
    ];

    reloadAddComponent: boolean = false;
    previousDisableContinue = false;
    addComponentRefreshed = false;

    formIsReadyToAdd: boolean = false;
    showCartGuardDialog: boolean = false;

    discontinue = false;

    how_observables_includes_sco = false;

    publishToCisa: boolean = false;
    publishToCisaAis: boolean = false;

    updatedMenu = false;

    waitForRelationship = false;

    isMenuExpanded = true;

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullscreen(event: KeyboardEvent) {
        setTimeout(() => {
            this.fullScreenMode = !this.fullScreenMode;
            if (this.fullScreenMode) {
                this.stixService.sendData({ type: 'full-screen', value: true });
            } else {
                this.stixService.sendData({ type: 'full-screen', value: false });
                setTimeout(() => {
                    this.menuSelection = 'build-review';
                    this.reviewOption = 'Bundle';

                    const buildReviewEvent = {
                        type: 'page-forward',
                        menuSelection: 'build-review',
                    };
                    this.stixService.sendData(buildReviewEvent);
                }, 30);
            }
        }, 30);
    }

    constructor(
        public modalService: NgbModal,
        public stixService: StixService,
        private httpClient: HttpClient,
        private activatedRoute: ActivatedRoute,
        public guidedService: GuidedService,
        private decider: DeciderServiceService,
        private patternBuilderDialog: MatDialog,
        private envService: EnvService,
        @Inject(DOCUMENT) private document: any
    ) {
        this.createRelationship = null;
        this.createAnotherObject = null;
        this.activePublishTab = 'Automatic';
        this.isAddEnabled = false;
        this.errorMessages = [];
        this.tlpVersion = 'v1';

        this.httpHeaders = new HttpHeaders()
            .set('Accept', '*/*')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

        this.httpHeadersJSON = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);
    }

    ngOnInit(): void {
        this.stixService.objectMarkingReferences = [];
        this.indicatorSelection = null;
        this.objectSelection = null;
        this.objectPropertyTypeSelection = 'required';
        this.relationshipTypeSelection = null;
        this.relationshipSelection = null;
        this.guidedBundle.taxiiServerType = null;

        this.stixObjects = [...STIX_OBJECTS];
        this.getAllIOCs();
        this.setObjects();
        if (this.envService.env.tlpConfig.enabledTlpVersions.length === 1) {
            this.tlpVersion = this.envService.env.tlpConfig.enabledTlpVersions[0].value;
            this.objectMarking.getTlpOptions(this.tlpVersion);
        }

        this.guidedBundle.refreshApiRootsCollections();
        this.guidedBundle.taxiiServerAuthType = 'basic';

        this.stixService.getData().subscribe((data) => {
            if (data.menuSelection) {
                switch (data.menuSelection) {
                    case 'who-individual':
                        this.menuNumber = '13';
                        break;
                    case 'how-event-detection':
                        this.menuNumber = '14';
                        break;
                    case 'how-observable':
                        this.menuNumber = '15';
                        break;
                    case 'how-pattern-builder':
                        this.menuNumber = '16';
                        break;
                    case 'how-ttp':
                        this.menuNumber = '17';
                        break;
                    case 'how-cwe':
                        this.menuNumber = '20';
                        break;
                    case 'what-impact':
                        this.menuNumber = '25';
                        break;
                    case 'where-location':
                        this.menuNumber = '24';
                        break;
                    case 'report-assessment':
                        this.menuNumber = '27';
                        break;
                    case 'build-review':
                        this.menuNumber = '28';
                        break;
                    default:
                        this.menuNumber = null;
                }

                localStorage.setItem('menu-number', this.menuNumber);
            }

            switch (data.type) {
                case 'create-relationship-go-forward':
                    this.selectRelationship('relationship');
                    this.goForward();
                    break;
                case 'create-sighting-go-forward':
                    this.selectRelationship('sighting');
                    this.goForward();
                    break;
                case 'disable-primary-properties':
                case 'enable-primary-properties':
                    this.guidedUIEventHandler({ type: data.type });
                    break;
                case 'toggle-favorite':
                    if (data.value && !data.value.favorite) {
                        this.popupMsgs.push(`Added ${this.stixService.captializeFirstLetter(data.value.key)} to Primary Properties section.`);
                    } else if (data.value && data.value.favorite) {
                        this.popupMsgs.push(`Added ${this.stixService.captializeFirstLetter(data.value.key)} to Common Properties section.`);
                    }
                    setTimeout(() => {
                        this.popupMsgs.shift();
                    }, 4000);
                    break;
                case 'is-add-enabled':
                    this.isAddEnabled = data.value;
                    break;
                case 'edit-object':
                    this.setObjects();
                    this.stixObjects.find((so) => {
                        return so.objects.find((o: any) => {
                            if (data && data.value && o.type === data.value.type) {
                                this.objectSelection = o;
                                return true;
                            }
                            this.objectSelection = {};
                            return false;
                        });
                    });
                    this.objectSelection['objectType'] = data && data.stixObj && data.stixObj.type ? data.stixObj.type : undefined;
                    this.objectSelection['routeName'] = data && data.value && data.value.type ? data.value.type : undefined;
                    this.queryParams = data && data.queryParams ? data.queryParams : undefined;
                    this.menuSelection = data.menuSelection;
                    this.indicatorSelection = 'ioc';
                    break;
                case 'edit-custom-object':
                    this.setObjects();
                    this.customObject = true;
                    this.menuSelection = 'additional-info-1';
                    this.indicatorSelection = 'ioc';
                    break;
                case 'discard-bundle':
                    this.bundleRefresh = true;
                    console.info('/??', JSON.parse(JSON.stringify(this.guidedBundle.bundle)));
                    this.getUnassignedObjects();

                    setTimeout(() => {
                        this.bundleRefresh = false;
                    }, 100);
                    break;
                case 'build-review':
                    setTimeout(() => {
                        this.menuSelection = 'build-review';
                        this.reviewOption = 'Bundle';

                        const buildReviewEvent = {
                            type: 'page-forward',
                            menuSelection: 'build-review',
                        };
                        this.stixService.sendData(buildReviewEvent);
                    }, 500);
                    break;
            }
        });

        this.getTlpOptions({ target: { value: this.tlpVersion } });

        if (
            this.activatedRoute.snapshot.queryParamMap.get('new_version') === 'true' ||
            this.activatedRoute.snapshot.queryParamMap.get('build_review') === 'true'
        ) {
            const buildReviewEvent = {
                type: 'build-review',
                menuSelection: 'build-review',
            };
            this.stixService.sendData(buildReviewEvent);
        }

        this.getUnassignedObjects();

        this.stixService.getSandbox();

        this.elem = document.documentElement;

        this.guidedService.cartDisabled$.subscribe((disabled) => {
            if (this.showCartButtons()) {
                this.formIsReadyToAdd = !disabled;
            }
        });
    }

    redirectCart(event) {
        this.guidedService.editCartObject = event;
        this.menuSelection = event.component;
    }

    guidedUIEventHandler(event) {
        switch (event.type) {
            case 'disable-primary-properties':
                setTimeout(() => {}, 300);
                break;
            case 'enable-primary-properties':
                setTimeout(() => {}, 300);
                break;
        }
    }

    disableDecider(flag) {
        this.disableDeciderTool = flag;
    }

    disablePrimaryProperties() {
        return !this.questionsFavorited.some((q) => (q.required || q.favorite) && !q.readonly);
    }

    combineSCOandMeta() {
        this.stixObjects[1].objects.splice(6, 0, this.stixObjects[3].objects.slice(2)[0]);
        this.stixObjects[1].objects.splice(10, 0, this.stixObjects[3].objects.slice(0)[0]);
        this.stixObjects[1].objects.splice(12, 0, this.stixObjects[3].objects.slice(1)[0]);
    }

    selectMenu(event) {
        if (this.guidedService.cartEditMode) {
            this.confirmDiscardEdit(() => this.selectMenu(event));
            return;
        }

        let changeCurrentPage = true;

        this.queryParams = undefined;
        if (!event.hasOwnProperty('changeCurrentPage') || (event.hasOwnProperty('changeCurrentPage') && event.changeCurrentPage)) {
            this.menuSelection = event?.event ?? event;
        } else {
            changeCurrentPage = false;
        }

        if (this.init !== true) {
            this.stixService.sendData({ type: 'save-menu', menuSelection: this.menuSelection });
        } else {
            this.init = false;
        }

        switch (this.menuSelection) {
            case 'tlp-type':
                setTimeout(() => {
                    this.getUnassignedObjects();
                    this.autoSetTLP();
                }, 300);
                break;
            case 'publish-type-1':
                this.getPermissions();
                break;
            case 'build-review':
                setTimeout(() => {
                    console.info()
                    if (event.event == 'build-review') {
                        this.guidedService.organizeCart();
                        this.guidedService.organizeCategories();
                    }
                    this.reviewOption = 'Bundle';
                }, 100);
                break;
        }

        if (!changeCurrentPage) {
            switch (
                event.event // Set by guided menu onSelectMenu
            ) {
                case 'save-bundle':
                    this.guidedBundle.saveBundleModal(this.saveModal, true);
                    break;
                case 'load-saved-bundle':
                    this.guidedBundle.loadBundle(this.loadModal);
                    break;
                case 'download-bundle':
                    this.guidedBundle.downloadBundle(true);
                    break;
                case 'upload-bundle':
                    this.guidedBundle.uploadFile(this.uploadFile);
                    break;
                case 'reset-bundle':
                    this.guidedBundle.discardBundleHandler();
                    break;
            }
        }
    }

    getAllIOCs() {
        this.allIOCObjects = [...this.stixObjects[0].objects, ...this.stixObjects[1].objects, ...this.stixObjects[3].objects];
        this.allIOCObjects = this.allIOCObjects.sort((a, b) => {
            const nameA = a.displayName.toLowerCase();
            const nameB = b.displayName.toLowerCase();

            if (nameA < nameB) {
                return -1;
            }

            if (nameA > nameB) {
                return 1;
            }

            return 0;
        });
    }

    /**
     * This will open the modal responsible for building stix patterns
     *
     * @param modal modal content sent in from the local variable in the HTML (might want to data bind this to a typescript variable but for now it's good)
     */
    openPatternBuilder(): void {
        const dialogRef = this.patternBuilderDialog.open(PatternBuilderComponent, {
            data: {},
            height: '800px',
            width: `${window.innerWidth}px`,
            maxWidth: '95vw',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.patternBuilderEmitter.emit(result.pattern);
            }
        });
    }

    async openDeciderTool(): Promise<void> {
        let result = await this.decider.openDeciderTool();
        console.info(result);

        this.deciderToolEmitter.emit(result);
    }

    async getImxDeciderCookie(): Promise<string> {
        return new Promise((resolve, reject) => {
            let interval = setInterval(function () {
                let cookie = document.cookie;
                console.info(cookie);

                if (cookie && cookie.indexOf('imx_attack_patterns') !== -1) {
                    let splitCookie = cookie.split('=');
                    let cookieString = splitCookie.join(' ');
                    splitCookie = cookieString.split(' ');

                    for (let i = 0; i < splitCookie.length; i++) {
                        if (splitCookie[i] === 'imx_attack_patterns') {
                            resolve(splitCookie[i + 1]);
                            clearInterval(interval);
                        }
                    }
                }
            }, 200);
        });
    }

    setObjects() {
        this.tabs = [];
        switch (this.indicatorSelection) {
            case 'ioc': {
                const tab1 = {
                    title: 'A - D',
                    objects: this.allIOCObjects.slice(0, 7),
                };
                const tab2 = {
                    title: 'E - G',
                    objects: this.allIOCObjects.slice(7, 12),
                };
                const tab3 = {
                    title: 'I - L',
                    objects: this.allIOCObjects.slice(12, 21),
                };
                const tab4 = {
                    title: 'M - N',
                    objects: this.allIOCObjects.slice(21, 28),
                };
                const tab5 = {
                    title: 'O - T',
                    objects: this.allIOCObjects.slice(28, 35),
                };
                const tab6 = {
                    title: 'U - X',
                    objects: this.allIOCObjects.slice(35),
                };
                this.tabs.push(tab1);
                this.tabs.push(tab2);
                this.tabs.push(tab3);
                this.tabs.push(tab4);
                this.tabs.push(tab5);
                this.tabs.push(tab6);
                this.activeTab = tab1;
                break;
            }
        }
    }

    private confirmDiscardEdit(proceedFn: () => void): void {
        const currentPage = this.menuSelection;
        const modalRef = this.modalService.open(MessageDialogComponent, { centered: true });
        modalRef.componentInstance.messageObj = {
            title: 'Unsaved Changes',
            message: 'You are currently editing an item. Discard your changes and navigate away?',
        };
        const revertSidebar = () => this.stixService.sendData({ type: 'page-forward', menuSelection: currentPage });
        modalRef.result
            .then((resp) => {
                if (resp === 'confirm') {
                    this.guidedService.cartEditMode = false;
                    this.guidedService.editCartObject = {};
                    proceedFn();
                } else {
                    revertSidebar();
                }
            })
            .catch(() => revertSidebar());
    }

    goBack() {
        this.queryParams = undefined;

        switch (this.menuSelection) {
            case 'report-assessment': {
                this.menuSelection = 'what-impact';
                break;
            }
            case 'why-attacker': {
                this.menuSelection = 'where-location';
                break;
            }
            case 'why-common-behaviors': {
                this.menuSelection = 'where-location';
                break;
            }
            case 'where-location': {
                this.menuSelection = 'who-individual';
                break;
            }
            case 'what-impact': {
                this.menuSelection = 'how-cwe';
                break;
            }
            case 'when-event': {
                this.menuSelection = 'how-event';
                break;
            }
            case 'how-event': {
                this.menuSelection = 'how-cwe';
                break;
            }
            case 'how-cwe': {
                this.menuSelection = 'how-ttp';
                break;
            }
            case 'how-ttp': {
                this.menuSelection = 'how-pattern-builder';
                break;
            }
            case 'how-pattern-builder': {
                this.menuSelection = 'how-observable';
                break;
            }
            case 'how-observable': {
                this.menuSelection = 'how-event-detection';
                break;
            }
            case 'how-event-detection': {
                this.menuSelection = 'where-location';
                break;
            }
            case 'who-individual': {
                this.menuSelection = 'indicator-type-1';
                break;
            }
            case 'indicator-type-1': {
                this.menuSelection = 'tlp-type';
                break;
            }
            case 'indicator-type-2': {
                this.menuSelection = 'indicator-type-1';
                break;
            }
            case 'indicator-type-3': {
                this.menuSelection = 'indicator-type-2';
                break;
            }
            case 'additional-info-1': {
                this.menuSelection = 'indicator-type-1';

                if (this.indicatorSelection === 'add-evidence') {
                    this.menuSelection = 'indicator-type-2';
                }
                break;
            }
            case 'additional-info-2': {
                this.menuSelection = 'indicator-type-3';
                break;
            }
            case 'additional-info-3': {
                this.menuSelection = 'indicator-type-1';
                break;
            }
            case 'relationship-1': {
                this.menuSelection = 'indicator-type-1';
                break;
            }
            case 'relationship-2': {
                this.menuSelection = 'relationship-1';
                break;
            }
            case 'relationship-3': {
                this.menuSelection = 'relationship-2';
                break;
            }
            case 'object-addition': {
                if (this.createRelationship) {
                    this.menuSelection = 'relationship-1';
                } else {
                    this.menuSelection = 'indicator-type-1';
                }
                break;
            }
            case 'build-review': {
                this.menuSelection = 'object-addition';
                break;
            }
            case 'tlp-type': {
                this.menuSelection = 'build-review';
                this.reviewOption = 'Bundle';
                break;
            }
            case 'publish-type-1': {
                this.menuSelection = 'build-review';
                this.reviewOption = 'Bundle';
                break;
            }
            case 'publish-type-2': {
                this.getPermissions();
                this.menuSelection = 'publish-type-1';
                this.activePublishTab = 'Automatic';
                this.a1 = '';
                break;
            }
            case 'publish-review': {
                switch (this.activePublishTab) {
                    case 'Manual': {
                        this.menuSelection = 'publish-type-2';
                        break;
                    }
                    case 'Automatic': {
                        this.getPermissions();
                        this.menuSelection = 'publish-type-1';
                        break;
                    }
                }
                break;
            }
            case 'publish-success': {
                this.menuSelection = 'publish-review';
                break;
            }
            case 'how-pattern-builder': {
                this.menuSelection = 'how-observable';
                break;
            }
            case 'how-ttp': {
                this.menuSelection = 'how-pattern-builder';
                break;
            }
            case 'how-cwe': {
                this.menuSelection = 'how-ttp';
                this.disableDeciderTool = true;
                break;
            }
            case 'how-event': {
                this.menuSelection = 'how-cwe';
            }
        }

        const data = {
            type: 'page-back',
            menuSelection: this.menuSelection,
        };
        setTimeout(() => {
            this.guidedService.organizeCart();
            this.guidedService.organizeCategories();
            this.stixService.sendData(data);

            window.scrollTo(0, 0);
        }, 100);
    }

    setAnalyst1Tab() {
        switch (this.activeTabAnalyst1EvidenceType) {
            case 'File':
            case 'Evidence ID':
                this.setAnalystApi('evidence');
                break;
            case 'Search':
                this.setAnalystApi('general');
                break;
        }
    }

    setAnalystApi(type) {
        switch (type.toLowerCase()) {
            case 'general': {
                this.useEvidenceApi = false;
                this.useGeneralApi = true;
                this.useBatchCheckApi = false;
                break;
            }
            case 'batch': {
                this.useEvidenceApi = false;
                this.useGeneralApi = false;
                this.useBatchCheckApi = true;
                break;
            }
            case 'evidence': {
                this.useEvidenceApi = true;
                this.useGeneralApi = false;
                this.useBatchCheckApi = false;
                break;
            }
            default: {
                this.useEvidenceApi = false;
                this.useGeneralApi = false;
                this.useBatchCheckApi = false;
            }
        }
    }

    updateSideMenu() {
        const selectionEvent = {
            type: 'page-forward',
            menuSelection: this.menuSelection,
        };

        if (!this.updatedMenu) {
            this.stixService.sendData(selectionEvent);
            this.updatedMenu = true;
        }

        setTimeout(() => {
            this.updatedMenu = false;
        }, 500);
    }

    cancelEditFromBundle() {
        this.guidedService.cancelEditFromBundle();
        this.menuSelection = 'build-review';
        const selectionEvent = {
            type: 'cancel-update',
            menuSelection: this.menuSelection,
        };
        this.stixService.sendData(selectionEvent);
    }

    async editFromBundle() {
        switch (this.menuSelection) {
            case 'how-event-detection':
                await this.howEventDetection.addComponents();
                break;
            case 'report-assessment':
                this.reportAssessment.addComponents();
                break;
        }

        this.guidedService.editFromBundle();

        this.menuSelection = 'build-review';

        const selectionEvent = {
            type: 'update-object',
            menuSelection: this.menuSelection,
        };
        this.stixService.sendData(selectionEvent);
    }

    triggerAddToCartFromGuard(): void {
        this.guidedService.addItemClicked$.next(false);
        this.showCartGuardDialog = false;
        this.goForward();
    }

    continueWithoutSaving(): void {
        this.formIsReadyToAdd = false;
        this.showCartGuardDialog = false;
        this.goForward();
    }

    goForward() {
        if (this.showCartButtons() && this.formIsReadyToAdd && this.guidedService.currentCartIndex === null) {
            this.showCartGuardDialog = true;
            return;
        }

        this.queryParams = undefined;

        switch (this.menuSelection) {
            case 'who-individual': {
                this.menuSelection = 'where-location';
                break;
            }
            case 'how-event-detection': {
                this.howEventDetection.addComponents();
                this.menuSelection = 'how-observable';
                break;
            }
            case 'how-observable': {
                let bypassScoCheck = false;
                this.how_observables_includes_sco = false;
                if (this.guidedService.cart['how-observable'] && Object.keys(this.guidedService.cart['how-observable']).length > 0) {
                    const how_observables = this.guidedService.cart['how-observable'];
                    for (const observable in how_observables) {
                        if (how_observables[observable].length > 0 && all_schemas.SCOs.includes(how_observables[observable][0].type)) {
                            this.how_observables_includes_sco = true;
                        }
                    }
                } else {
                    bypassScoCheck = true;
                }
                if (this.how_observables_includes_sco || bypassScoCheck) {
                    this.menuSelection = 'how-pattern-builder';
                } else {
                    this.menuSelection = 'how-ttp';
                }
                this.previousDisableContinue = false;
                break;
            }
            case 'how-pattern-builder': {
                this.menuSelection = 'how-ttp';
                this.disableDeciderTool = true;
                break;
            }
            case 'how-ttp': {
                this.menuSelection = 'how-cwe';
                break;
            }
            case 'when-sighting': {
                if (
                    this.whenSighting.startTime ||
                    this.whenSighting.endTime ||
                    this.whenSighting.numObserved ||
                    this.whenSighting.frequency ||
                    this.whenSighting.jitter
                ) {
                }
                this.menuSelection = 'build-review';
                break;
            }
            case 'when-event': {
                this.menuSelection = 'what-impact';
                break;
            }
            case 'how-event': {
                this.menuSelection = 'when-event';
                break;
            }
            case 'how-cwe': {
                this.menuSelection = 'what-impact';
                break;
            }
            case 'report-assessment': {
                this.reportAssessment.addComponents();
                this.menuSelection = 'build-review';
                break;
            }
            case 'why-common-behaviors': {
                this.menuSelection = 'why-attacker';
                break;
            }
            case 'why-attacker': {
                this.menuSelection = 'report-assessment';
                break;
            }
            case 'where-location': {
                this.menuSelection = 'how-event-detection';
                break;
            }
            case 'what-impact': {
                this.menuSelection = 'report-assessment';
                break;
            }
            case 'guided-report-1': {
                this.menuSelection = 'threat-actor-2';
                break;
            }
            case 'threat-actor-2': {
                this.threatActor.addComponent();
                this.menuSelection = 'object-addition';
                break;
            }
            case 'indicator-type-1': {
                if (this.indicatorSelection === 'gr') {
                    this.menuSelection = 'who-individual';

                    this.updateSideMenu();
                    window.scrollTo(0, 0);
                    return;
                }

                this.menuSelection = 'indicator-type-2';
                this.setObjects();
                this.activeTab = this.tabs[0];

                if (this.indicatorSelection === 'add-evidence') {
                    this.setAnalystApi('evidence');
                    this.setAnalyst1Tab();
                    this.analyst1Objects = [];
                    this.loadingStix = false;
                    this.analyst1ObjectsInCart = [];
                    this.addAnalyst1ToBundleType = null;
                    this.activeTabAnalyst1EvidenceType = 'Evidence ID';
                }

                if (this.indicatorSelection === 'ioc') {
                    this.objectSelection = null;
                }

                this.updateSideMenu();

                break;
            }
            case 'indicator-type-2': {
                if (this.indicatorSelection === 'add-evidence') {
                    this.setAnalystApi('evidence');
                    this.setAnalyst1Tab();
                    if (this.activeTabAnalyst1EvidenceType === 'File') {
                        this.evidenceId = this.evidenceIdFromFile;
                    } else {
                        this.evidenceId = this.evidenceIdUserInput;
                    }
                    this.analyst1Objects = [];
                    this.analyst1ObjectsInCart = [];
                    this.addAnalyst1ToBundleType = null;
                    this.getAnalyst1Objects();
                    this.menuSelection = 'indicator-type-3';

                    if (this.activeTabAnalyst1EvidenceType === 'Search') {
                        this.menuSelection = 'additional-info-2';
                    }
                }

                if (this.indicatorSelection === 'ioc') {
                    this.isAddEnabled = false;
                    this.stixService.objectMarkingReferences = [];
                    this.menuSelection = 'additional-info-1';
                }
                break;
            }
            case 'indicator-type-3': {
                this.menuSelection = 'additional-info-2';
                break;
            }
            case 'additional-info-1': {
                const data = {
                    type: 'add-component',
                    value: null,
                    objectSelection: this.objectSelection,
                };
                this.stixService.sendData(data);
                setTimeout(() => {
                    this.menuSelection = 'additional-info-3';
                    this.createRelationship = null;

                    setTimeout(() => {
                        this.getUnassignedObjects();
                    }, 300);
                }, 1000);
                break;
            }
            case 'additional-info-2': {
                if (this.indicatorSelection === 'add-evidence' || this.indicatorSelection === 'add-ioc') {
                    this.activeTabAnalyst1ObjType = 'indicator';
                    this.addToBundle(this.addAnalyst1ToBundleType);
                    this.menuSelection = 'additional-info-3';
                    this.createRelationship = null;

                    setTimeout(() => {
                        this.getUnassignedObjects();
                    }, 300);
                }

                if (this.indicatorSelection === 'add-evidence') {
                    this.stixService.setLocalStorage('hasAnalyst1Evidence', true);
                }
                break;
            }
            case 'additional-info-3': {
                if (this.createRelationship) {
                    this.menuSelection = 'relationship-1';
                } else {
                    this.menuSelection = 'object-addition';
                }
                break;
            }
            case 'relationship-1': {
                this.menuSelection = 'relationship-2';
                break;
            }
            case 'relationship-2': {
                this.waitForRelationship = true;

                const data = {
                    type: 'add-component',
                    value: null,
                };

                this.stixService.sendData(data);
                break;
            }
            case 'object-addition': {
                if (this.createAnotherObject) {
                    this.menuSelection = 'indicator-type-1';
                    this.resetSelection();
                    this.indicatorSelection = 'gr';
                    this.goForward();
                } else {
                    this.menuSelection = 'build-review';
                    this.reviewOption = 'Bundle';
                }
                break;
            }
            case 'build-review': {
                this.getUnassignedObjects();

                if (this.unassignedObjMarkingRefObjs.length > 0) {
                    this.menuSelection = 'tlp-type';
                    this.autoSetTLP();
                } else {
                    this.getPermissions();
                    this.menuSelection = 'publish-type-1';
                }
                break;
            }
            case 'tlp-type': {
                this.getPermissions();
                this.menuSelection = 'publish-type-1';
                this.activePublishTab = 'Automatic';

                this.updateBundleUnassignedTLP();
                this.stixService.objectMarkingReferences = []; // Cleared so won't be used as default TLP for new objects
                break;
            }
            case 'publish-type-1': {
                this.saveConfig();
                this.guidedBundle.selectedCollection = null;
                switch (this.guidedBundle.taxiiServerType) {
                    case 'default': {
                        this.stixService.refreshRootCollections('can_write');
                        this.menuSelection = 'publish-type-2';
                        break;
                    }
                    case 'ais':
                    case 'custom': {
                        this.menuSelection = 'publish-type-2';
                        break;
                    }
                    case 'a1': {
                        this.a1 = 'a1';
                        this.menuSelection = 'publish-review';
                        break;
                    }
                    case 'raw': {
                        this.a1 = 'raw';
                        this.menuSelection = 'publish-review';
                        break;
                    }
                    case 'sandbox':
                    case 'cisa':
                    case 'cisaAis':
                        this.menuSelection = 'publish-review';
                        break;
                    default:
                        this.menuSelection = 'publish-type-2';
                }
                break;
            }
            case 'publish-type-2': {
                this.menuSelection = 'publish-review';
                if (this.coll != null) {
                    this.guidedBundle.selectedCollection = this.coll;
                }
                break;
            }
            case 'publish-review': {
                this.isPublishing = true;
                this.createAnotherObject = null;
                this.guidedBundle.taxiiServerUrl = '';
                this.publishStatus = 'error';
                this.publishFeedback = {};
                this.statusStartTime = 0;
                this.expandedSuccesses.clear();
                this.expandedFailures.clear();
                this.additionalStatusMessage = '';
                this.guidedBundle.selectedCollection = this.guidedBundle.selectedCollection;
                this.guidedBundle.taxiiServerBaseUrl = this.guidedBundle.taxiiServer.url.replace(
                    `${this.envService.env.taxiiServer.apiVersion}/taxii2/`,
                    `${this.envService.env.taxiiServer.apiVersion}/`
                );

                if (this.guidedBundle.taxiiServerType === 'sandbox' || this.guidedBundle.taxiiServerType === 'cisa') {
                    this.a1 = '';
                }

                if (this.a1 != '') {
                    this.guidedBundle.publishBundle(false, this.a1);
                } else {
                    this.guidedBundle.publishBundle(false);
                }

                this.menuSelection = 'publish-success';
                this.updateSideMenu();

                this.subscription = this.stixService.getData().subscribe((data) => {
                    if (data.type === 'publish-error') {
                        this.isPublishing = false;
                        this.guidedBundle.removeAnnouncement();
                        if (data.failures && data.failures.length > 0) {
                            const errMsg = 'Publication Unsuccessful: ' + data.failures[0].message;
                            if (!this.errorMessages.some((msg) => msg === errMsg)) {
                                this.errorMessages.push('Publication Unsuccessful: ' + data.failures[0].message);
                            }
                            setTimeout(() => {
                                this.errorMessages = [];
                            }, 8000);
                        } else {
                            this.isPublishing = false;
                            this.publishStatus = 'error';
                            this.publishFeedback = data.err;
                            this.menuSelection = 'publish-success';
                        }
                    }

                    if (data.type === 'publish-success') {
                        this.guidedBundle.removeAnnouncement();
                        if (this.guidedBundle.taxiiServerUrl.length > 0) {
                            this.getPublishStatus(this.guidedBundle.taxiiServerUrl);
                        }
                    }
                });

                // Goes to polling page if it is taking too long for result
                setTimeout(function () {
                    if (this.menuSelection != 'publish-success') {
                        this.menuSelection = 'publish-polling';
                    }
                }, 2000);
                break;
            }
            case 'publish-success': {
                if (this.createAnotherObject) {
                    if (this.stixService.objectMarkingReferences.length > 0) {
                        this.menuSelection = 'indicator-type-1';
                    } else {
                        this.menuSelection = 'indicator-type-1';
                    }
                }
                break;
            }
        }
        const data = {
            type: 'page-forward',
            menuSelection: this.menuSelection,
        };

        setTimeout(() => {
            this.guidedService.organizeCart();
            this.guidedService.organizeCategories();
            this.stixService.sendData(data);

            this.createAnotherObject = null;

            window.scrollTo(0, 0);
        }, 100);
    }

    disableBasedOnEvent(event) {
        if (event !== null) {
            this.previousDisableContinue = event;
            return event;
        }
        return this.previousDisableContinue;
    }

    onHome() {
        this.menuSelection = 'who-individual';
        this.goBack();
    }

    disableContinue(event = null) {
        if (event !== null) {
            this.previousDisableContinue = event;
        }
        switch (this.menuSelection) {
            case 'who-individual':
            case 'when-sighting':
            case 'report-assessment':
            case 'why-common-behaviors':
            case 'why-attacker':
            case 'how-event':
            case 'what-impact': {
                return false; // don't disable to allow user to skip this step
            }
            case 'when-event': {
                return this.guidedService.eventDetails.length !== 0;
            }
            case 'how-ttp':
            case 'how-cwe':
            case 'how-event-detection': {
                return this.disableBasedOnEvent(event);
            }
            case 'how-pattern-builder':
            case 'how-observable':
            case 'where-location': {
                return this.disableBasedOnEvent(event);
            }
            case 'threat-actor-2':
            case 'guided-report-1': {
                return false;
            }
            case 'tlp-type': {
                return false;
            }
            case 'indicator-type-1': {
                return !this.indicatorSelection;
            }
            case 'indicator-type-2': {
                if (this.indicatorSelection !== 'add-evidence') {
                    return !this.objectSelection;
                } else {
                    if (this.activeTabAnalyst1EvidenceType === 'File') {
                        return !this.evidenceIdFromFile;
                    }
                    return !this.evidenceIdUserInput;
                }
            }
            case 'additional-info-1': {
                return !this.isAddEnabled;
            }
            case 'additional-info-2': {
                if (this.indicatorSelection === 'add-evidence' || this.indicatorSelection === 'add-ioc') {
                    return this.addAnalyst1ToBundleType === null;
                }
                return this.createRelationship === null;
            }
            case 'additional-info-3': {
                return this.createRelationship === null;
            }
            case 'relationship-1': {
                return true;
            }
            case 'relationship-2': {
                return !this.isAddEnabled;
            }
            case 'relationship-3': {
                return !this.isAddEnabled;
            }
            case 'object-addition': {
                return this.createAnotherObject === null;
            }
            case 'build-review': {
                return false;
            }
            case 'publish-type-1': {
                return !this.guidedBundle.taxiiServerType;
            }
            case 'publish-type-2': {
                return !this.selectedRootAndCollection();
            }
            case 'publish-review': {
                return false;
            }
            case 'publish-success': {
                return !this.createAnotherObject;
            }
            default:
                return true;
        }
    }

    onRelationshipAdded() {
        if (!this.waitForRelationship) {
            return;
        }

        this.waitForRelationship = false;
        this.menuSelection = 'object-addition';
        setTimeout(() => {
            this.getUnassignedObjects();
        }, 300);
    }

    showContinue() {
        if (this.oneClickPages.find((p) => p === this.menuSelection)) {
            if (this.indicatorSelection === 'add-evidence' && this.menuSelection === 'indicator-type-2' && !this.showContinueAnalyst1()) {
                return true;
            }
            return false;
        }
        if (this.showContinueAnalyst1()) {
            return false;
        }
        return true;
    }

    showCartButtons(): boolean {
        const cartPages = [
            'who-individual',
            'how-event-detection',
            'how-pattern-builder',
            'how-observable',
            'how-ttp',
            'how-event',
            'how-cwe',
            'when-event',
            'where-location',
            'what-impact',
            'why-attacker',
            'why-common-behaviors',
        ];
        return cartPages.includes(this.menuSelection);
    }

    showHome() {
        if (this.oneClickPages.find((p) => p === this.menuSelection)) {
            if (this.indicatorSelection === 'add-evidence' && this.menuSelection === 'indicator-type-2' && !this.showContinueAnalyst1()) {
                return true;
            }

            if (this.menuSelection === 'relationship-1' || this.menuSelection === 'object-addition' || this.menuSelection === 'indicator-type-2') {
                return true;
            }
            return false;
        }
        if (this.showContinueAnalyst1()) {
            return false;
        }
        return true;
    }

    showContinueAnalyst1() {
        if (
            (this.menuSelection === 'indicator-type-3' && (this.indicatorSelection === 'add-evidence' || this.indicatorSelection === 'add-ioc')) ||
            (this.menuSelection === 'indicator-type-2' &&
                this.indicatorSelection === 'add-evidence' &&
                this.activeTabAnalyst1EvidenceType === 'Search')
        ) {
            return true;
        }
        return false;
    }

    checkSelectedTLP(type) {
        const tlpObj = this.objectMarking.tlp_options.find((x) => x.key === type);
        return this.stixService.objectMarkingReferences.find((x) => x === tlpObj.value);
    }

    selectTLP(tlp) {
        const tlpSelected = this.checkSelectedTLP(tlp);
        if (tlpSelected) {
            this.onPageMsgs = [];
            this.objectMarking.deleteOmr(tlpSelected, this.menuSelection === 'tlp-type');
        } else {
            const strictIndex =
                this.mostStrictTlpOption === null
                    ? 0
                    : this.objectMarking.tlp_options.findIndex((opt) => opt.value === this.mostStrictTlpOption.value);
            const currentTlpIndex = this.objectMarking.tlp_options.findIndex((opt) => opt.key === tlp);

            if (currentTlpIndex < strictIndex) {
                this.modalRef = this.modalService.open(MessageDialogComponent);
                const messageData = {
                    title: 'TLP Selection Confirmation',
                    message: `Please confirm you would like to select a less restrictive TLP than the most restrictive ${this.objectMarking.tlp_options[strictIndex].key} in this bundle.`,
                };
                this.modalRef.componentInstance.messageObj = messageData;

                this.modalRef.result.then((resp) => {
                    switch (resp) {
                        case 'confirm': {
                            this.setTLP(tlp);
                            this.selectedTlpOption = this.objectMarking.tlp_options[currentTlpIndex];
                            break;
                        }
                        case 'cancel': {
                            break;
                        }
                    }
                });
            } else {
                this.selectedTlpOption = this.objectMarking.tlp_options[currentTlpIndex];
                this.setTLP(tlp);
            }
        }
    }

    getTlpOptions(event) {
        this.objectMarking.getTlpOptions(event);
    }

    selectIndicatorType(indicatorType) {
        this.indicatorSelection = indicatorType;
        this.setObjects();

        if (this.indicatorSelection === 'add-evidence' || this.indicatorSelection === 'add-ioc') {
            this.useEvidenceApi = true;
            this.useBatchCheckApi = false;
            this.useGeneralApi = false;
        }
    }

    selectObject(object) {
        this.objectSelection = object;
    }

    selectObjectPropertyType(type) {
        this.objectPropertyTypeSelection = type;
    }

    selectRelationshipType(type) {
        this.relationshipTypeSelection = type;
    }

    selectRelationship(relationship) {
        this.relationshipSelection = relationship;

        if (this.relationshipSelection === 'relationship') {
            this.selectObject(this.stixObjects[2].objects.slice(0, 1)[0]);
            this.relationshipTabs = ['Source Reference', 'Target Reference', 'Relationship Type'];
            this.activeTabRelationship = 'Source Reference';
        }

        if (this.relationshipSelection === 'sighting') {
            this.selectObject(this.stixObjects[2].objects.slice(1, 2)[0]);
            this.relationshipTabs = ['Reference Type'];
            this.activeTabRelationship = 'Reference Type';
        }
    }

    selectPublishType(type) {
        this.publishToCisa = type === 'cisa';
        this.publishToCisaAis = type === 'cisaAis';
        this.guidedBundle.serverSettingsChanged(type);
    }

    displayObjectTitle() {
        const stixObject = this.stixObjectsOriginal.find((o) => o.type === this.objectSelection.objectType);
        if (stixObject) {
            return this.objectSelection.displayName + ' - ' + stixObject.displayName;
        }
        return '';
    }

    showAssistance() {
        let messageData = { title: 'Help', messages: [], textOnlyIndex: [], menu: '' };
        this.modalRef = this.modalService.open(HelpDialogComponent, { size: 'xl' });
        messageData.menu = this.menuSelection;

        switch (this.menuSelection) {
            case 'tlp-type': {
                messageData.messages = [
                    'The TLP marking type specifies how to represent Traffic Light Protocol (TLP) markings in a definition property. TLP designations ensure appropriate sharing of sensitive information.',
                    '<br>',
                    'TLP designations are highly recommended for new objects. A TLP designation have already been assigned based on the highest TLP designation in your bundle. You may deselect this TLP designation if this object meets a different disclosure status. The TLP designation chosen here will only apply to objects currently without a TLP.',
                    "<strong>TLP:CLEAR</strong> (Unrestricted): Share worldwide without limitations. Use when there's minimal or no risk of misuse, following public release rules. Standard copyright rules apply; share without restrictions.",
                    "<strong>TLP:GREEN</strong> (Community Sharing): Share within your community for increased awareness. Use when information benefits your broader community. Share with peers and partner organizations in your community, avoiding public channels. Do not share outside the community; 'community' refers to the cybersecurity/cyber defense community if not specified.",
                    '<strong>TLP:AMBER</strong> (Limited Disclosure): Share on a need-to-know basis within your organization and its clients. Note that <strong>TLP:AMBER+STRICT</strong> restricts sharing to the organization only. Used when information needs support but risks privacy, reputation, or operations if shared outside. Share with your organization and clients as necessary to protect them and prevent harm. Specify <strong>TLP:AMBER+STRICT</strong> to limit sharing to the organization exclusively.',
                    // "TLP:RED (High Sensitivity): Limited to individual recipients, no sharing. Used when disclosing would jeopardize privacy, reputation, or operations. Not to be shared beyond those present in a meeting, for instance.",
                ];
                messageData.textOnlyIndex = [0, 1, 2];
                break;
            }
            case 'indicator-type-1': {
                messageData.messages = [
                    'Create CTI Object: Add STIX Domain Objects, Cyber Observable Objects, and Meta Objects.',
                    'Analyst1: Upload evidence file to allow analyst to search for IOCs, retrieve previously uploaded evidence using an evidence ID, or search Analyst1 for previously saved indicator objects.',
                ];
                break;
            }
            case 'indicator-type-2': {
                switch (this.indicatorSelection) {
                    case 'cyber-event':
                        messageData.messages = this.cyberEventHelpText();
                        messageData.textOnlyIndex = [19];
                        messageData.messages = messageData.messages.concat([
                            'Search commands:',
                            'Enter: Search forward',
                            'Shift + Enter: Search in reverse',
                        ]);
                        break;
                    case 'ioc':
                        messageData.messages = this.iocHelpText();
                        messageData.textOnlyIndex = [18];
                        messageData.messages = messageData.messages.concat([
                            'Search commands:',
                            'Enter: Search forward',
                            'Shift + Enter: Search in reverse',
                        ]);
                        break;
                    case 'add-evidence':
                        messageData.messages = [
                            'Evidence ID: Enter previously added evidence using the evidence ID.',
                            'File: Import new evidence into Analyst1 by uploading files and allowing Analyst1 to search them for indicators.',
                            'Search: Import previously added indicators based on search criteria',
                        ];
                        break;
                }
                break;
            }
            case 'additional-info-1': {
                switch (this.indicatorSelection) {
                    case 'cyber-event':
                    case 'ioc':
                        messageData.messages = [
                            'Primary properties are items marked as favorites, marking references, and required properties if any exist.',
                            'Common properties are items that add contextual data to an object.',
                            'Read-only properties are attributes that are automatically assigned by IMX during object creation.',
                        ];
                        break;
                    case 'add-evidence':
                        messageData.messages = ['Add indicators and then proceed to retrieve their details.'];
                        break;
                    case 'add-ioc':
                        messageData.messages = [
                            'Perform a free text search to locate indicators previously saved to Analyst1. Next, add these indicators to retrieve their details.',
                        ];
                        break;
                }
                break;
            }
            case 'additional-info-2': {
                switch (this.indicatorSelection) {
                    case 'add-evidence':
                    case 'add-ioc':
                        messageData.messages = [
                            'Indicators can be added to a bundle in ”indicator” or ”parsed” formats.',
                            'Indicators are raw imports from Analyst1.',
                            'Parsed are indicators that have been automatically converted to STIX objects by IMX. See the IMX user’s manual for more details.',
                        ];
                        messageData.textOnlyIndex = [0];
                        break;
                }
                break;
            }
            case 'additional-info-3': {
                messageData.messages = [
                    "Choosing 'No' will enable you to add more objects to your STIX envelope. ",
                    "Choosing 'Yes' will allow you to create a STIX Relationship or Sighting object.",
                ];
                break;
            }
            case 'relationship-1': {
                messageData.messages = [
                    "Once you've successfully crafted a STIX Object, you can choose to establish a connection with another recently generated STIX Object.",
                    'The Relationship object serves to associate two SDOs (Cyber Events) or SCOs (IOCs) and outline their connection. In the context of a graph, where SDOs and SCOs are akin to nodes or vertices, Relationship Objects (SROs) act as edges that illustrate the relationships.',
                    'Relationship - The Relationship object is used to link together two SDOs or SCOs in order to describe how they are related to each other. If SDOs and SCOs are considered "nodes" or "vertices" in the graph, the Relationship Objects (SROs) represent "edges".',
                    'Sighting - A Sighting denotes the belief that something in CTI (e.g., an indicator, malware, tool, threat actor, etc.) was seen. Sightings are used to track who and what are being targeted, how attacks are carried out, and to track trends in attack behavior.',
                ];
                break;
            }
            case 'relationship-2': {
                switch (this.objectSelection.type) {
                    case 'relationship':
                        messageData.messages = [
                            'Source Object - The id of the source (from) object. The value MUST be an ID reference to an SDO or SCO (i.e., it cannot point to an SRO, Bundle, Language Content, or Marking Definition).',
                            'Target Object –  The id of the target (to) object. The value MUST be an ID reference to an SDO or SCO (i.e., it cannot point to an SRO, Bundle, Language Content, or Marking Definition).',
                            'Relationship Type - The name used to identify the type of Relationship. This value SHOULD be an exact value listed in the relationships for the source and target SDO, but MAY be any string. The value of this property MUST be in ASCII and is limited to characters a–z (lowercase ASCII), 0–9, and hyphen (-).',
                        ];
                        break;
                    case 'sighting':
                        messageData.messages = [
                            'Sighting of Ref - The id of the reference object. The value MUST be an ID reference to an SDO or SCO (i.e., it cannot point to an SRO, Bundle, Language Content, or Marking Definition).',
                        ];
                        break;
                }
                break;
            }
            case 'object-addition': {
                messageData.messages = [
                    'Selecting “No” will move you forward to the review of your STIX envelope and publishing to the TAXII Server of your choice.',
                    'Selecting “Yes” will take you to the beginning of the STIX Object creation process with the selecting of a default TLP(if not already), STIX Type, Object Type, and Additional Info.',
                ];
                break;
            }
            case 'build-review': {
                messageData.messages = [
                    'Review STIX Envelope: Double-check your STIX envelope to confirm the presence of all STIX objects and Relationships.',
                    'Bundle: This choice presents all STIX objects in your envelope with option to edit and/or delete objects.',
                    'JSON: This viewing option will display your STIX envelope in JSON open standard file format.',
                    'Visual: This choice presents your STIX envelope in a network visual diagram. Cyber Event and IOCs objects are depicted as nodes, while Relationship objects form the edges.',
                ];
                messageData.textOnlyIndex = [0];
                break;
            }
            case 'publish-type-1': {
                messageData.messages = [
                    'Automatic',
                    'Collaboration: Publish new CTI and collaborate on existing CTI.',
                    'Analyst1: Publish CTI to Analyst1.',
                    'Testing: Publish CTI to Testing collection.',
                    'Manual',
                    'IMX TAXII Server: Our pre-configured IMX TAXII Server with pre-filled API Roots and Collections. Users select where to publish within the available options on our IMX TAXII Server.',
                    'Custom TAXII Server: For this option, users provide their TAXII Server Authentication.',
                    'AIS Server: Publish to AIS.',
                ];
                messageData.textOnlyIndex = [0, 4];
                break;
            }
            case 'publish-type-2': {
                if (this.taxiiServerType === 'custom') {
                    messageData.messages = ['The full TAXII server URL and username and password are required for access to a custom TAXII server.'];
                } else {
                    messageData.messages = ['Both API Root and Collection are required to proceed.'];
                    messageData.textOnlyIndex = [0, 2];
                }
                break;
            }
            case 'publish-review': {
                messageData.messages = [
                    'Double-check your TAXII Server details to confirm that your STIX envelope is being published to the accurate TAXII Server, API Root, and Collection.',
                ];
                break;
            }
            case 'publish-success': {
                messageData.messages = [
                    'Publish Status Details: View entire publish status.',
                    'Published: Successfully published objects.',
                    'Unpublished: Unsuccessfully published objects.',
                    'New Bundle: Start at beginning to create another bundle. Can choose to discard existing.',
                ];
                break;
            }
            default: {
                messageData.messages = [];
            }
        }

        this.modalRef.componentInstance.messageObj = messageData;
        this.modalRef.componentInstance.buttonsToShow = ['ok'];
    }

    resetRootCollectionSelection() {
        this.guidedBundle.taxiiServer.apiRoot = '';
        this.guidedBundle.taxiiServer.childRoot = '';
        this.guidedBundle.taxiiServer.availableCollections = [];
        this.guidedBundle.selectedCollection = null;
        this.guidedBundle.APIRoots = [];
    }

    selectApiRoot(apiRoot) {
        if (apiRoot['api-root']) {
            apiRoot = this.stixService.apiRoots2[this.stixService.apiRoots2.findIndex((r) => r['apiPath'] === apiRoot['api-root'])];
        }

        this.guidedBundle.selectedAPIRoot = apiRoot.apiPath;
        this.guidedBundle.selectedCollection = null;
        this.guidedBundle.taxiiServer.apiRoot = apiRoot?.title;
        this.guidedBundle.taxiiServer.childRoot = apiRoot?.childRoot;
        this.guidedBundle.taxiiServer.availableCollections = apiRoot?.collections;
        this.guidedBundle.selectedCollection = '';

        if (this.guidedBundle.taxiiServer.availableCollections.length === 1) {
            this.guidedBundle.selectedCollection = this.guidedBundle.taxiiServer.availableCollections[0];
        } else {
            this.guidedBundle.selectedCollection = null;
        }
    }

    selectCollection(event) {
        this.guidedBundle.selectedCollection = JSON.parse(event.target.value);
    }

    serverTypeReview() {
        switch (this.guidedBundle.taxiiServerType) {
            case 'default':
            case 'sandbox':
            case 'a1':
            case 'raw':
            case 'cisa': {
                return 'IMX TAXII Server (Default)';
            }
            case 'cisaAis': {
                return 'AIS TAXII Server';
            }
            case 'custom': {
                return 'Custom TAXII Server';
            }
            default: {
                return 'IMX TAXII Server (Default)';
            }
        }
    }

    clearSearch() {
        this.searchResults = '';
        this.searchText = '';
        this.searchMatches = [];
        this.prevSearch = '';
        this.setObjects();
        this.tabs.forEach((t) => {
            t.objects.forEach((o) => {
                o['match'] = false;
            });
        });
    }

    clearSearchResults() {
        this.searchResults = '';
    }

    search(type) {
        if (this.searchText === '') return;

        if (this.prevSearch === this.searchText) {
            if (type === 'enter') {
                this.searchIndex++;
            } else {
                this.searchIndex--;
            }

            if (this.searchIndex > this.searchMatches.length - 1) {
                this.searchIndex = 0;
            } else if (this.searchIndex < 0) {
                this.searchIndex = this.searchMatches.length - 1;
            }

            this.activeTab = this.searchMatches[this.searchIndex].tab;
        } else {
            this.prevSearch = this.searchText;
            this.searchIndex = 0;
            this.searchResults = '';
            this.searchMatches = [];
            let tempSearch = this.searchText.toLowerCase();

            this.tabs.forEach((t) => {
                t.objects.forEach((o, index) => {
                    const match = o.displayName.toLowerCase().includes(tempSearch);
                    o['match'] = match;
                    if (match) {
                        this.searchMatches.push({ tab: t, objIndex: index });
                    }
                });
            });

            this.activeTab = this.searchMatches[this.searchIndex].tab;
        }

        this.searchResults = `${this.searchIndex + 1} of ${this.searchMatches.length}`;
    }

    selectedRootAndCollection() {
        return (
            this.guidedBundle?.taxiiServer?.apiRoot &&
            (this.guidedBundle?.selectedCollection || (this.guidedBundle?.taxiiServerType == 'custom' && this.coll != null))
        );
    }

    checkRootAndCollectionSelected() {
        const data = {
            type: 'is-root-collection-selected',
            value: this.selectedRootAndCollection(),
        };
        this.stixService.sendData(data);
    }

    // ANALYST1 methods
    handleFileInput(event: any) {
        this.evidenceSubmissions = [];
        this.evidenceUploadClicked = false;
        this.evidenceIdFromFile = null;
        const files = event.files;
        for (let i = 0; i < this.evidenceSubmissions.length; i++) {
            if (files[i].name == this.evidenceSubmissions[i].filename) {
                let r = confirm('The filename exists, do you want to replace? Press OK to replace. Please make sure to resubmit to save. ');
                if (r == true) {
                    this.evidenceSubmissions[i].file = files[i];
                    return;
                } else {
                    return;
                }
            }
        }

        this.evidenceSubmissions.unshift({ file: files[0] });
    }

    getUploadStatus() {
        if (this.evidenceUploadResponse && this.evidenceUploadResponse.body && this.evidenceUploadResponse.body.id) {
            return 'Completed';
        }
        return 'Processing';
    }

    uploadEvidence() {
        this.evidenceUploadResponse = null;
        this.evidenceIdFromFile = null;
        this.evidenceUploadClicked = true;
        this.formData = new FormData();
        this.formData.append('evidenceFile', this.evidenceSubmissions[0].file, '@' + this.evidenceSubmissions[0].file.name);
        this.formData.append('evidenceFileClassification', '');
        this.formData.append('tlp', 'CLEAR');

        let url = this.envService.env.taxiiServer.url + 'A1/evidence';
        const upload$ = this.httpClient.post<any>(url, this.formData, { headers: this.httpHeaders, observe: 'response' });

        upload$.subscribe((result: any) => {
            console.info(JSON.stringify(result));
            if (result && result.body && result.body.uuid) {
                this.evidenceUploadTimerId = setInterval(() => {
                    url = this.envService.env.taxiiServer.url + 'A1/evidence/uploadStatus/' + result.body.uuid;
                    this.httpClient.get<any>(url, { headers: this.httpHeaders, observe: 'response' }).subscribe((r: any) => {
                        if (r && r.body && r.body.id) {
                            console.info(r.body.id);
                            this.evidenceUploadResponse = r;

                            if (this.evidenceUploadResponse.body && this.evidenceUploadResponse.body.id) {
                                this.evidenceIdFromFile = this.evidenceUploadResponse.body.id;
                                clearInterval(this.evidenceUploadTimerId);
                            }
                        }
                    });
                }, 2000);
            }
        });
    }

    showEvidenceFileName() {
        if (this.evidenceSubmissions.length > 0 && this.evidenceSubmissions[0].file.name.length > 20) {
            return this.evidenceSubmissions[0].file.name.slice(0, 20) + '...';
        }
        return this.evidenceSubmissions[0].file.name;
    }

    getEvidenceIdPosition() {
        if (this.evidenceSubmissions.length > 0 && this.evidenceSubmissions[0].file.name.length > 20) {
            return '-70px';
        }
        return '-20px';
    }

    getAnalyst1Objects() {
        let url = null;
        this.loadingStix = true;
        this.addingStixToPending = true;
        this.loadingStixNext = false;
        this.analyst1Objects = [];

        // Indicator API
        if (this.useGeneralApi) {
            url = this.taxiiServer.url + 'A1/indicator/?searchTerm=*' + this.searchTextAnalyst1 + '*&indicatorValueOnlySearch=true&pageSize=30';
        }

        // Batch check API
        if (this.useBatchCheckApi) {
            url = this.taxiiServer.url + 'A1/batchCheck?values=' + this.searchTextAnalyst1;
        }

        if (this.useEvidenceApi) {
            url = this.taxiiServer.url + 'A1/evidence/' + this.evidenceId + '/indicator?pageSize=30';
        }

        this.analyst1ObjectsObservable = this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe((resp: any) => {
            console.info('Server response: ', resp);
            this.addingStixToPending = false;

            if (resp && resp.results) {
                this.analyst1Objects = resp && resp.results ? resp.results : [];
                this.analyst1Objects.forEach((o) => {
                    o['checked'] = false;
                });

                if (this.useGeneralApi || this.useEvidenceApi) {
                    this.analyst1currentPage = resp.page;
                    this.analyst1TotalPages = resp.totalPages;
                }

                if (this.useBatchCheckApi) {
                    this.analyst1Objects = this.analyst1Objects.filter((o) => {
                        if (o.id && o.entity && o.entity.title.toLowerCase() !== 'ignored indicator') {
                            return true;
                        }
                        return false;
                    });
                }
            }

            this.loadingStix = false;
        });
    }

    checkAllAnalyst1Objects(event) {
        this.analyst1Objects.forEach((o) => {
            o.checked = event.target.checked;
        });
    }

    viewDetail() {
        let objectReqs = [];
        this.pendingObjects = [];
        this.pendingStixObjects = [];
        this.objectIdMapping = [];

        this.addingStixToPending = true;
        const checkedAnalyst1Objects = this.analyst1ObjectsInCart
            .filter((o) => o.checked)
            .forEach((o) => {
                let url = this.taxiiServer.url + 'A1/indicator/' + o.id + '/stix/?stixVersion=v2_1';
                objectReqs.push(this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }));
                this.objectIdMapping.push({ id: o.id });
            });

        forkJoin(objectReqs).subscribe(
            (resp: any) => {
                let respNum = 0;
                if (resp.length > 0) {
                    resp.forEach((r, index) => {
                        respNum++;
                        if (respNum === resp.length) {
                            this.addingStixToPending = false;
                            this.step = 1;
                        }
                        r.objects.forEach((o) => {
                            if (this.pendingObjects.findIndex((po) => o.id === po.id) === -1) {
                                if (o.type !== 'marking-definition') {
                                    this.pendingObjects.push(o);
                                    this.objectIdMapping[index]['stixId'] = o.id;
                                }
                            }
                        });

                        this.convertToStixObject();
                    });
                }
            },
            (err: any) => {
                console.error(err, 'Error requesting individual Analyst1 object.');
            }
        );
    }

    updateAnalyst1Checked(object) {
        object.checked = !object.checked;
    }

    showNextAnalyst1Page() {
        return this.analyst1currentPage < this.analyst1TotalPages;
    }

    getNextAnalyst1Page() {
        let url = null;

        this.loadingStixNext = true;
        if (this.useGeneralApi) {
            url =
                this.taxiiServer.url + 'A1/indicator/?searchTerm=' + this.searchTextAnalyst1 + '*&pageSize=30&page=' + (this.analyst1currentPage + 1);
        }

        if (this.useEvidenceApi) {
            url = this.taxiiServer.url + 'A1/evidence/' + this.evidenceId + '/indicator?pageSize=30&page=' + (this.analyst1currentPage + 1);
        }

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

    convertToStixObject() {
        let v = new Validator();

        let tempStixObjects = [];

        this.pendingObjects.forEach((po) => {
            if (po.pattern) {
                if (po.pattern[0] === '[') {
                    po.pattern = po.pattern.substring(1, po.pattern.length - 1);
                }
                let tempObj = {};
                let patterns = po.pattern.split('=');
                let property = patterns[0].trim();
                let value = patterns[1].trim();
                if (value[0] === "'") {
                    value = value.substring(1, value.length - 1);
                }

                let properties = property.split(':');
                let type = properties[0].trim();
                let attributeName = properties[1].trim();

                // If attribute is not alphabet, push original object.
                if (!/^[a-zA-Z]+$/.test(attributeName)) {
                    return;
                }

                tempObj['id'] = type + '--' + po.id.split('--')[1];
                tempObj['spec_version'] = po.spec_version;
                tempObj['type'] = type;
                tempObj[attributeName] = value;

                tempStixObjects.push(tempObj);
            }

            if (po.type === 'marking-definition') {
                tempStixObjects.push(po);
            }
        });

        for (let obj of tempStixObjects) {
            let report = { errors: [] };
            // Validation to be added here
            report = validateStix(obj);
            console.info(report);

            if (report.errors.length == 0 && this.pendingStixObjects.findIndex((po) => po.id === obj.id) === -1) {
                this.pendingStixObjects.push(obj);
            }
        }
    }

    enableReview() {
        return this.analyst1ObjectsInCart.length > 0;
    }

    enableAddToCart() {
        return this.analyst1Objects.some((o) => o.checked);
    }

    addToCart() {
        const newObjs = JSON.parse(JSON.stringify(this.analyst1Objects.filter((o) => o.checked)));

        newObjs.forEach((o) => {
            if (!this.analyst1ObjectsInCart.some((objCart) => objCart.id === o.id)) {
                this.analyst1ObjectsInCart.push(o);
            }
        });
    }

    clearSearchAnalyst1() {
        this.searchTextAnalyst1 = '';
    }

    getJsonDisplayForComponent(component): any {
        let copy = Object.assign({}, component); // Create a copy for displaying purposes

        if (copy.contents && typeof copy.contents === 'object' && copy.contents.length > 0) {
            let contentsString = '';

            for (let i = 0; i < copy.contents.length; i++) {
                let newContent = new Content();
                newContent.lang = copy.contents[i].lang;
                newContent.fields = copy.contents[i].fields;
                newContent.fieldName = copy.contents[i].fieldName;
                contentsString += '{' + newContent.toString() + '},';
            }

            contentsString = contentsString.slice(0, -1); // Remove the last comma
            copy.contents = JSON.parse(`[ ${contentsString} ]`);
        }

        return copy;
    }

    removeObject(objId) {
        const objects = this.activeTabAnalyst1ObjType === 'indicator' ? this.pendingObjects : this.pendingStixObjects;
        const index = objects.findIndex((o) => o.id === objId);
        if (index >= 0) {
            objects.splice(index, 1);
        }

        const obj = this.objectIdMapping.find((o) => o.stixId === objId);
        if (obj) {
            const objIndex = this.analyst1ObjectsInCart.findIndex((o) => o.id === obj.id);
            if (objIndex >= 0) {
                this.analyst1ObjectsInCart.splice(objIndex, 1);
            }
        }
    }

    changeShow(objIndex, rowIndex): void {
        if (objIndex == this.objnumber && rowIndex == this.rownumber) {
            this.rownumber = -1;
        } else {
            this.objnumber = objIndex;
            this.rownumber = rowIndex;
        }
    }

    getCustomObjectHeading(component: any): string {
        return component['type'] + ' (' + component['id'] + ')';
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
                    if (component.payload_bin) {
                        if (component.hashes) {
                            const keys = Object.keys(component.hashes);
                            componentDisplay = component.hashes[keys[0]];
                        } else componentDisplay = component.id;
                    } else componentDisplay = component.url;
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
                        let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.source_ref);
                        let targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
                        let sourceDisplay = sourceRefObject.length > 0 ? this.getComponentDisplay(sourceRefObject[0]) : component.source_ref;
                        let targetDisplay = targetRefObject.length > 0 ? this.getComponentDisplay(targetRefObject[0]) : component.target_ref;
                        let relationship_type = component.relationship_type;
                        componentDisplay = `${sourceDisplay} ${relationship_type} ${targetDisplay}`;
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

    selectAddToBundleType(type) {
        this.addAnalyst1ToBundleType = type;
    }

    showAddAnalyst1Type() {
        switch (this.addAnalyst1ToBundleType) {
            case 'indicator':
                return 'Add Indicator Only';
                break;
            case 'parsed':
                return 'Add Parsed Only';
                break;
            case 'both':
                return 'Add Indicator + Parsed';
                break;
            default:
                return 'Select Object Type';
        }
    }

    addToBundle(type) {
        let objectsToAdd = type === 'indicator' ? this.pendingObjects : this.pendingStixObjects;

        if (type === 'both') {
            this.pendingObjects.forEach((po) => {
                if (!objectsToAdd.some((o) => o.id === po.id)) {
                    objectsToAdd.push(po);
                }
            });
        }

        objectsToAdd.forEach((o) => {
            this.stixService.addComponent(o);
        });
    }

    saveConfig() {
        this.stixService.apiRoots2 = [];
        this.stixService.apiRootDetails = [];
        this.stixService.taxiiServerAuthType = this.guidedBundle.taxiiServerAuthType;
        let type = this.guidedBundle.taxiiServerType;

        if (type === 'custom') {
            this.stixService.updateTaxiiServer(
                'guided',
                'custom',
                this.guidedBundle.taxiiServer.url,
                this.guidedBundle.taxiiServer.username,
                this.guidedBundle.taxiiServer.password
            );
            this.stixService.getAPIRoots('custom');
        } else {
            if (type === 'a1' || type === 'raw') {
                type = 'default';
            }
            this.stixService.updateTaxiiServer('guided', type);
            this.stixService.getAPIRoots();
        }
    }

    getCollectionFromID(id: string): any {
        let collection = null;
        this.stixService.defaultServerApiRoots.find((r) => {
            collection = r.collections.find((c) => c.id === id);
            return !!collection;
        });

        return collection;
    }

    apiRootsPublishTo() {
        let that = this;
        this.stixService.apiRoots2 = this.stixService.apiRoots2.filter(function (item, pos) {
            return that.stixService.apiRoots2.indexOf(item) == pos;
        });

        let roots = this.stixService.apiRoots2.filter((r) => r.collections.some((c) => c.can_write));

        if (roots.length == 1) {
            this.selectApiRoot(roots[0]);
        }
        return roots;
    }

    getAPIRoots() {
        this.coll = null;
        this.stixService.taxiiServer.url = this.guidedBundle.taxiiServer.url;
        this.stixService.taxiiServer.username = this.guidedBundle.taxiiServer.username;
        this.stixService.taxiiServer.password = this.guidedBundle.taxiiServer.password;
        this.stixService.getAPIRoots('custom');
    }

    getPublishStatus(url): void {
        if (this.statusStartTime == 0) {
            this.statusStartTime = Date.now();
        }
        let server = this.stixService.taxiiServerType;

        this.stixService.getStatus(url).subscribe({
            next: (res: any) => {
                let pollStatus = res['status'];
                let pollTime = Date.now();
                let pollDuration = (pollTime - this.statusStartTime) / 1000; // Duration of poll in seconds

                if (server == 'ais' && JSON.stringify(res).includes('Pending human review')) {
                    this.isPublishing = false;
                    this.additionalStatusMessage = 'Bundle has been marked for manual review';
                    this.publishStatus = 'warn';
                    this.publishFeedback = res;

                    this.menuSelection = 'publish-success';
                    const data = {
                        type: 'page-forward',
                        menuSelection: this.menuSelection,
                    };
                    this.stixService.sendData(data);
                } else if (pollDuration > 600) {
                    this.additionalStatusMessage = 'Retrieval of status has timed out';
                    return;
                } else if (!pollStatus || pollStatus == 'pending') {
                    this.getPublishStatus(url);
                    return;
                }

                if (pollStatus == 'complete') {
                    // Remove Duplicates from Error and add to Success
                    if (res.failures && res.failures.length > 0) {
                        const duplicates = res.failures.filter((f) => f.message === 'duplicate collection/object/version\n');
                        if (duplicates && duplicates.length > 0) {
                            res['successes'] = res.successes ? [...res.successes, ...duplicates] : [...duplicates];
                            res.failures = res.failures.filter((f) => f.message !== 'duplicate collection/object/version\n');
                            res.failure_count = res.failure_count - duplicates.length;
                            res.success_count = res.success_count + duplicates.length;
                        }
                    }

                    if (res.success_count > 0 && res.failure_count === 0) this.publishStatus = 'success';
                    else this.publishStatus = 'error';
                    if (res.success_count > 0 && res.failure_count > 0) this.publishStatus = 'warn';

                    this.isPublishing = false;
                    this.publishFeedback = res;
                    this.stixService.sendData(res);

                    this.menuSelection = 'publish-success';
                    const data = {
                        type: 'page-forward',
                        menuSelection: this.menuSelection,
                    };
                    this.stixService.sendData(data);

                    let ids: any[] = [];
                    if (res.success_count > 0) {
                        for (let obj of res.successes) {
                            ids.push(obj.id);
                        }
                    }
                    if (res.failure_count > 0) {
                        for (let obj of res.failures) {
                            if (obj.message == 'duplicate collection/object/version') ids.push(obj.id);
                        }
                    }

                    this.stixService.db.bundles.put({ publish_time: Date.parse(res.request_timestamp), bundle: ids });
                } else {
                    this.isPublishing = false;
                    this.publishStatus = 'warn';
                    this.additionalStatusMessage = 'Bundle has likely been marked for manual review';
                    this.publishFeedback = res;
                    this.menuSelection = 'publish-success';
                    this.guidedMenu.currentPage = this.menuSelection;
                }
            },
            error: (error: any) => {
                this.isPublishing = false;
                this.publishStatus = 'warn';
                this.publishFeedback = error;
                this.menuSelection = 'publish-success';
                this.guidedMenu.currentPage = this.menuSelection;
            },
        });
    }

    sanityCheck(coll) {
        this.guidedBundle.selectedCollection = coll;

        if (coll.title.length > 0) this.coll = coll;
    }

    // End of ANALYST 1 methods

    getStixPreview() {
        let obj = JSON.parse(`[ ${JSON.stringify(this.guidedBundle.getStixPreview())} ]`);
        return obj;
    }

    cyberEventHelpText(index = null) {
        const cyberHelpText = [
            'Attack Pattern: These are TTPs (Tactics, Techniques, and Procedures) detailing methods adversaries use to compromise targets. Attack Patterns aid in categorizing and generalizing attacks, offering specifics on attack execution.',
            'Campaign: A Campaign groups adversarial behaviors, representing a series of malicious activities or attacks (sometimes termed waves) targeting specific entities over a period of time.',
            'Course of Action: A Course of Action outlines preventive or responsive measures against ongoing attacks. It includes technical, automatable responses (e.g., applying patches, reconfiguring firewalls) and broader actions such as employee training or policy adjustments.',
            'Grouping: A STIX Grouping object may represent a collection of data that, over time and through analysis, could evolve into an incident or threat report in the form of a STIX Report object.',
            'Identity: The Identity SDO captures essential identifying details, contact information, and associated sectors. Identities can pertain to specific individuals, organizations, or groups (e.g., ACME, Inc.), as well as broader categories like types of individuals, organizations, systems, or groups (e.g., the finance sector).',
            'Incident: The Incident SDO describes a cybersecurity event that has been confirmed to impact an organization, necessitating a response and recovery effort.',
            'Indicator: Indicators hold patterns for detecting suspicious or malicious cyber activities. For instance, an Indicator can symbolize a cluster of harmful domains, defined using the STIX Patterning Language.',
            'Infrastructure: The Infrastructure SDO signifies a TTP type, outlining systems, software services, and related physical or virtual resources intended for specific purposes. Examples encompass C2 servers in attacks, defense-related devices or servers, and database servers targeted in attacks.',
            'Intrusion Set: An Intrusion Set groups adversarial actions and resources sharing common attributes, presumably coordinated by a single organization.',
            'Location: A Location denotes a geographic point and can be described by various components, including region (e.g., North America), civic address (e.g., New York, US), and latitude/longitude coordinates.',
            "Malware: Malware is a form of TTP representing malicious code. Typically hidden, it infiltrates systems with the aim to compromise the victim's data, applications, operating system, or disrupt their operations, integrity, or confidentiality.",
            'Malware Analysis: Malware Analysis records metadata and findings from specific static or dynamic analyses conducted on a particular instance or family of malware.',
            "Note: A Note supplies additional context or analysis beyond what's present in related STIX Objects, Marking Definition objects, or Language Content objects. Notes can be created by anyone, not solely the original object creator.",
            'Observed Data: Observed Data communicates details about cybersecurity-related entities like files, systems, and networks through STIX Cyber-observable Objects (SCOs). For instance, it can encompass information about an IP address, network connection, file, or registry key. Observed Data is factual information devoid of interpretative context.',
            "Opinion: An Opinion appraises the accuracy of information within a different STIX Object, originating from a separate entity. The key property is 'opinion', which gauges the degree of agreement or disagreement on a fixed scale. This scale also facilitates numerical mapping for consistent statistical analysis of opinions.",
            'Report: Reports gather threat intelligence on specific topics, such as threat actors, malware, or attack techniques. These collections offer context and related information, serving to consolidate related threat intelligence into a comprehensive cyber threat narrative.',
            'Threat Actor: Threat Actors are real individuals, groups, or organizations suspected of operating maliciously. While distinct from Intrusion Sets, a Threat Actor might align with or support various Intrusion Sets, groups, or organizations over time.',
            'Tool: Tools refer to legitimate software that threat actors employ for carrying out attacks. Examples include remote access tools (e.g., RDP) and network scanning tools (e.g., Nmap), which threat actors may utilize during attacks.',
            "Vulnerability: Vulnerability pertains to flaws or flaws in computational logic (e.g., code) within software and certain hardware components (e.g., firmware). These weaknesses can be directly exploited to compromise the system's confidentiality, integrity, or availability.",
        ];

        if (!index) {
            return cyberHelpText;
        }
        return [cyberHelpText[index]];
    }

    iocHelpText(index = null) {
        const helpText = [
            'Artifact: The Artifact object allows the capture of an array of bytes (8-bits), encoded as a base64 string, or linking to a file-like payload.',
            'Autonomous System: The Internet functions as a network of networks, with autonomous systems (AS) representing the substantial networks composing it. Specifically, an autonomous system is a sizable network or network group following a unified routing policy.',
            'Directory: The Directory object portrays shared properties of a file system directory.',
            "Domain Name: The Domain Name object defines attributes of a network's domain name.",
            'Email Address: The Email Address object depicts a singular email address.',
            'Email Message: The Email Message object embodies a specific email instance, adhering to internet message format and corresponding RFCs.',
            'File: The File object characterizes file attributes.',
            'IPv4 Address: The IPv4 Address object signifies one or more IPv4 addresses, conveyed via CIDR notation.',
            'IPv6 Address: The IPv6 Address object encapsulates one or more IPv6 addresses, presented through CIDR notation.',
            'MAC Address: The MAC Address object captures a lone Media Access Control (MAC) address.',
            'Mutex: The Mutex object outlines mutual exclusion (mutex) object properties.',
            'Network Traffic: The Network Traffic object embodies diverse network activity stemming from a source and aimed at a destination. It might involve valid unicast, multicast, or broadcast network connections, and could encompass non-established traffic, like SYN floods.',
            'Process: The Process object encapsulates fundamental characteristics of a computer program instance executed within an operating system.',
            'Software: The Software object encapsulates key attributes linked to software, encompassing software products.',
            'URL: The URL object encapsulates properties of a uniform resource locator (URL).',
            'User Account: The User Account object signifies a specific user account instance, encompassing various types like operating system, device, messaging service, and social media platform accounts.',
            'Windows Registry Key: The Registry Key object portrays Windows registry key attributes. A registry key serves as an organizational unit in the Windows Registry, akin to a folder. Additionally, malware leverages native Windows tools for commands, making it undetectable by signature-based security software such as antivirus.',
            'X.509 Certificate: An X.509 certificate adheres to the universally recognized International Telecommunications Union (ITU) X.509 standard. This standard shapes the format of public key infrastructure (PKI) certificates, employed to manage identity and security in internet communications and computer networking.',
        ];

        if (!index) {
            return helpText;
        }
        return [helpText[index]];
    }

    openAnalyst1(type) {
        let analyst1URL = null;
        switch (type) {
            case 'view-evidence':
                analyst1URL = this.envService.env.analyst1.url + 'files/' + this.evidenceId;
                window.open(analyst1URL, '_blank');
                break;
            case 'search-evidence':
                analyst1URL = this.envService.env.analyst1.url + 'ui/evidence';
                window.open(analyst1URL, '_blank');
                break;
        }
    }

    showViewEvidenceOnAnalyst1() {
        return this.stixService.getLocalStorage('hasAnalyst1Evidence');
    }

    analyst1Indicatorheader() {
        switch (this.activeTabAnalyst1EvidenceType) {
            case 'File':
                return 'Upload an Evidence File to Analyst1';
            case 'Evidence ID':
                return 'Retrieve Existing Analyst1 Evidence';
            case 'Search':
                return 'Search Existing Analyst1 Indicators';
            default:
                return '';
        }
    }

    getReportTLP() {
        this.reportTLP = null;
        this.reportObject = null;
        this.reportObject = this.stixService.bundle.objects.find((x) => x.type === 'report');

        if (this.reportObject) {
            if (this.reportObject.object_marking_refs && this.reportObject.object_marking_refs.length > 0) {
                const reportTLPObj = this.objectMarking.tlp_options.find((tlpOpt) => tlpOpt.value === this.reportObject.object_marking_refs[0]);

                if (reportTLPObj) {
                    this.reportTLP = reportTLPObj;
                }
            }
        }
    }

    countTLP() {
        this.getReportTLP();

        this.tlpCounts = this.stixService.countTLP();
    }

    getUnassignedObjects() {
        this.unassignedObjMarkingRefObjs = this.stixService.getUnassignedObjects();

        const hasUnassignedObjMarkingRefObjects = {
            type: 'update-unassigned-obj-marking-ref-objects',
            value: this.unassignedObjMarkingRefObjs,
        };

        setTimeout(() => {
            this.stixService.sendData(hasUnassignedObjMarkingRefObjects);
        }, 300);
    }

    setTLP(tlp) {
        this.stixService.clearTlpPerVersion(this.tlpVersion);
        const tlpObj = this.objectMarking.tlp_options.find((x) => x.key === tlp);
        this.objectMarking.currentString = tlpObj.value;
        this.objectMarking.addStringElement(this.menuSelection === 'tlp-type');

        this.onPageMsgs = [];
        return;

        switch (tlp) {
            case 'TLP:CLEAR':
            case 'TLP:WHITE':
                this.onPageMsgs.push('TLP V2 Clear translates to TLP V1 White');
                break;
            case 'TLP:GREEN':
                this.onPageMsgs.push('TLP V2 Green translates to TLP V1 Green');
                break;
            case 'TLP:AMBER':
                this.onPageMsgs.push('TLP V2 Amber translates to TLP V1 Amber');
                break;
            case 'TLP:AMBER+STRICT':
                this.onPageMsgs.push('TLP V2 Amber+Strict translates to TLP V1 Amber');
                break;
            case 'TLP:RED':
                this.onPageMsgs.push('TLP V2 Red translates to TLP V1 Red');
                break;
        }
    }

    autoSetTLP() {
        let mostStrictIndex = 0;

        // Clear existing selection
        const existingTLP = this.stixService.objectMarkingReferences;
        if (existingTLP.length > 0) {
            const existingTlpIndex = this.objectMarking.tlp_options.findIndex((o) => o.value === existingTLP[0]);
            if (existingTlpIndex !== -1) {
                this.selectTLP(this.objectMarking.tlp_options[existingTlpIndex].key);
            }
        }

        // Find and set new selection
        this.stixService.bundle.objects.forEach((o) => {
            if (o.object_marking_refs && o.object_marking_refs.length > 0) {
                const foundIndex = this.objectMarking.tlp_options.findIndex((opt) => opt.value === o.object_marking_refs[0]);
                if (foundIndex > mostStrictIndex) {
                    mostStrictIndex = foundIndex;
                }
            }
        });

        setTimeout(() => {
            this.countTLP();
            this.mostStrictTlpOption = this.objectMarking.tlp_options[mostStrictIndex];
            this.selectTLP(this.objectMarking.tlp_options[mostStrictIndex].key);
        }, 800);
    }

    updateBundleUnassignedTLP() {
        if (this.stixService.objectMarkingReferences.length > 0) {
            this.unassignedObjMarkingRefObjs.forEach((o) => {
                o['object_marking_refs'] = [this.selectedTlpOption.value];
            });

            console.info(this.unassignedObjMarkingRefObjs);
            this.stixService.db.imxCache.toArray().then(async (results) => {
                for (const obj of this.unassignedObjMarkingRefObjs) {
                    const matchedObj = results.find((elem) => obj.id === elem.id);
                    if (matchedObj) matchedObj.object = obj;
                }
                await this.stixService.db.imxCache.bulkPut(results);
                this.getUnassignedObjects();
            });
        }
    }

    resetSelection() {
        this.objectSelection = null;
        this.indicatorSelection = null;
    }

    cancelAnalyst1Search() {
        this.analyst1ObjectsObservable.unsubscribe();
        this.loadingStix = false;
        this.addingStixToPending = false;
    }

    showFavIconType(object) {
        let localfavoriteObjects: any = localStorage.getItem('favorite-objects');

        let typeFound = false;
        if (localfavoriteObjects) {
            localfavoriteObjects = JSON.parse(localfavoriteObjects);
            typeFound = localfavoriteObjects.find((lf) => lf.type === object.type);
        }

        if (typeFound) {
            return 'minus';
        } else {
            return 'plus';
        }
    }

    updateFavObj(object) {
        let favorites = [];
        let localFavorites: any = localStorage.getItem('favorite-objects');
        if (localFavorites) {
            localFavorites = JSON.parse(localFavorites);
            let foundIndex = localFavorites.findIndex((lf) => lf.type === object.type);
            if (foundIndex > -1) {
                localFavorites.splice(foundIndex, 1);
                favorites = localFavorites;
            } else {
                favorites = [...localFavorites, object];
            }
        } else {
            favorites.push(object);
        }

        favorites.sort((a, b) => {
            if (a.displayName < b.displayName) {
                return -1;
            }
            if (a.displayName > b.displayName) {
                return 1;
            }
            return 0;
        });

        if (favorites.length > 0) {
            localStorage.setItem('favorite-objects', JSON.stringify(favorites));
        } else {
            localStorage.removeItem('favorite-objects');
        }
    }

    getFavoriteObjects() {
        let localFavoritesObjects: any = localStorage.getItem('favorite-objects');
        if (localFavoritesObjects) {
            localFavoritesObjects = JSON.parse(localFavoritesObjects);
            return localFavoritesObjects;
        }
        return [];
    }

    createAnotherBundle(selection) {
        switch (selection) {
            case 'yes':
                this.createAnotherObject = true;
                const message = 'Would you like to discard existing Bundle?';
                this.guidedBundle.discardBundleHandler(message);
                break;
            case 'no':
                this.createAnotherObject = false;

                this.menuSelection = 'build-review';
                this.reviewOption = 'Bundle';
                const forwardEvent = {
                    type: 'page-forward',
                    menuSelection: this.menuSelection,
                };
                this.stixService.sendData(forwardEvent);
                break;
        }
    }

    showAddObject() {
        return this.menuSelection === 'build-review';
    }

    onAddObjectChoice(choice: boolean) {
        this.createAnotherObject = choice;
        this.goForward();
    }

    addObject() {
        this.menuSelection = 'who-individual';

        const forwardEvent = {
            type: 'page-forward',
            menuSelection: this.menuSelection,
        };
        this.stixService.sendData(forwardEvent);

        this.getUnassignedObjects();
    }

    findEvidenceIdModal() {
        let messageData = { title: 'Help - Finding Analyst1 Evidence ID', messages: [], textOnlyIndex: [] };
        this.modalRef = this.modalService.open(HelpDialogComponent, { size: 'xl' });

        messageData.messages = [
            '<a href=' + this.envService.env.analyst1.url + 'ui/evidence' + ' target="_blank">Find Evidence on Analyst1</a>',
            "<img src='./assets/analyst1-evidence-id.png' width='100%' height='100%' role='button' title='evidence-id' class='mb-3 mt-3'>",
        ];
        messageData.textOnlyIndex = [0, 1];

        this.modalRef.componentInstance.messageObj = messageData;
        this.modalRef.componentInstance.buttonsToShow = ['ok'];
    }

    getObjectNameFromPublish(object) {
        const foundBundleObject = this.stixService.bundle.objects.find((o) => o.id === object.id);

        if (foundBundleObject) {
            return this.stixService.getComponentDisplay(foundBundleObject);
        }

        return foundBundleObject.id;
    }

    getBundleObject(id: string) {
        return this.stixService.bundle.objects.find((o) => o.id === id) ?? null;
    }

    toggleSuccessItem(id: string) {
        this.expandedSuccesses.has(id) ? this.expandedSuccesses.delete(id) : this.expandedSuccesses.add(id);
    }

    toggleFailureItem(id: string) {
        this.expandedFailures.has(id) ? this.expandedFailures.delete(id) : this.expandedFailures.add(id);
    }

    detectedErrorClass() {
        if (this.publishFeedback.failures && this.publishFeedback.failures.length > 0) {
            if (this.publishFeedback.successes && this.publishFeedback.successes.length > 0) {
                return 'let-us-help-partial-success';
            } else {
                return 'let-us-help-failure';
            }
        }
        return '';
    }

    contentWrapperClass() {
        if (this.publishFeedback.failures && this.publishFeedback.failures.length > 0) {
            if (!this.publishFeedback.successes || this.publishFeedback.successes.length === 0) {
                return 'content-wrapper-short';
            }
        }
        return 'content-wrapper';
    }

    getPermissions() {
        let getDiscoveryURL = '';
        this.a1Writable = false;
        this.initialIngestWritable = false;

        getDiscoveryURL = `${this.taxiiServer.url}admin/${this.envService.env.adminServer.apiVersion + '/'}permissions/`;

        try {
            this.stixService.getCert(this.httpHeaders, (header: HttpHeaders) => {
                this.httpClient.get(getDiscoveryURL, { headers: header }).subscribe((data: any) => {
                    this.permissions = data;

                    this.permissions.forEach((p) => {
                        p.collections.forEach((c) => {
                            if (c.id === this.envService.env.taxiiServer.a1CollectionId) {
                                if (c.can_write) {
                                    this.a1Writable = true;
                                }
                            }

                            if (c.id === this.envService.env.taxiiServer.a1RawCollectionId) {
                                if (c.can_write) {
                                    this.initialIngestWritable = true;
                                }
                            }
                        });
                    });
                });
            });
        } catch (e) {
            let errMessage = `Unable to get query results.\nError code [${e.status}]`;
            return;
        }
    }

    selectGroupByTLP(event) {
        if (event && event.target && event.target.value) {
            this.isGroupByTLP = event.target.value === 'true';
        }
    }

    updateViewOption(event) {
        if (event && event.target && event.target.value) {
            this.reviewOption = event.target.value;

            if (this.reviewOption === 'Visual (Full Screen)') {
                this.openFullscreen();
            }
        }
    }

    tlpMargin(tlp) {
        if (tlp.key === 'TLP:AMBER+STRICT') {
            return 'strict';
        }
        if (tlp.key === 'TLP:AMBER') {
            return 'amber';
        }
        if (tlp.key === 'TLP:RED') {
            return 'red';
        }
        return 'other';
    }

    openFullscreen() {
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
    }

    closeFullscreen() {
        if (this.document.exitFullscreen) {
            this.document.exitFullscreen();
        } else if (this.document.mozCancelFullScreen) {
            // Firefox
            this.document.mozCancelFullScreen();
        } else if (this.document.webkitExitFullscreen) {
            // Chrome, Safari and Opera
            this.document.webkitExitFullscreen();
        } else if (this.document.msExitFullscreen) {
            // IE/Edge
            this.document.msExitFullscreen();
        }
    }

    selectObjectByType(type) {
        let taObject = this.allIOCObjects.find((o) => o.routeName === type);
        this.selectObject(taObject);
    }

    showNeedAssistance() {
        if (
            this.menuSelection &&
            (this.menuSelection.includes('who') ||
                this.menuSelection.includes('how') ||
                this.menuSelection.includes('when') ||
                this.menuSelection.includes('what') ||
                this.menuSelection.includes('why') ||
                this.menuSelection.includes('analyst-assessment') ||
                this.menuSelection === 'build-review')
        ) {
            return false;
        }
        return true;
    }

    async openAnalyst1Modal() {
        await this.envService.checkAuth('/guided');
        const modalRef = this.modalService.open(Analyst1DialogComponent, { size: 'analyst1' });

        modalRef.result
            .then((result) => {
                if (result === 'added') {
                    console.info(this.guidedMenu);
                    this.guidedMenu.onSelectMenu('build-review');
                }
            })
            .catch((e) => {
                console.error('error', e);
            });
    }

    onMenuExpandedChange(expanded: boolean) {
        this.isMenuExpanded = expanded;
    }
}
