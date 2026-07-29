import { Injectable, OnInit } from '@angular/core';
import { lastValueFrom, Observable, Subject } from 'rxjs';
import { Bundle } from './models/bundle';
import { ExternalReference } from './models/external-reference';
import { GranularMarking } from './models/granular-marking';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LANGUAGES } from './models/languages';
import { Content } from './models/content';
import { v5 as uuidV5, v4 as uuidV4 } from 'uuid';
import { IdContributingProperties } from 'src/app/models/id-contributing-properties';
import { TLP_OPTIONS, TLP20_OPTIONS } from 'src/app/tlpMarkingDef';
import { SCO_LIST } from 'src/app/models/sco_list';
import { LoggingService } from './logging-service/logging.service';
import { db } from './db.service';
import { liveQuery } from 'dexie';
import { STIX_OBJECTS_LIST } from './models/stix-objects';
import { SavedBundlesService } from './saved-bundles/saved-bundles-service/saved-bundles.service';
import { SubmissionsService } from './submissions-service/submissions.service';
import { AnnouncementService } from './announcement-service/announcement-service.service';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { AlertService } from './user-data/alert-tab/alert-history/alert-service/alert.service';
import canonicalize from 'canonicalize';
import { EnvService } from './env-service/env.service';
import all_schemas from './bundle/schemas.json';
import { Destination } from './dialogs/analyst1-dialog/acs-types';
import { validateStix } from './shared/utils/validation.utils';

const Validator = require('jsonschema').Validator;

@Injectable({
    providedIn: 'root',
})
export class StixService implements OnInit {
    objectFromClient: JSON;
    apiRoots: any[] = [];
    bundle: Bundle;
    customObjects: any[];
    savedBundles: any[];
    serverSavedBundles: any;
    totalServerBundles: number;
    localSavedBundles: any[] = [];
    alerts: any[] = [];
    externalReferences: ExternalReference[] = [];
    granularMarkings: GranularMarking[] = [];
    extensions: any = [];
    currentIncidentCoreExtension: any = {};
    currentMalwareCorpus: any = {};
    contents: Content[] = [];
    objectMarkingReferences: string[] = [];
    objectMarkingReferencesTemp: string[] = [];
    stringArrayQuestions: string[] = [];
    stringArrays = new Map<string, string[]>();
    results: any;
    granularMarkingSelectors: any[] = [];
    editedGranularMarking: any = undefined;
    editedExternalReference: any = undefined;
    editedExtension: any = undefined;
    editedIncidentCore: any = undefined;
    editedMalwareCorpus: any = undefined;
    revoked: boolean = false;
    lang_options = LANGUAGES;
    currentType = '';
    currentID = '';
    parentExtensionID = ''; // currentID was occasionally getting roguely updated to the ID of a created Custom Object
    newObject = false;
    kill_chainTrack: boolean = false;
    idContributingProperties: any[];
    modalObjectArray: any[] = [];
    customObjReadOnly = false;
    customObjInfo = {}; //{"new": true, "parent":"parent","types": ["new-sdo","new-sco"]}; //[["one","new-sdo"],["two","new-sco"]]};
    customTypesToAdd: any[][] = [];
    customTypes: any = {};
    modifyingCustomObj = false;
    removedCustomObj: any[] = [];
    isEditing = false; // Derek - I forget what newObject was for, but it does not seem to work the same way
    deletionQueue: any[] = [];
    added = false;
    toplevelProperties: string[] = [];
    toplevel: any[][] = [];
    public subject = new Subject<any>();
    languageContentsArrays: any[] = [];
    guidedUI: boolean = false;
    acsSelection = '';
    acsObject = null;
    savedStatus: any[];
    tempStatusCallback: any;
    isLoadingBundles = true;
    duplicates: any[] = []; // Array of duplicated objects for current object being edited in dynamic form

    annoucementID = 0;
    latencyInit = false;

    hasObjectsToLoad: boolean = false;
    objectsToLoad: any[] = [];
    uploadError = '';
    promptDelete: any[] = [];
    nextDel: any;
    origID: string = '';
    newID: string = '';

    timeZoneOptions: any[] = [];
    formattedTimeZoneOptions: any = {};
    moment = moment;
    moment_tz = moment_tz;
    timezones: any = {};

    // communicate incident core extension status during incident object creation/editing
    public iceStatus = new Subject<boolean>();
    public mbeStatus = new Subject<boolean>();
    unreadAlerts: number = 0;
    loadingAlerts: boolean = true;
    selectedAlert: any = {};

    //Server Config
    apiRoots2: any[] = [];
    apiRootDetails: any[] = [];
    noServerResults: boolean = false;
    apiRootProcessingError: string = '';
    apiRootProcessingErrorURL: string = '';
    latency: any = {};
    showConnectionError = true;

    permissions = null;
    permissionType = 'can_read';

    taxiiServer = {
        url: '',
        username: '',
        password: '',
        required: [],
    };
    taxiiServerAuthType: string = 'cert';
    taxiiServerType: string = '';
    useCert = false;
    publishToA1 = false;
    prod = this.envService.env.production;

    private pullHeaders: any;
    revocation: boolean;
    selectedAPIRoot = null;
    isLoadingStix = false;
    isLoading: boolean = false;
    relationshipArrOptions = [];

    rootRequestsCount = 0;
    rootResponsesCount = 0;

    sandbox = null;
    defaultServerApiRoots = []; // used for Guided automatic publish
    tlpOptions = null;

    reportName: string = '';
    importReportName: string = '';

    db = db;
    reportNo = 0;
    bundleObservable = liveQuery(() => db.imxCache.orderBy('index').toArray());
    savedBundleObservable = liveQuery(() => db.savedBundles.toArray());
    imxCacheIndex: number;

    uploadErrors = '';
    imxServerConnectionError = '';

    certFound: boolean;
    cert: string;

    notes: Map<string, any> = new Map();
    new_notes: Map<string, any> = new Map();

    newVersionObjects = [];

    objectsObservable = null;

    killChainExternalReferences = [];
    killChainType = 'lockheed-martin-cyber-kill-chain';

    expandedObjectTypes = null;
    expandAll = false;
    isGroupByTLP = null;
    expandedTlpTypes = null;

    markingDefinition: Record<string, string> = {};

    //Distinguish Marking Definitions coming from the TAXII server. Not ideal but quick way to solve
    remoteMarkingDefinitions: Set<string> = new Set();
    acsMarkings: object = {};

    ogSubmission: string = '';
    encoded: boolean = false;

    private httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Content-Type', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

    private readonly httpHeadersJSON = new HttpHeaders()
        .set('Accept', '*/*')
        .set('Content-Type', `application/json`)
        .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

    constructor(
        private readonly httpClient: HttpClient,
        private readonly loggingService: LoggingService,
        private readonly savedBundlesService: SavedBundlesService,
        private readonly submissions: SubmissionsService,
        private readonly alertService: AlertService,
        private readonly envService: EnvService
    ) {
        if (this.envService.env.tlpConfig.enabledTlpVersions.length === 1) {
            const tlpVersion = this.envService.env.tlpConfig.enabledTlpVersions[0].value;
            this.tlpOptions = this.getTlpOptions(tlpVersion);
        }

        this.bundleObservable.subscribe((bundleObjects) => {
            const newBundle = bundleObjects.map((obj) => obj.object);
            this.bundle.objects = newBundle.filter((obj) => STIX_OBJECTS_LIST.includes(obj.type));
            this.customObjects = newBundle.filter((obj) => !STIX_OBJECTS_LIST.includes(obj.type));

            this.imxCacheIndex = bundleObjects.length > 0 ? bundleObjects[bundleObjects.length - 1].index + 1 : 1;
        });

        this.savedBundleObservable.subscribe((savedBundles) => {
            if (envService.env.environment == 'dev' && !envService.env.keycloak.enabled)
                this.localSavedBundles = savedBundles
                    .sort((a: any, b: any) => (a.reportNo < b.reportNo ? 1 : b.reportNo < a.reportNo ? -1 : 0))
                    .filter(async (bundle) => bundle.owner === this.envService.getUsername());
            else
                this.envService.waitUser().then((res) => {
                    this.localSavedBundles = savedBundles
                        .sort((a: any, b: any) => (a.reportNo < b.reportNo ? 1 : b.reportNo < a.reportNo ? -1 : 0))
                        .filter(async (bundle) => bundle.owner === this.envService.getUsername());
                });
        });

        this.bundle = new Bundle([]);
        this.timeZoneOptions = this.moment_tz.tz.names();
        for (let tz of this.timeZoneOptions) {
            this.formattedTimeZoneOptions[tz] = this.showTimezoneAndOffset(tz);
        }

        this.reportName = localStorage.getItem('report-name') ? localStorage.getItem('report-name') : '';

        this.bundle.id = `bundle--${uuidV4()}`;
        this.serverSavedBundles = [];
        this.savedBundles = [];
        this.savedStatus = [];
        this.customObjects = [];

        this.idContributingProperties = IdContributingProperties;

        let guided = localStorage.getItem('isGuided');
        let serverType = guided === 'true' ? localStorage.getItem('taxiiServerType-guided') : localStorage.getItem('taxiiServerType');
        if (serverType) {
            this.taxiiServerType =
                guided === 'true' ? localStorage.getItem('taxiiServerType-guided').toString() : localStorage.getItem('taxiiServerType').toString();
        } else {
            this.taxiiServerType = 'default';
        }

        this.pullHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        if (localStorage.getItem('imx-cache')) {
            try {
                this.bundle = JSON.parse(localStorage.getItem('imx-cache')!) || new Bundle([]);
            } catch (e) {
                console.error('Error parsing saved cached bundle with message: ', e);
                localStorage.removeItem('imx-cache');
            }
        }

        if (localStorage.getItem('saved-status')) {
            try {
                this.savedStatus = JSON.parse(localStorage.getItem('saved-status')!) || [];
            } catch (e) {
                console.error('Error parsing saved cached bundles with message: ', e);
                localStorage.removeItem('saved-status');
            }
        }

        if (localStorage.getItem('custom-types')) {
            try {
                this.customTypes = JSON.parse(localStorage.getItem('custom-types')!) || {};
            } catch (e) {
                console.error('Error parsing saved custom object types with message: ', e);
                localStorage.removeItem('custom-types');
            }
        }

        setTimeout(() => {
            if (localStorage.getItem('objects-to-load')) {
                try {
                    this.objectsToLoad = JSON.parse(localStorage.getItem('objects-to-load')!) || [];
                    this.hasObjectsToLoad = true;
                } catch (e) {
                    console.error('Error parsing objects to load with message: ', e);
                } finally {
                    localStorage.removeItem('objects-to-load');
                }
            }
        }, 1000);

        this.setupCache();
    }

    //May need to move the functions here to somewhere else for SonarQube findings. Best place may be the app.component ngOnInit
    setupCache() {
        this.db.imxCache
            .orderBy('index')
            .last()
            .then((last) => {
                if (last === undefined) this.imxCacheIndex = 1;
                else this.imxCacheIndex = last.index + 1;
            })
            .then(() => {
                this.updateMarkingDef();
            });
    }

    async getUnreadAlerts() {
        this.loadingAlerts = true;

        let temp: any = await this.alertService.getUnreadAlerts();

        if (temp.hits) {
            this.unreadAlerts = temp.total.value;
            this.loadingAlerts = false;
        }
    }

    async getSavedBundles(page, sortKey, selection) {
        this.isLoadingBundles = true;
        this.savedBundles = [];
        let result = true;

        if (selection === undefined) {
            selection = this.envService.keycloakUser.preferred_username;
        }

        if (!this.serverSavedBundles.status && this.serverSavedBundles.status !== 500) {
            this.serverSavedBundles = [];
            try {
                let savedBundlesRes: any = await this.savedBundlesService.getSavedBundles(page, sortKey, selection);

                if (!savedBundlesRes.hits) {
                    let errorCode = savedBundlesRes.status ? savedBundlesRes.status : '0';
                    let errorMessage = savedBundlesRes.message
                        ? savedBundlesRes.message
                        : `Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
                    this.imxServerConnectionError = `Error code [${errorCode}]: ${errorMessage}`;
                    result = false;
                } else {
                    this.imxServerConnectionError = '';
                    this.totalServerBundles = savedBundlesRes.total.value;
                    this.serverSavedBundles = savedBundlesRes.hits;

                    for (let obj of this.serverSavedBundles) {
                        if (obj._source.publicationStatus && obj._source.submissionID && obj._source.publicationStatus !== 'Status: complete') {
                            try {
                                let submission: any = await this.submissions.getSubmissionByID(obj._source.submissionID);

                                //Submissions should update before getting to the saved bundles page
                                if (submission.res.status === 'complete') {
                                    obj._source.publicationStatus = 'Status: complete';
                                    await this.savedBundlesService.updateSavedBundle(obj);
                                }
                            } catch (e) {
                                console.error(e);
                            }

                            if (obj._source.reportNo && obj._source.reportNo > this.reportNo) {
                                this.reportNo = obj._source.reportNo;
                            }
                        }
                    }

                    if (this.serverSavedBundles.status && (this.serverSavedBundles.status === 500 || this.serverSavedBundles.status === 404)) {
                        result = false;
                    }
                }
            } catch (e) {
                console.error(e);
                result = false;
            }

            if (result === true) {
                for (let bundle of this.serverSavedBundles) {
                    this.savedBundles.push(bundle._source);
                }
            }

            this.savedBundles = this.savedBundles.concat(this.localSavedBundles);
            this.isLoadingBundles = false;

            for (let bundle of this.savedBundles) {
                if (bundle.reportNo && bundle.reportNo > this.reportNo) {
                    this.reportNo = bundle.reportNo;
                }
            }
        } else {
            this.savedBundles = this.savedBundles.concat(this.localSavedBundles);
            this.isLoadingBundles = false;

            for (let bundle of this.savedBundles) {
                if (bundle.reportNo && bundle.reportNo > this.reportNo) {
                    this.reportNo = bundle.reportNo;
                }
            }
        }

        return result;
    }

    async ngOnInit() {
        //ngOnInit should not be called since stix-service is a service and not a component with a lifecycle hooks...?
        this.updateTaxiiServer('legacy', this.taxiiServerType);
        let httpHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );

        this.refreshTaxiiUrls().then(async () => {
            try {
                if (!this.envService.env.taxiiServer) {
                    await this.envService.wait('taxiiServer');
                }

                this.httpClient.get(`${this.envService.env.imxServer.url}/test`, { headers: httpHeaders }).subscribe(
                    (data) => console.debug(data),
                    (error) => {
                        this.imxServerConnectionError = `Error code [0]: Cannot connect to IMX Server at: ${this.envService.env.imxServer.url} Please create a support request using the link in the bottom right for further assistance.`;
                        console.error(this.imxServerConnectionError);
                    }
                );
            } catch (e) {
                console.error(e);
            }

            this.getUnreadAlerts();
        });
    }

    async refreshRootCollections(refresh, type = 'can_read') {
        this.apiRoots2 = [];
        this.apiRootDetails = [];

        let httpHeaders = new HttpHeaders()
            .set('Accept', '*/*')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        if (this.taxiiServerType === 'default') {
            let getDiscoveryURL = '';

            getDiscoveryURL = `${this.taxiiServer.url}admin/${this.envService.env.adminServer.apiVersion + '/'}permissions/`;
            this.apiRootProcessingError = '';
            console.debug('Collection', getDiscoveryURL);
            try {
                const data: any = await lastValueFrom(this.httpClient.get(getDiscoveryURL, { headers: await this.getCertHeader(httpHeaders) }));
                try {
                    if (data) {
                        this.permissions = data;
                        this.permissionType = type;

                        if (refresh) await this.getAPIRoots();
                    }
                } catch (e) {
                    let errMessage = `Unable to get query results.\nError code [${e.status}]: ${this.generateHTTPError(e.status)}\nURL: ${e.url}`;
                    this.showConnectionError = true;
                    this.apiRootProcessingError = `**Error Name: ${e.name} Error Message ${e.message}**`;
                    console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                    this.noServerResults = false;
                    return;
                }
            } catch (e) {
                let status = e.status;
                if (!status) {
                    status = e.http_status;
                }

                let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                if (e.description && e.description.length > 0) {
                    errMessage = e.description;
                }
                this.apiRootProcessingErrorURL = e.url;
                this.showConnectionError = true;
                this.apiRootProcessingError = errMessage;
                this.noServerResults = false;
                return;
            }
        } else {
            try {
                if (this.taxiiServerType === 'custom' && !this.taxiiServer.username && !this.taxiiServer.password) {
                    const imxHeaders = new HttpHeaders().set(
                        'Authorization',
                        `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
                    );

                    const resp: any = await lastValueFrom(
                        this.httpClient.get(
                            `${this.envService.env.imxServer.url}/taxii/${localStorage.getItem('customUrl').replace('https://', '').replace('http://', '').replace('/', '')}`,
                            { headers: imxHeaders }
                        )
                    );
                    this.taxiiServer.password = resp.password;
                    this.taxiiServer.username = resp.username;

                    if (resp.useCert) this.useCert = true;

                    await this.getAPIRoots();
                } else await this.getAPIRoots();
            } catch (e) {
                let status = e.status;
                if (!status) {
                    status = e.http_status;
                }

                let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                if (e.description && e.description.length > 0) {
                    errMessage = e.description;
                }
                this.apiRootProcessingErrorURL = e.url;
                this.showConnectionError = true;
                this.apiRootProcessingError = errMessage;
                this.noServerResults = false;
                return;
            }
        }
    }

    /**
     * Remaps marking definition id and names
     * @returns Promise with updated marking definition references
     */
    updateMarkingDef(): Promise<Record<string, string>> {
        return new Promise((res, rej) => {
            this.markingDefinition = {};
            this.acsMarkings = {};

            this.bundle.objects.forEach((elem) => {
                if (elem.type === 'marking-definition') {
                    if (elem.extensions?.['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']) {
                        if (elem.name) this.acsMarkings[elem.id] = elem.name;
                        else this.identifyAcs(elem);
                    } else if (elem.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']) {
                        this.markingDefinition[elem.id] = this.getCuiDisplay(
                            elem.extensions['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a'],
                            elem.id
                        );
                    } else this.markingDefinition[elem.id] = elem.name ? elem.name : elem.id;
                }
            });

            //Fetch marking objects from TAXII
            this.envService
                .wait('taxiiServer')
                .then((resolve) => {
                    this.getMarkingDefinition().subscribe(
                        (data: any) => {
                            if (data?.body?.founds?.length > 0) {
                                data.body.founds.forEach((marking) => {
                                    if (marking.object?.id) {
                                        if (marking.object.extensions?.['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']) {
                                            if (marking.object.name) {
                                                this.acsMarkings[marking.object.id] = marking.object.name;
                                                this.remoteMarkingDefinitions.add(marking.object.id);
                                            } else {
                                                this.identifyAcs(marking.object);
                                                this.remoteMarkingDefinitions.add(marking.object.id);
                                            }
                                        } else if (marking.object.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']) {
                                            this.markingDefinition[marking.object.id] =
                                                marking.object.extensions['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a'].control;
                                            this.remoteMarkingDefinitions.add(marking.object.id);
                                        } else {
                                            this.markingDefinition[marking.object.id] = marking.object.name ? marking.object.name : marking.object.id;
                                            this.remoteMarkingDefinitions.add(marking.object.id);
                                        }
                                    }
                                });
                            }

                            localStorage.setItem('acs-type', JSON.stringify(this.acsMarkings));
                            localStorage.setItem('objectMarkingRefs', JSON.stringify(this.markingDefinition));
                            return res(this.markingDefinition);
                        },
                        (err) => {
                            console.error('Err', err);
                            return res(this.markingDefinition);
                        }
                    );
                })
                .catch((err) => {
                    localStorage.setItem('acs-type', JSON.stringify(this.acsMarkings));
                    localStorage.setItem('objectMarkingRefs', JSON.stringify(this.markingDefinition));
                    return res(this.markingDefinition);
                });
        });
    }

    determineAcs(acsObj, usage_permission, further_sharing): Destination {
        if (acsObj.control_set?.formal_determination && acsObj.control_set.formal_determination.includes('PUBREL')) {
            if (usage_permission === 'Permit' && further_sharing === 'Permit') {
                if (!acsObj.control_set?.shareability || acsObj.control_set?.shareability?.length === 0) return 'Federal, Public (TLP:CLEAR)';
            }
        }

        if (!acsObj.control_set?.formal_determination.includes('PUBREL') && usage_permission === 'Deny') {
            if (acsObj.control_set?.shareability) {
                if (
                    acsObj.control_set.shareability.length === 2 &&
                    acsObj.control_set.shareability.includes('AIS') &&
                    acsObj.control_set.shareability.includes('CISCP')
                ) {
                    //Contains both Public and CISCP
                    if (further_sharing === 'Deny') {
                        if (acsObj.further_sharing?.length > 0) {
                            if (
                                acsObj.further_sharing.every((fsl) => {
                                    if (fsl.rule_effect === 'permit' && fsl.sharing_scope.length === 1 && fsl.sharing_scope.includes('NONFED'))
                                        return true;

                                    return false;
                                })
                            ) {
                                return 'Federal, Public, CISCP (TLP:AMBER)';
                            }
                        }
                    } else {
                        return 'Federal, Public, CISCP (TLP:GREEN)';
                    }
                } else if (acsObj.control_set.shareability.length === 1 && acsObj.control_set.shareability.includes('AIS')) {
                    //Contains Public
                    if (further_sharing === 'Deny') {
                        if (acsObj.further_sharing?.length > 0) {
                            if (
                                acsObj.further_sharing.every((fsl) => {
                                    if (fsl.rule_effect === 'permit' && fsl.sharing_scope.length === 1 && fsl.sharing_scope.includes('NONFED'))
                                        return true;

                                    return false;
                                })
                            ) {
                                return 'Federal, Public (TLP:AMBER)';
                            }
                        }
                    } else {
                        return 'Federal, Public (TLP:GREEN)';
                    }
                } else if (acsObj.control_set.shareability.length === 1 && acsObj.control_set.shareability.includes('CISCP')) {
                    //Contains CISCP
                    if (further_sharing === 'Deny') {
                        if (acsObj.further_sharing?.length > 0) {
                            if (
                                acsObj.further_sharing.every((fsl) => {
                                    if (fsl.rule_effect === 'permit' && fsl.sharing_scope.length === 1 && fsl.sharing_scope.includes('NONFED'))
                                        return true;

                                    return false;
                                })
                            ) {
                                return 'Federal, CISCP (TLP:AMBER)';
                            }
                        }
                    } else {
                        return 'Federal, CISCP (TLP:GREEN)';
                    }
                }
            }
        }

        return 'Federal';
    }

    identifyAcs(acs) {
        const formalDetermination =
            acs?.extensions?.['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']?.control_set?.['formal_determination'];

        const acsObj = acs?.extensions?.['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'];

        if (acsObj) {
            const privdefault = acsObj.policy_reference.split('privdefault=')[1];
            const sharedefault = acsObj.policy_reference.split('sharedefault=')[1];
            let usage_permission;
            let further_sharing;
            if (privdefault.startsWith('permit')) usage_permission = 'Permit';
            else usage_permission = 'Deny';

            if (sharedefault.startsWith('permit')) further_sharing = 'Permit';
            else further_sharing = 'Deny';

            this.acsMarkings[acs.id] = this.determineAcs(acsObj, usage_permission, further_sharing);
        }
    }

    /**
     * Request TAXII Server globally for all Marking Definition objects
     * @returns Observable HTTP Request
     */
    getMarkingDefinition() {
        let httpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        let url = `${this.envService.env.taxiiServer.url}ext/v1.0/search/`;

        return this.taxiiHttpReq(
            'post',
            url,
            { headers: httpHeaders, observe: 'response' },
            {
                query: 'type.keyword:marking-definition',
            }
        );
    }

    getCustomURL(): string {
        this.taxiiServer.url = localStorage.getItem('customUrl');
        if (!this.taxiiServer.url) {
            console.debug('Custom TAXII URL invalid');
            this.taxiiServer.url = '/';
        }

        let urlArray = this.taxiiServer.url.split('/');
        if (urlArray.length >= 3) {
            return `${urlArray[0]}//${urlArray[2]}/taxii/${this.envService.env.taxiiServer.apiVersion}/`;
        } else {
            console.debug('Custom Taxii URL may be invalid');
            return this.taxiiServer.url;
        }
    }

    async getAPIRoots(serverType?: string): Promise<void> {
        this.apiRoots = [];
        this.apiRootProcessingError = '';
        this.apiRootProcessingErrorURL = '';
        this.selectedAPIRoot;

        let getDiscoveryURL = '';

        if (!this.envService.env.taxiiServer.username) {
            await this.envService.wait('taxiiServer');
        } else if (this.taxiiServerType === 'ais') {
            await this.envService.wait('aisTaxiiProxy');
        }

        switch (this.taxiiServerType) {
            case 'default':
            case 'a1':
            case 'raw':
            case 'sandbox':
            case 'cisa':
                this.taxiiServer.username = this.envService.env.taxiiServer.username;
                this.taxiiServer.password = this.envService.env.taxiiServer.password;

                if (!this.taxiiServer.url && this.envService.env?.taxiiServer?.url) this.taxiiServer.url = this.envService.env.taxiiServer.url;

                getDiscoveryURL = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion + '/'}taxii2/`;
                break;
            case 'cma':
                this.taxiiServer.username = this.envService.env.cmaServer.username;
                this.taxiiServer.password = this.envService.env.cmaServer.password;

                if (!this.taxiiServer.url && this.envService.env?.cmaServer?.url) this.taxiiServer.url = this.envService.env.cmaServer.url;

                getDiscoveryURL = `${this.envService.env.cmaServer.url}taxii/${this.envService.env.taxiiServer.apiVersion + '/'}taxii2/`;
                break;
            case 'ais':
                if (!this.taxiiServer.url && this.envService.env?.aisTaxiiProxy?.url) this.taxiiServer.url = this.envService.env.aisTaxiiProxy.url;

                getDiscoveryURL = `${this.taxiiServer.url}taxii2/`;
                break;
            case 'custom':
                const customUrl = this.getCustomURL();
                if (!this.taxiiServer.url && customUrl) this.taxiiServer.url = customUrl;

                getDiscoveryURL = `${customUrl}taxii2/`;
                serverType = this.taxiiServerType;
                break;
            default:
                getDiscoveryURL = `${this.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion + '/'}taxii2/`;
        }

        if (this.taxiiServerType === 'ais') {
            this.httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.envService.env.aisTaxiiProxy.username + ':' + this.envService.env.aisTaxiiProxy.password)}`);
        } else {
            this.httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);
        }

        if (serverType === 'custom') {
            try {
                this.httpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

                const data: any = await lastValueFrom(this.taxiiHttpReq('get', getDiscoveryURL, { headers: this.httpHeaders }));

                try {
                    if (data.api_roots) {
                        for (let i = 0; i < data.api_roots.length; i++) {
                            let apiRoot = this.retrieveAPIRoot(data.api_roots[i]);
                            this.apiRoots.push(apiRoot);

                            if (apiRoot) {
                                let url = getDiscoveryURL;

                                if (url.endsWith('taxii2/')) {
                                    url = url.substring(0, url.length - 7);
                                }

                                let apiRootInfo: any;
                                try {
                                    apiRootInfo = await lastValueFrom(this.taxiiHttpReq('get', url + apiRoot + '/', { headers: this.httpHeaders }));
                                } catch (e) {
                                    console.error('Error Name: ', e.name, ' Error Message: ', e.message);
                                    continue;
                                }

                                let currentRoot = {
                                    'api-root': apiRoot,
                                    title: apiRootInfo['title'],
                                    description: apiRootInfo['description'],
                                };

                                if (
                                    (!apiRootInfo.http_status || (apiRootInfo.http_status && apiRootInfo.http_status !== '403')) &&
                                    !this.rootFound(currentRoot)
                                ) {
                                    this.apiRootDetails.push(currentRoot);
                                    const tempRoot = this.apiRootDetails[this.apiRootDetails.length - 1];
                                    await this.getCollectionsIds(getDiscoveryURL, tempRoot);
                                }
                            }
                        }
                    }
                } catch (e) {
                    if (e.status || e.http_status) {
                        let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                        if (e.description && e.description.length > 0) {
                            errMessage = e.description;
                        }
                        this.apiRootProcessingErrorURL = e.url;
                        this.showConnectionError = true;
                        this.apiRootProcessingError = errMessage;
                    } else {
                        this.showConnectionError = true;
                        this.apiRootProcessingError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                        console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                    }
                }
            } catch (e) {
                let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                this.apiRootProcessingErrorURL = e.url;
                this.showConnectionError = true;
                this.apiRootProcessingError = errMessage;
                this.noServerResults = false;
                return;
            }
        } else {
            try {
                console.debug('Discovery URL: ' + getDiscoveryURL);
                const header = await this.getCertHeader(this.httpHeaders);
                const data: any = await lastValueFrom(this.httpClient.get(getDiscoveryURL, { headers: header }));

                try {
                    if (data && data.api_roots) {
                        let len = data.api_roots.length;
                        for (let i = 0; i < len; i++) {
                            let apiRoot = this.retrieveAPIRoot(data.api_roots[i]);
                            this.apiRoots.push(apiRoot);
                            try {
                                if (apiRoot && (await this.rootWithPermission(apiRoot, false))) {
                                    let apiRootInfo: any;
                                    try {
                                        apiRootInfo = await lastValueFrom(this.getAPIRootInformation(getDiscoveryURL, apiRoot, header));
                                    } catch (e) {
                                        console.error('Error Name: ', e.name, ' Error Message: ', e.message);
                                        continue;
                                    }
                                    let currentRoot = {
                                        'api-root': apiRoot,
                                        title: apiRootInfo['title'],
                                        description: apiRootInfo['description'],
                                    };

                                    if (
                                        (!apiRootInfo.http_status || (apiRootInfo.http_status && apiRootInfo.http_status !== '403')) &&
                                        !this.rootFound(currentRoot)
                                    ) {
                                        this.apiRootDetails.push({
                                            'api-root': apiRoot,
                                            title: apiRootInfo['title'],
                                            description: apiRootInfo['description'],
                                        });
                                        const tempRoot = this.apiRootDetails[this.apiRootDetails.length - 1];
                                        await this.getCollectionsIds(getDiscoveryURL, tempRoot);
                                    }
                                }
                            } catch (e) {
                                if (e.status || e.http_status) {
                                    let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                                    if (e.description && e.description.length > 0) {
                                        errMessage = e.description;
                                    }
                                    this.apiRootProcessingErrorURL = e.url;
                                    this.showConnectionError = true;
                                    this.apiRootProcessingError = errMessage;
                                    console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                                } else {
                                    this.showConnectionError = true;
                                    this.apiRootProcessingError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                                    console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                                }
                            }
                        }
                    }
                } catch (e) {
                    this.showConnectionError = true;
                    this.apiRootProcessingError = `**Error Name: ${e.name} Error Message ${e.message}**`;
                    console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                    this.noServerResults = false;
                    this.isLoadingStix = false;
                }
            } catch (e) {
                let status = e.status;

                if (!status) {
                    status = e.http_status;
                }

                if (status) {
                    let errMessage = `Error code [${e.status}]: ${this.generateHTTPError(e.status)}`;
                    if (e.description && e.description.length > 0) {
                        errMessage = e.description;
                    }
                    this.apiRootProcessingErrorURL = e.url;
                    this.showConnectionError = true;
                    this.apiRootProcessingError = errMessage;
                    this.noServerResults = false;
                } else {
                    this.showConnectionError = true;
                    this.apiRootProcessingError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                    this.noServerResults = false;
                }
            }
        }
    }

    taxiiHttpReq(method: keyof HttpClient, url: string, options: any = null, body: any = null) {
        const imxHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );

        if (this.taxiiServerType === 'custom' && this.useCert) {
            const payload = {
                method: method,
                url: url,
                reqBody: body,
                observe: options.observe,
            };
            return this.httpClient.post(
                `${this.envService.env.imxServer.url}/proxy-custom/${this.taxiiServer.url.replace('https://', '').replace('http://', '').replace('/', '')}`,
                payload,
                { headers: imxHeaders }
            );
        } else {
            options.headers.set('Authorization', `Basic ${this.taxiiServer.url}:${this.taxiiServer.password}`);

            switch (method) {
                case 'post':
                    return this.httpClient.post(url, body, options);
                case 'delete':
                    return this.httpClient.delete(url, options);
                case 'put':
                    return this.httpClient.put(url, body, options);
                default:
                    return this.httpClient.get(url, options);
            }
        }
    }

    private rootFound(currentRoot) {
        for (let root of this.apiRootDetails) {
            if (root['api-root'] === currentRoot['api-root']) {
                return true;
            }
        }

        return false;
    }

    private getCollectionsIds(url: string, root = undefined) {
        const tempRoot = !root ? this.selectedAPIRoot : root['api-root'];
        console.debug(tempRoot);
        return new Promise(async (resolve, _) => {
            let collectionsIds = [];

            try {
                if (url.endsWith('taxii2/')) {
                    url = url.substring(0, url.length - 7);
                }
                this.rootRequestsCount++;

                try {
                    const data: any = await lastValueFrom(
                        this.taxiiHttpReq('get', url + tempRoot + '/collections/', { headers: await this.getCertHeader(this.httpHeaders) })
                    );
                    this.rootResponsesCount++;
                    if (this.taxiiServerType === 'default') {
                        data.collections = this.collectionsPermitted(tempRoot, data.collections);
                    }

                    if (data.collections && data.collections.length > 0) {
                        for (let i = 0; i < data.collections.length; i++) {
                            collectionsIds.push(data.collections[i]);
                        }

                        let collections = collectionsIds.filter((c) => c[this.permissionType] === true);
                        let currentRoot = { apiPath: tempRoot, title: root.title, childRoot: url + tempRoot + '/', collections: collections };

                        if (collections.length !== 0) {
                            let isDuplicate = false;
                            for (let root of this.apiRoots2) {
                                if (root.apiPath === currentRoot.apiPath) {
                                    isDuplicate = true;
                                    break;
                                }
                            }

                            if (!isDuplicate) {
                                this.apiRoots2.push(currentRoot);
                            }
                            console.debug(currentRoot);
                        }
                    } else {
                        if (!root && data.collections && data.collections.length === 0) {
                            this.apiRoots2.push({ apiPath: tempRoot, childRoot: url + tempRoot + '/', collections: [] });
                            this.showConnectionError = true;
                            this.apiRootProcessingError = '**No Collections available for this API Root**';
                        }
                    }

                    if (this.taxiiServerType === 'default' || this.taxiiServerType === 'sandbox' || this.taxiiServerType === 'cisa') {
                        this.defaultServerApiRoots = this.apiRoots2;
                    }

                    if (this.rootRequestsCount === this.rootResponsesCount) {
                        const configEvent = {
                            type: 'config-loading',
                            value: false,
                        };
                        this.sendData(configEvent);
                    }

                    return resolve(true);
                } catch (error) {
                    this.apiRoots2.push({ apiPath: tempRoot, childRoot: url + tempRoot + '/', collections: [] });
                    console.debug('empty root');
                    let status = error.status;
                    if (!status) {
                        status = error.http_status;
                    }
                    let errMessage = `Error code [${error.status}]: ${this.generateHTTPError(error.status)}`;
                    if (error.description && error.description.length > 0) {
                        errMessage = error.description;
                    }
                    this.apiRootProcessingErrorURL = error.url;
                    this.showConnectionError = true;
                    this.apiRootProcessingError = errMessage;

                    this.noServerResults = false;
                    return resolve(true);
                }
            } catch (e) {
                this.apiRoots2.push({ apiPath: tempRoot, childRoot: url + tempRoot + '/', collections: [] });

                console.error('Error Name: ' + e.name + ' ' + 'Error Message: ' + e.message);
                this.showConnectionError = true;
                this.apiRootProcessingError = `**Error Name: ${e.name} Error Message: ${e.message}**`;
                return resolve(true);
            }
        });
    }

    async rootWithPermission(root, refresh) {
        if (this.taxiiServerType === 'default' && this.permissions) {
            return this.permissions.some((p) => p['api-root'] === root);
        }

        if (this.taxiiServerType === 'default' && !this.permissions) {
            await this.refreshRootCollections(refresh);

            if (this.permissions) {
                return this.permissions.some((p) => p['api-root'] === root);
            }
        }

        return true;
    }

    collectionsPermitted(root, collections) {
        if (this.permissions) {
            let rootSet = this.permissions.find((p) => p['api-root'] === root);

            if (rootSet) {
                return collections.filter((c) => {
                    const collection = rootSet.collections.find((rc) => rc.id === c.id);

                    if (collection) {
                        if (this.permissionType === 'can_read') {
                            return collection.can_read;
                        } else {
                            return collection.can_write;
                        }
                    }
                    return false;
                });
            }
        }
        return [];
    }

    getAPIRootInformation(url: string, api_root: string, httpHeaders): Observable<unknown> {
        if (url.endsWith('taxii2/')) {
            url = url.substring(0, url.length - 7);
        }

        if (this.certFound === true) return this.httpClient.get(url + api_root + '/', { headers: httpHeaders.set('Authorization', this.cert) });

        return this.httpClient.get(url + api_root + '/', { headers: httpHeaders });
    }

    retrieveAPIRoot(apiRootURL): string {
        function findNthOccur(str, ch, N) {
            let occur = 0;
            // Loop to find the 3rd occurrence of '/'
            for (let i = 0; i < str.length; i++) {
                if (str[i] == ch) {
                    occur += 1;
                }
                if (occur == N) return i;
            }
            return -1;
        }

        function findNumberOccur(str, ch) {
            let occur = 0;
            // Loop to find number of occurrences of '/'
            for (let i = 0; i < str.length; i++) {
                if (str[i] == ch) {
                    occur += 1;
                }
            }
            return occur;
        }

        if (apiRootURL.startsWith('https://') || apiRootURL.startsWith('http://')) {
            let count = findNumberOccur(apiRootURL, '/');
            let startofAPIRoot = findNthOccur(apiRootURL, '/', count - 1) + 1;
            if (apiRootURL.endsWith('/')) {
                return apiRootURL.substring(startofAPIRoot, apiRootURL.length - 1);
            } else {
                return apiRootURL.substring(startofAPIRoot, apiRootURL.length);
            }
        } else if (apiRootURL.startsWith('/')) {
            if (apiRootURL.endsWith('/')) {
                return apiRootURL.substring(1, apiRootURL.length - 1);
            } else {
                return apiRootURL.substring(1, apiRootURL.length);
            }
        } else {
            this.showConnectionError = true;
            this.apiRootProcessingError = '**Could not retrieve API Root information from the TAXII server**';
            return null;
        }
    }

    async updateTaxiiServer(source, type, url = null, username = null, password = null) {
        if (!this.envService.env.taxiiServer) {
            await this.envService.wait('taxiiServer');
        }

        if (source === 'guided') {
            localStorage.setItem('taxiiServerType-guided', type);
        } else {
            localStorage.setItem('taxiiServerType', type);
        }

        if (type !== 'custom') localStorage.removeItem('customUrl');

        this.taxiiServerType = type;
        if (type === 'custom') {
            if (url && username && password) {
                this.taxiiServer.url = url;
                this.taxiiServer.username = username;
                this.taxiiServer.password = password;
                this.taxiiServer.required = [];
            }
        } else if (type === 'default' || type === 'a1' || type === 'sandbox') {
            this.taxiiServer.url = this.envService.env.taxiiServer.url;
            this.taxiiServer.username = this.envService.env.taxiiServer.username;
            this.taxiiServer.password = this.envService.env.taxiiServer.password;
            this.taxiiServer.required = this.envService.env.taxiiServer.required;
        } else if (type === 'ais') {
            console.debug(this.envService.env.aisTaxiiProxy);
            this.taxiiServer.url = this.envService.env.aisTaxiiProxy.url;
            this.taxiiServer.username = this.envService.env.aisTaxiiProxy.username;
            this.taxiiServer.password = this.envService.env.aisTaxiiProxy.password;
            this.taxiiServer.required = this.envService.env.aisTaxiiProxy.required;
        }
    }
    /**
     * End of Server Config code.
     */

    sendData(data: any) {
        this.subject.next(data);
    }

    clearData() {
        this.subject.next(null);
    }

    getData(): Observable<any> {
        return this.subject.asObservable();
    }

    sendIceStatus(status: boolean) {
        this.iceStatus.next(status);
    }

    sendMBEStatus(status: boolean) {
        this.mbeStatus.next(status);
    }

    getIceStatus(): Observable<boolean> {
        return this.iceStatus.asObservable();
    }

    getMBEStatus(): Observable<boolean> {
        return this.mbeStatus.asObservable();
    }

    async addComponent(component: any, validate?: boolean) {
        //Modal properties like registry values will not properly store in IndexedDB since the values are a map and we're adding properties to it.
        //Stringifying it and parsing it fixes this issue.
        component = JSON.parse(JSON.stringify(component));
        if (this.origID == 'zzz' + component['id']) {
            this.origID = '';
        } else if (this.origID != '' && this.origID?.substring(0, 3) == 'zzz') {
            this.origID = this.origID.substring(3);
            this.newID = component['id'];
            this.promptDelete = this.findAllTransitiveReferences(this.origID);
        }

        if (validate) {
            let v = new Validator();
            for (let prop in component) {
                if (Array.isArray(component[prop]) && component[prop].length === 0) {
                    delete component[prop];
                }
            }

            let report = { errors: [] };
            this.uploadErrors = '';

            report = validateStix(component);

            if (report.errors.length != 0) {
                let path: any = report.errors[0]['path'];
                if (path.length == 0) {
                    path = report.errors[0]['instance']['type'];
                }
                let message: string = report.errors[0]['message'];
                let err = `${component.id}: ${path} ${message}\n`;

                for (let i = 1; i < report.errors.length; i++) {
                    path = report.errors[i]['path'];
                    if (path.length == 0) {
                        path = report.errors[i]['instance']['type'];
                    }
                    message = report.errors[i]['message'];

                    err = `${err}${path} ${message}\n`;
                }
                err = err + '~~~~~\n\n';

                this.uploadError = err;
                console.error('validation failed');
            }
        }

        return new Promise(async (resolve, reject) => {
            db.imxCache
                .where('id')
                .equals(component.id)
                .toArray()
                .then((result) => {
                    if (result.length < 1) {
                        db.imxCache
                            .put({ id: component.id, index: this.imxCacheIndex++, object: component })
                            .then(async () => {
                                this.addIdentity(component);
                                // When a new object is added to the bundle update the object_refs array in the Report object with its id.
                                await this.updateReportObjRef(component.id, 'add');
                                this.updateMarkingDef();
                                resolve(true);
                            })
                            .catch((error) => {
                                console.error(error);
                                this.updateMarkingDef();
                                reject(false);
                            });
                    } else {
                        db.imxCache
                            .put({ id: component.id, index: result[0].index, object: component })
                            .then(async () => {
                                this.addIdentity(component);
                                // When a new object is added to the bundle update the object_refs array in the Report object with its id.
                                await this.updateReportObjRef(component.id, 'add');
                                this.updateMarkingDef();
                                resolve(true);
                            })
                            .catch((error) => {
                                console.error(error);
                                this.updateMarkingDef();
                                reject(false);
                            });
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    addIdentity(component: any): void {
        if (component.type === 'identity') {
            let ids = JSON.parse(localStorage.getItem('identities')!) || JSON.parse(JSON.stringify({ arr: [] }));
            ids.arr = ids.arr.filter((id) => id['id'] !== component['id']);
            ids.arr.push(component);
            localStorage.setItem('identities', JSON.stringify(ids));
        }
    }

    async validate2(component: any) {
        let res;
        for (let x in component) {
            if (component[x] == '' || component[x] == undefined || component[x] == null) delete component[x];
        }

        try {
            res = await this.validateObj(component);
            console.info(res);
            let errors: any;
            errors = res;
            errors = JSON.parse(errors['body'])['errors'];

            if (errors == 'good') errors = [];

            return errors;
        } catch (error) {
            console.error(error);
        }

        return ['API Error'];
    }

    async validateObj(component: any) {
        const val_url = 'https://wiwv5xk0z8.execute-api.us-east-1.amazonaws.com/test/stix_validator_2_1';
        return this.httpClient.post(val_url, JSON.stringify(component)).toPromise();
    }

    getChildren(childRoots: any[]): Promise<void> {
        console.debug(`Getting children for ${childRoots.length}`);
        let childRequests = [];

        for (let i = 0; i < childRoots.length; i++) childRequests.push(this.getChildRoutes(childRoots[i]));
        return new Promise((resolve, reject) => {
            Promise.all(childRequests)
                .then(() => {
                    console.debug('API Roots loaded');
                    resolve();
                })
                .catch((err) => {
                    console.error('There was an error retrieving child routes');
                    console.error(err);
                    reject(err);
                });
        });
    }

    getChildRoutes(childRoot: string): Promise<void> {
        return new Promise((resolve, _) => {
            // Get Pretty Print for Child Root
            this.isLoading = true;
            this.getCertHeader(this.pullHeaders).then((header) => {
                this.taxiiHttpReq('get', childRoot, { headers: header }).subscribe((prettyPrint: any) => {
                    this.taxiiHttpReq('get', `${childRoot}collections/`, { headers: header }).subscribe((data: any) => {
                        this.isLoading = false;
                        if (data.collections) {
                            let collections = data.collections;
                            if (collections.some((c) => c.can_write)) {
                                this.apiRoots.push({ apiPath: prettyPrint.title, childRoot: childRoot, collections: collections });
                            }
                        } else {
                            console.debug(`No Collections returned for path: ${childRoot}collections/`);
                        }

                        resolve();
                    });
                });
            });
        });
    }

    refreshTaxiiUrls(): Promise<void> {
        console.debug('Retrieving API roots...');
        this.apiRoots = [];
        let getDiscoveryURL = '';

        this.pullHeaders = new HttpHeaders()
            .set('Accept', 'application/taxii+json;version=2.1')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);
        switch (this.taxiiServerType) {
            case 'a1':
                getDiscoveryURL = `${this.taxiiServer.url}`;
                break;
            case 'ais':
                getDiscoveryURL = `${this.taxiiServer.url}taxii2/`;
                break;
            case 'custom':
                getDiscoveryURL = `${this.getCustomURL()}taxii2/`;
                break;
            case 'sandbox':
                getDiscoveryURL = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/taxii2/`;
                break;
            default:
                getDiscoveryURL = `${this.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion + '/'}taxii2/`;
        }

        if (this.taxiiServerType === 'custom') {
            const imxHeaders = new HttpHeaders().set(
                'Authorization',
                `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
            );

            return new Promise(async (resolve, reject) =>
                this.httpClient
                    .get(
                        `${this.envService.env.imxServer.url}/taxii/${this.taxiiServer.url.replace('https://', '').replace('http://', '').replace('/', '')}`,
                        {
                            headers: imxHeaders,
                        }
                    )
                    .toPromise()
                    .then(async (resp: any) => {
                        this.taxiiServer.password = resp.password;
                        this.taxiiServer.username = resp.username;
                        if (resp.useCert) this.useCert = true;

                        const pullHeader = await this.getCertHeader(this.pullHeaders);
                        this.taxiiHttpReq('get', getDiscoveryURL, { headers: pullHeader }).subscribe((data: any) => {
                            this.getChildren(data.api_roots)
                                .then((_) => resolve())
                                .catch((err) => reject(err));
                        });
                    })
            );
        } else {
            return new Promise(async (resolve, reject) => {
                const header = await this.getCertHeader(this.pullHeaders);
                this.taxiiHttpReq('get', getDiscoveryURL, { headers: header }).subscribe((data: any) => {
                    this.getChildren(data.api_roots)
                        .then((_) => resolve())
                        .catch((err) => reject(err));
                });
            });
        }
    }

    selectorValidation(): void {
        let validSelectors = [];
        for (let selectors of this.granularMarkingSelectors) {
            validSelectors.push(selectors);
        }
        for (let x in this.granularMarkings) {
            let currentS = this.granularMarkings[x]['selectors'] || [];
            console.info(currentS);
            for (let a in currentS) {
                console.info(currentS[a]);
                if (validSelectors.includes(currentS[a])) {
                } else {
                    console.info(this.granularMarkings[x]);
                    this.granularMarkings = this.granularMarkings.filter((obj) => obj !== this.granularMarkings[x]);
                    this.selectorValidation();
                }
            }
        }
    }

    // Finds all objects that reference targetId, plus any objects that reference
    // *those* objects, and so on. For example, deleting a domain-name will find
    // observed-data objects that reference it, AND relationship objects that
    // reference those observed-data objects.
    findAllTransitiveReferences(targetId: string): any[] {
        const affectedObjects: any[] = [];
        const seen = new Set<string>([targetId]);
        let idsToCheck: string[] = [targetId];

        while (idsToCheck.length > 0) {
            const directRefs = this.findObjectsReferencing(idsToCheck, seen);
            affectedObjects.push(...directRefs);
            idsToCheck = directRefs.map((obj) => obj.id);
        }

        return affectedObjects;
    }

    // Returns all bundle objects that contain any of the given IDs and haven't
    // already been seen. Marks found objects as seen to avoid duplicates.
    private findObjectsReferencing(ids: string[], seen: Set<string>): any[] {
        const found: any[] = [];
        for (const obj of this.bundle.objects) {
            if (seen.has(obj.id)) continue;
            const objString = JSON.stringify(obj);
            if (ids.some((id) => objString.includes(id))) {
                seen.add(obj.id);
                found.push(obj);
            }
        }
        return found;
    }

    async removeComponent(id: string): Promise<void> {
        if (id.substring(id.length - 2) == '--') return;

        const wasEditing = this.isEditing;
        let target: any;
        let remove: any[] = []; // Deprecated

        let userAcs = localStorage.getItem('user-acs');
        if (userAcs) {
            if (JSON.parse(userAcs).id === id) localStorage.removeItem('user-acs');
        }

        target = await this.db.imxCache.where('id').equals(id).toArray();
        if (target.length === 0) return;

        target = target[0].object;
        // If the object being removed is an Extension Definition
        if (target['type'] && target['type'] == 'extension-definition') {
            this.toplevelProperties = target['extension_properties'] || [];
            //remove = this.removeExtensionDefChildren(id, target);
            this.removeExtensionDefChildren(id, target);
        }
        remove.push(target['id']);

        for (let obj of this.bundle.objects) {
            if (obj.type === 'report' && obj.id !== target.id && obj.object_refs && obj.object_refs.includes(target.id)) {
                obj.object_refs = obj.object_refs.filter((obj) => obj !== target.id);
                await this.addComponent(obj);
            }
        }

        await db.imxCache.where('id').equals(id).delete();

        if (
            target['type'] &&
            target['type'] == 'marking-definition' &&
            target.extensions &&
            target.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']
        ) {
            await this.updateAcsMark(target.id);
        }

        const removedBundle = await this.db.imxCache.orderBy('index').toArray();
        const newBundle = removedBundle.map((obj) => obj.object);
        this.bundle.objects = newBundle.filter((obj) => STIX_OBJECTS_LIST.includes(obj.type));
        this.customObjects = newBundle.filter((obj) => !STIX_OBJECTS_LIST.includes(obj.type));

        if (!wasEditing) {
            this.promptDelete = this.findAllTransitiveReferences(target.id);
        }

        const reportsToNotTrack = JSON.parse(localStorage.getItem('reportsToNotTrack'));

        if (reportsToNotTrack) localStorage.setItem('reportsToNotTrack', JSON.stringify(reportsToNotTrack.filter((elem) => elem !== id)));
        else localStorage.setItem('reportsToNotTrack', JSON.stringify([]));

        // When an existing object is removed from the bundle update the object_refs array in the Report object by removing its id.
        this.updateReportObjRef(id, 'remove');

        this.imxCacheIndex = removedBundle.length > 0 ? removedBundle[removedBundle.length - 1].index + 1 : 1;

        // Remove from langulage contents array if contents' component is removed
        const contentIndex = this.languageContentsArrays.findIndex((c) => c.key === id);

        if (contentIndex > -1) {
            this.languageContentsArrays.splice(contentIndex, 1);
        }

        // Remove Identity object from identities local storage
        if (id.includes('identity--') && id != this.envService.env.defaultIdentity.id) {
            let ids = JSON.parse(localStorage.getItem('identities')!) || JSON.parse(JSON.stringify({ arr: [] }));
            ids.arr = ids.arr.filter((identity) => identity['id'] !== id);
            localStorage.setItem('identities', JSON.stringify(ids));
        }
    }

    removeExtensionDefChildren(id: string, currObject: any, type?: string, queue?: boolean, targetObjID?: any): any[] {
        let remove: any[] = []; // Deprecated
        for (let i in this.customObjects) {
            let obj = this.customObjects[i];
            if ((!targetObjID || targetObjID == obj['id']) && obj['extensions'] && obj['extensions'][id]) {
                if (queue) {
                    if (!type || type == obj['extensions'][id]['extension_type']) {
                        let arr = [id, currObject, obj['id']];
                        if (this.deletionQueue.indexOf(arr) == -1)
                            // No duplicates
                            this.deletionQueue.push(arr);
                        // Can NOT return here in case there are multiple objects that use the Extension Definition
                    }
                } else {
                    // Queues children Custom Objects to be removed
                    if (obj['extensions'][id]['extension_type'].substring(0, 4) == 'new-') {
                        remove.push(obj['id']);
                        this.removedCustomObj.push(obj); // Tracking so that it can be updated in BundleComponent
                    }

                    // Removes Property Extensions
                    else if (obj['extensions'][id]['extension_type'] == 'property-extension') {
                        // Removes the Extension (and Extensions itself if now empty)
                        delete obj['extensions'][id];
                        if (JSON.stringify(obj['extensions']).length == 2) delete obj['extensions'];
                    }

                    // Removes Toplevel Property Extensions
                    else if (obj['extensions'][id]['extension_type'] == 'toplevel-property-extension') {
                        // Removes the Toplevel Properties
                        let props = this.toplevelProperties; // Possible Extension Properties
                        for (let prop of props) {
                            delete obj[prop];
                        }

                        // Removes the Extension (and Extensions itself if now empty)
                        delete obj['extensions'][id];
                        if (JSON.stringify(obj['extensions']).length == 2) delete obj['extensions'];
                    } else {
                        console.error('Oops - this is not a valid Extension Type: ' + obj['extensions'][id]['extension_type']);
                    }
                }
            }
        }
        return remove;
    }

    getObjectFromID(id: string): any {
        for (let obj of this.bundle.objects.concat(this.customObjects)) {
            if (obj['id'] == id) {
                return obj;
            }
        }
        return undefined;
    }

    removeFromIdentityLocalStorage(id: string): void {
        let idStorage: any = localStorage.getItem('identities');
        if (idStorage) {
            try {
                idStorage = JSON.parse(idStorage);
                const idStorageIndex = idStorage.arr.findIndex((idStorage) => idStorage.id === id);
                if (idStorageIndex !== -1) {
                    idStorage.arr.splice(idStorageIndex, 1);
                    localStorage.setItem('identities', JSON.stringify(idStorage));
                }
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }
    }

    refreshBundle(newId = true, id = null): Bundle {
        this.bundle = new Bundle(this.bundle.objects);
        if (newId) {
            this.bundle.id = `bundle--${uuidV4()}`;
        } else {
            this.bundle.id = id;
        }

        return this.bundle;
    }

    clearBundle(): void {
        this.updateMarkingDef();
        this.unmarkBundleObjectsAsPublished(this.bundle);
        this.bundle = new Bundle([]);
        this.customObjects = [];
        this.externalReferences = [];
        this.granularMarkings = [];
        this.extensions = [];
        this.contents = [];
        this.objectMarkingReferences = [];
        this.reportName = '';
        this.imxCacheIndex = 1;
        db.imxCache.clear();

        localStorage.removeItem('hasAnalyst1Evidence');
        localStorage.removeItem('evidence');
        localStorage.removeItem('acs-type');
        localStorage.removeItem('user-acs');
        localStorage.removeItem('report-name');
        localStorage.removeItem('identities');
        localStorage.setItem('identity', this.envService.env.defaultIdentity.id);
    }

    publishBundle(url, username, password, type, collection): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.bundle.objects.length === 0) {
                // Add Announcement Service Here
                console.warn('Attempt to publish was stopped since bundle contained 0 objects');
                reject('Attempt to publish was stopped since bundle contained 0 objects');
            }

            if ((type === 'keycloak' && url) || (url && username && password)) {
                let push_headers = {
                    headers: new HttpHeaders({
                        Accept: 'application/taxii+json;version=2.1',
                        'Content-Type': 'application/taxii+json;version=2.1',
                        Authorization: 'Basic ' + btoa(`${username}:${password}`),
                    }),
                };
                this.isLoading = true;

                const bundle = JSON.parse(JSON.stringify(this.bundle));
                const custom = JSON.parse(JSON.stringify(this.customObjects));

                custom.forEach((elem) => {
                    bundle.objects.push(elem);
                });

                this.ogSubmission = JSON.stringify(this.bundle);
                if (this.taxiiServerType === 'ais' || this.taxiiServerType === 'cisaAis')
                    bundle.objects.forEach((obj) => {
                        if (obj.granular_markings) delete obj.granular_markings;
                    });

                this.getCertHeader(push_headers.headers).then((header) => {
                    this.taxiiHttpReq('post', url, { headers: header }, JSON.stringify(bundle))
                        .toPromise()
                        .then(async (result) => {
                            this.saveStatus(result, url, collection, bundle);
                            console.debug(result);
                            console.debug('Publication of STIX bundle was successful');
                            this.markBundleObjectsAsPublished(bundle);

                            //For now only push CUI if TAXII is default
                            if (this.taxiiServerType === 'default') {
                                // await this.publishCui(bundle);
                            }

                            this.isLoading = false;
                            resolve(result);
                        })
                        .catch((err) => {
                            this.saveStatus(undefined, url, collection, bundle);
                            console.error('There was an error publishing STIX bundle');
                            console.error(err);
                            this.isLoading = false;
                            reject(err);
                        });
                });
            } else {
                console.error("Didn't receive all the parameters required for publication of STIX bundle");
                console.error('URL Received: ', url);
                console.error('should not fail from no username or password');
                console.error('Username Received: ', username);
                console.error('Password Received: ', password);
                reject("Didn't receive all the parameters required for publication of STIX bundle");
            }
        });
    }

    async saveStatus(res, url, collection, bundle, cui = false) {
        try {
            if (res?.status && !isNaN(res.status)) res = undefined;
        } catch (err) {
            console.error(err);
        }

        try {
            if (localStorage.getItem('saved-status')) this.savedStatus = JSON.parse(localStorage.getItem('saved-status')!) || [];
        } catch (e) {
            console.error('Error parsing saved cached bundles with message: ', e);
            localStorage.removeItem('saved-bundles');
        }
        let urlArr = url.split('/');

        let result = {
            id: 'N/A',
            status: 'unknown',
            total_count: bundle.objects.length,
            success_count: 0,
            failure_count: bundle.objects.length,
            pending_count: 0,
            request_timestamp: new Date().toISOString(),
            failures: bundle.objects,
            original_submission: cui ? bundle : JSON.parse(this.ogSubmission),
        };
        if (res) {
            res['original_submission'] = cui ? bundle : JSON.parse(this.ogSubmission);
            result = res;
        }

        //Update later to work with multiple reports/no report present
        let docName = `${this.reportName}.stix.json`;
        if (this.reportName.includes('.stix.json')) docName = this.reportName;
        else if (this.reportName.includes('.json')) docName = this.reportName.replace('.json', '.stix.json');

        let tempStatus = {
            res: result,
            type: this.taxiiServerType,
            taxiiServer: this.taxiiServer.url,
            root: urlArr[5],
            collection: collection,
            url: this.getStatusUrl(res, urlArr),
            docName: docName,
        };

        this.tempStatusCallback = await this.submissions.postSubmission(tempStatus);

        this.savedStatus.push(tempStatus);

        localStorage.setItem('saved-status', JSON.stringify(this.savedStatus)); // Save in cache
    }

    getStatusUrl(res, urlArr) {
        let url = '';

        for (let i = 0; i < 6; i++) {
            url += `${urlArr[i]}/`;
        }

        url += `status/`;

        if (res?.id) {
            url += `${res.id}/`;
        }

        return url;
    }

    cleanEmptyString() {}

    getUUIDFrIdContributingProperties(componentData) {
        const namespace = '00abedb4-aa42-466c-9c01-fed23315a9b7';
        let uuidString: any = {};

        this.idContributingProperties = IdContributingProperties;
        let index = this.idContributingProperties.findIndex((obj) => Object.keys(obj)[0] === componentData.type);

        if (index > -1) {
            for (let prop of this.idContributingProperties[index][componentData.type]) {
                if (prop === 'hashes') {
                    let hashes: any = this.stringArrays.get('hashes') || [];
                    let hashFound = false;
                    const hashOrder = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];

                    const hashObj = {};

                    hashes.forEach((hash) => {
                        const split = hash.split(': ');
                        hashObj[split[0]] = split[1];
                    });

                    hashOrder.forEach((hash) => {
                        if (hashFound) return;

                        if (hashObj[hash]) {
                            hashFound = true;
                            uuidString.hashes = { [hash]: hashObj[hash] };
                        }
                    });

                    if (!hashFound && hashes?.length > 0) {
                        let temp = hashes[0].split(': ');
                        uuidString.hashes = { [temp[0]]: temp[1] };
                    }

                    continue;
                }

                if (prop === 'values' && componentData.type === 'windows-registry-key') {
                    uuidString[prop] = componentData['values'];
                    continue;
                }
                if (prop === 'language_contents' && componentData.type === 'language-content') {
                    uuidString[prop] = componentData[prop];
                    continue;
                }

                if (componentData.type === 'network-traffic') {
                    if (prop === 'protocols') {
                        uuidString[prop] = this.stringArrays.get('protocols');
                        continue;
                    } else if (prop === 'start' && componentData[prop]) {
                        uuidString[prop] = new Date(componentData[prop]).toISOString();
                        continue;
                    } else if (prop === 'end' && componentData[prop]) {
                        uuidString[prop] = new Date(componentData[prop]).toISOString();
                        continue;
                    } else if (prop === 'src_port') {
                        uuidString[prop] = parseInt(componentData[prop]);
                        continue;
                    } else if (prop === 'dst_port') {
                        uuidString[prop] = parseInt(componentData[prop]);
                        continue;
                    } else if (prop === 'extensions') {
                        if (this.extensions.length == 0) continue;

                        const extensions = {};
                        for (const extension of this.extensions) {
                            for (const extProp in extension) {
                                extensions[extProp] = extension[extProp];
                            }
                        }

                        uuidString[prop] = extensions;
                        continue;
                    }
                }

                if (prop === 'account_type' && componentData.type === 'user-account') {
                    if (componentData[prop]) {
                        uuidString[prop] = componentData[prop][0];
                    }
                    continue;
                }

                if (prop === 'number') {
                    uuidString[prop] = Number(componentData[prop]);
                    continue;
                }

                if (prop === 'url_value' && componentData.type === 'url') {
                    uuidString['value'] = componentData[prop];
                    continue;
                }

                if (componentData.type === 'observed-string') {
                    if (prop === 'purpose') {
                        uuidString[prop] = componentData[prop][0];
                        continue;
                    }
                    if (prop === 'value') {
                        uuidString[prop] = componentData[prop];
                        continue;
                    }
                }

                if (componentData[prop] !== '') {
                    uuidString[prop] = componentData[prop];
                }
            }
        }

        for (const key in uuidString) {
            if (
                uuidString[key] == '' ||
                Number.isNaN(uuidString[key]) ||
                uuidString[key] == undefined ||
                uuidString[key] == null ||
                (Array.isArray(uuidString[key]) && uuidString[key].length == 0) ||
                JSON.stringify(uuidString) == '{}'
            )
                delete uuidString[key];
        }
        if (!Object.keys(uuidString).length) {
            return uuidV4();
        } else {
            return uuidV5(canonicalize(uuidString), namespace);
        }
    }

    getUUIDFrIdContributingPropertiesVT(componentData) {
        const namespace = '00abedb4-aa42-466c-9c01-fed23315a9b7';
        let uuidString: any = {};

        this.idContributingProperties = IdContributingProperties;
        let index = this.idContributingProperties.findIndex((obj) => Object.keys(obj)[0] === componentData.type);

        if (index > -1) {
            this.idContributingProperties[index][componentData.type].forEach((prop) => {
                if (prop === 'hashes') {
                    const hashOrder = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
                    let hashFound = false;

                    hashOrder.forEach((hash) => {
                        if (hashFound) return;

                        if (componentData['hashes'][hash]) {
                            hashFound = true;
                            uuidString.hashes = { [hash]: componentData['hashes'][hash] };
                        }
                    });

                    if (!hashFound) {
                        const key = Object.keys(componentData['hashes'])?.[0];

                        if (key) uuidString.hashes = { [key]: componentData['hashes'][key] };
                    }

                    return;
                }

                if (prop === 'number') {
                    uuidString[prop] = Number(componentData[prop]);
                    return;
                }

                // VT url SCOs store the value under `value`; the id-contributing prop is `url_value`.
                // Bridge it the same way the non-VT id path does, so each URL gets a distinct id.
                if (prop === 'url_value' && componentData.type === 'url') {
                    if (componentData['value'] !== undefined) uuidString['value'] = componentData['value'];
                    return;
                }

                if (componentData[prop] !== '') {
                    uuidString[prop] = componentData[prop];
                }
            });
        }

        if (!Object.keys(uuidString).length) {
            return uuidV4();
        } else {
            return uuidV5(canonicalize(uuidString), namespace);
        }
    }

    convertLanguageContentsToObject(contents: any): any {
        let contentObjs = {};
        contents.forEach((c) => {
            let lang = c.lang.split(', ');
            const contentTemp = new Content(c.lang, c.fieldName, c.fields);
            const contentObj = JSON.parse(`{ ${contentTemp.toString()} }`);
            for (let l of lang) contentObjs[l] = contentObj[l];
        });
        return contentObjs;
    }

    convertLanguageContentsToRawData(contents: any): any {
        let rawData = { lang: '', fields: {} };
        let langArr = [];
        for (const lang in contents) {
            langArr.push(lang);
            for (const prop in contents[lang]) {
                rawData.fields['[' + lang + '] ' + prop] = contents[lang][prop];
            }
        }
        rawData.lang = langArr.join(', ');
        return rawData;
    }

    setLanguageContentsArray() {
        this.languageContentsArrays = [];
        this.bundle.objects.forEach((obj) => {
            if (obj.type === 'language-content' && obj.contents) {
                let contentTmp = { key: '', value: [] };
                contentTmp.key = obj.id;
                if (Array.isArray(obj.contents)) contentTmp.value = obj.contents;
                else contentTmp.value.push(this.convertLanguageContentsToRawData(obj.contents));
                this.languageContentsArrays.push(contentTmp);
            }
        });
    }

    convertLanguageContentsToArray(component: any) {
        const contentIndex = this.languageContentsArrays.findIndex((c) => c.key === component.id);

        if (contentIndex > -1 && !Array.isArray(component.contents)) {
            component.contents = this.languageContentsArrays[contentIndex].value;
            this.languageContentsArrays.splice(contentIndex, 1);
        }
    }

    getStatus(url) {
        try {
            this.httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

            if (this.certFound === true) return this.taxiiHttpReq('get', url, { headers: this.httpHeaders.set('Authorization', this.cert) });
            return this.taxiiHttpReq('get', url, { headers: this.httpHeaders });
        } catch (e) {
            return null;
        }
    }

    getCustomObjects(): any[] {
        return this.customObjects;
    }

    isCustomObject(obj: any): boolean {
        let temp = JSON.stringify(obj['extensions']);
        const typeRegex = new RegExp(/^.*\"(new-s[drc]o)\".*$/);
        return typeRegex.test(temp);
    }

    // The reason for the copy is that if we edit component directly, we edit the bundle because of the linkages going on.
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

    /**
     * Currently just returns the input with '-' turned to ' ' and each word title cased
     *
     * @param str
     * @returns
     */
    toTitle(str: string): string {
        return str.replace(/-/g, ' ').replace(/\w\S*/g, function (txt) {
            return (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).replace(/C&c/g, 'C&C').replace(/Xss/g, 'XSS');
        });
    }

    getComponentDisplay(component: any): string {
        if (component.type) {
            let componentDisplay = '';

            switch (component.type) {
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
                case 'impact':
                    componentDisplay = component.impact_category
                        ? component.impact_category.charAt(0).toUpperCase() + component.impact_category.slice(1)
                        : `(${component.id})`;
                    if (component.impact_category && component.criticality) componentDisplay += ` (${component.criticality})`;
                    break;
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
                        let sourceRefObject = this.bundle.objects.filter((obj) => obj.id === component.source_ref);
                        let targetRefObject = this.bundle.objects.filter((obj) => obj.id === component.target_ref);
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
                    else componentDisplay = `<NO NAME> (${component.id})`;
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
                case 'observed-string': {
                    if (component.value) componentDisplay = component.value;
                    break;
                }
                default:
                    return component.name ? component.name : `<NO NAME> (${component.id})`;
            }

            return componentDisplay;
        } else return component.name ? component.name : '<NO NAME>';
    }

    getBaseURLs() {
        let baseAdminURL = !this.envService.env.adminServer.apiVersion
            ? this.envService.env.adminServer.url + 'admin/'
            : this.envService.env.adminServer.url + 'admin/' + this.envService.env.adminServer.apiVersion + '/';
        let baseTaxiiURL = !this.envService.env.taxiiServer.apiVersion
            ? this.envService.env.taxiiServer.url + 'taxii/'
            : this.envService.env.taxiiServer.url + 'taxii/' + this.envService.env.taxiiServer.apiVersion + '/';

        return {
            baseAdminURL,
            baseTaxiiURL,
        };
    }

    getComponentId(component: any, i: number, j: number, k: number): string {
        let result = `${this.getComponentDisplay(component)}${i}${j}${k}`;

        return result;
    }

    getTlpOptions(version: string) {
        let tempOptions = [];
        let tlpOptions = [];
        switch (version) {
            case 'v1':
                tempOptions = TLP_OPTIONS;
                break;
            case 'v2':
                tempOptions = TLP20_OPTIONS;
                break;
            default:
                tempOptions = TLP20_OPTIONS;
                break;
        }

        for (let option of tempOptions) {
            let found = false;
            if (this.getGuided()) {
                for (let disabledColor of this.envService.env.tlpConfig.disabledTlpColors) {
                    if (version === disabledColor.version && option.name === disabledColor.name) {
                        found = true;
                    }
                }
            }

            if (!found) {
                let keyArray = option.name.split(':');
                let keyArray2 = keyArray[1].split('+');
                let css = `${keyArray[0]}-${keyArray2[0]} `;

                for (let i in keyArray2) {
                    keyArray2[i] = keyArray2[i].toLowerCase();
                    let firstLetter = keyArray2[i][0].toUpperCase();
                    keyArray2[i] = `${firstLetter}${keyArray2[i].substring(1, keyArray2[i].length)}`;
                }
                let name = `${keyArray2.join('+')} ${keyArray[0]}`;
                let tlpShortHand = option.name.replace(':', '');
                tlpShortHand = tlpShortHand.replace('+', '');
                tlpOptions.push({ key: option.name, value: option.id, name: name, css: css, description: option.description, short: tlpShortHand });
            }
        }
        return tlpOptions;
    }

    getCurrentTlp(marking_ref) {
        for (let option of TLP_OPTIONS) {
            if (option.id === marking_ref) {
                let result: any = option;
                result.version = 'v1';
                return result;
            }
        }
        for (let option of TLP20_OPTIONS) {
            if (option.id === marking_ref) {
                let result: any = option;
                result.version = 'v2';
                return result;
            }
        }

        return undefined;
    }

    clearTlpPerVersion(version) {
        const tlpOptions: any = version === 'v1' ? TLP_OPTIONS : TLP20_OPTIONS;
        const refIndex = this.objectMarkingReferences.findIndex((o) => {
            return tlpOptions.find((tlpOpt) => tlpOpt.id === o);
        });
        if (refIndex >= 0) {
            this.objectMarkingReferences.splice(refIndex, 1);
        }
    }

    populateCreatedByRef() {
        let ids = JSON.parse(JSON.stringify({ arr: [] }));
        if (localStorage.getItem('identities')) {
            try {
                ids = JSON.parse(localStorage.getItem('identities')!) || JSON.parse(JSON.stringify({ arr: [] }));
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
                localStorage.removeItem('identities');
            }
        }
        let arr = ids.arr;
        const temp = this.bundle.objects;
        for (let i = 0; i < temp.length; i++) if (temp[i].id.includes('identity--')) if (!arr.find((a) => a.id === temp[i].id)) arr.push(temp[i]);

        return arr;
    }

    populateSightingOfRef() {
        const regex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
        let invalid_list = SCO_LIST.slice(); //Can only be an SDO or custom (not any other object type)
        invalid_list.push('relationship', 'sighting', 'language-content', 'marking-definition', 'extension-definition', 'bundle');
        let arr = [];
        const temp = this.bundle.objects;
        for (let i = 0; i < temp.length; i++) {
            const matches = temp[i].id.match(regex);
            if (matches && invalid_list.indexOf(matches[1]) == -1) arr.push(temp[i].id);
        }
        return arr;
    }

    captializeFirstLetter(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    generateHTTPError(e): string {
        if (e) {
            e = e.toString();
        }
        let errMessage = '';
        if (this.taxiiServerType != 'default' && this.taxiiServerType != 'a1' && this.taxiiServerType != 'raw') {
            errMessage = ' Reach out to server admin or create a support request using the link in the bottom right for further assistance.';
        } else {
            errMessage = ' Please create a support request using the link in the bottom right for further assistance.';
        }

        switch (e) {
            case '0':
                errMessage = 'Could not reach server - Try double checking your url/credentials and refreshing the page.' + errMessage;
                break;
            case '200':
            case '201':
            case '202':
                errMessage = 'Success! Please file a request through the help portal if you can see this message';
                break;
            case '400':
                errMessage = 'Bad Request - Double check url/syntax and try again.' + errMessage;
                break;
            case '401':
                errMessage = 'Unauthorized - Please confirm your credentials and try again.' + errMessage;
                break;
            case '403':
                errMessage = 'Resource Forbidden - Confirm url and credentials if you believe this is a mistake.' + errMessage;
                break;
            case '404':
                errMessage = 'Page Not Found - Confirm your url and try again.' + errMessage;
                break;
            case '405':
                errMessage = 'Method Not Allowed - The targeted resource does not allow for this operation.' + errMessage;
                break;
            case '410':
                errMessage = 'Gone - The specified resource is no longer available.' + errMessage;
                break;
            case '412':
                errMessage = 'Precondition Failed - Request is missing required headers.' + errMessage;
                break;
            case '413':
                errMessage = 'Payload Too Large - Request is larger than permitted by the server.' + errMessage;
                break;
            case '414':
                errMessage = 'URI Too Long - Request url is longer than permitted by the server.' + errMessage;
                break;
            case '418':
                errMessage = "I'm a Teapot - The server refuses the attempt to brew coffee with a teapot.";
                break;
            case '501':
                errMessage = 'Not Implemented - The server does not support this request.' + errMessage;
                break;
            case '502':
                errMessage = 'Bad Gateway' + errMessage;
                break;
            case '503':
                errMessage = 'Service Unavailable - Server may be overloaded or down for maintenance' + errMessage;
                break;
            case '504':
                errMessage = 'Gateway Timeout' + errMessage;
                break;
            case '511':
                errMessage = 'Network Authentication Required' + errMessage;
                break;
            default:
                break;
        }
        return errMessage;
    }

    updateLatency(announcement: AnnouncementService) {
        try {
            let httpHeaders = new HttpHeaders()
                .append('Content-Type', 'application/json')
                .append('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);
            let getURL = this.taxiiServer.url.replace('/taxii/v2.1-os', '') + 'taxii/health/';

            this.getCertHeader(httpHeaders).then((header) => {
                this.httpClient.get<any>(getURL, { headers: header, observe: 'response' }).subscribe(
                    (manifestResp) => {
                        this.latency = manifestResp.body;
                        this.latency.serverLatency =
                            Math.round(this.latency.taxii2_endpoint.sumResponseMillis / this.latency.taxii2_endpoint.n) + 'ms';
                        this.latencyInit = true;
                    },
                    (err) => {
                        let errMessage = `Unable to get latency data. Error code [${err.status}]: ${this.generateHTTPError(err.status)}`;
                        console.error(errMessage);
                        if (err.status === 401) announcement.show('Error connecting to TAXII Server:', errMessage, 'error', false);
                        this.latency = {};
                        this.latencyInit = true;
                    }
                );
            });
        } catch (e) {
            console.error('Latency error: ' + e);
            this.latency = {};
            return;
        }
    }

    setGuided(guided) {
        localStorage.setItem('isGuided', guided);
        this.guidedUI = guided;
    }

    getGuided() {
        const guided = localStorage.getItem('isGuided');
        this.guidedUI = guided === 'true';
        return this.guidedUI;
    }

    setLocalStorage(name, value) {
        localStorage.setItem(name, value);
    }

    getLocalStorage(name) {
        return localStorage.getItem(name);
    }

    getSandbox() {
        let getDiscoveryURL = '';

        let httpHeaders = new HttpHeaders()
            .set('Accept', '*/*')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

        getDiscoveryURL = `${this.envService.env.taxiiServer.url}admin/${this.envService.env.adminServer.apiVersion + '/'}sandbox/`;

        this.getCertHeader(httpHeaders).then((header) => {
            try {
                this.httpClient.get(getDiscoveryURL, { headers: header }).subscribe((data: any) => {
                    this.sandbox = null;
                    if (data && data.length > 0) {
                        this.sandbox = data[data.length - 1];
                    }
                });
            } catch (e) {
                let errMessage = `Unable to get query results.\nError code [${e.status}]`;
                return;
            }
        });
    }

    getUnassignedObjects() {
        const bundle = this.bundle.objects.filter((o) => {
            if (o.object_marking_refs && o.object_marking_refs.length > 0) {
                let unassigned = true;
                o.object_marking_refs.forEach((omr) => {
                    let foundTLP;
                    foundTLP = this.getTlpOptions('v2').find((opt) => opt.value === omr);
                    if (!foundTLP) foundTLP = this.getTlpOptions('v1').find((opt) => opt.value === omr);
                    if (foundTLP) {
                        unassigned = false;
                    }
                });

                return unassigned;
            }
            return true;
        });

        this.customObjects.forEach((o) => {
            if (o.object_marking_refs && o.object_marking_refs.length > 0) {
                let unassigned = true;
                o.object_marking_refs.forEach((omr) => {
                    let foundTLP;
                    foundTLP = this.getTlpOptions('v2').find((opt) => opt.value === omr);
                    if (!foundTLP) foundTLP = this.getTlpOptions('v1').find((opt) => opt.value === omr);
                    if (foundTLP) {
                        unassigned = false;
                    }
                });

                if (unassigned) return bundle.push(o);
                else return null;
            }
            return bundle.push(o);
        });

        return bundle;
    }

    countTLP() {
        const tlpCounts = [];

        const assignedObjMarkingRefObjs = this.bundle.objects.filter((o) => o.object_marking_refs && o.object_marking_refs.length > 0);

        this.customObjects.forEach((o) => {
            if (o.object_marking_refs && o.object_marking_refs.length > 0) assignedObjMarkingRefObjs.push(o);
        });

        const tlpOptionsList = [this.getTlpOptions('v2'), this.getTlpOptions('v1')];
        tlpOptionsList.forEach((tlpOptions) =>
            tlpOptions.forEach((tlpOpt) => {
                let count = 0;
                assignedObjMarkingRefObjs.filter((assignedObj) => {
                    const foundIndex = assignedObj.object_marking_refs.findIndex((omr) => omr === tlpOpt.value);
                    if (foundIndex > -1) {
                        count++;
                    }
                });
                tlpCounts.push({
                    tlp: tlpOpt,
                    count,
                });
            })
        );
        return tlpCounts;
    }

    getTlpStyle(tlp) {
        switch (tlp) {
            case 'TLP:CLEAR':
                return 'tlp-clear-bundle';
            case 'TLP:GREEN':
                return 'tlp-green-bundle';
            case 'TLP:AMBER':
                return 'tlp-amber-bundle';
            case 'TLP:AMBER+STRICT':
                return 'tlp-amber-bundle';
            case 'TLP:RED':
                return 'tlp-red-bundle';
            case 'TLP:WHITE':
                return 'tlp-white-bundle';
            default:
                return '';
        }
    }

    markBundleObjectsAsPublished(bundle: any) {
        const published_objects = JSON.parse(localStorage.getItem('new_version_objects')) || [];
        if (published_objects.length > 0) {
            for (let object of bundle.objects) {
                if (!published_objects.includes(object.id)) {
                    published_objects.push(object.id);
                }
            }
        } else {
            for (let object of bundle.objects) {
                published_objects.push(object.id);
            }
        }
        localStorage.setItem('new_version_objects', JSON.stringify(published_objects));
    }

    addString(entry: string, key: string): void {
        if (this.stringArrays.has(key)) {
            const newStringArray = this.stringArrays.get(key)!;
            if (newStringArray.indexOf(entry) == -1) {
                newStringArray.push(entry);
                this.stringArrays.set(key, newStringArray);
            }
        } else this.stringArrays.set(key, [entry]);
    }

    deleteString(entry: string, key: string) {
        let curr = this.stringArrays.get(key);
        if (!curr) {
            return;
        }
        curr = curr.filter((obj) => obj !== entry);
        this.stringArrays.set(key, curr);
        if (key == 'extension_types') {
            let subKey = key.substring(0, 7);
            switch (subKey) {
                case 'new-sdo':
                case 'new-sro':
                case 'new-sco':
                    break;
            }

            if (this.isEditing) {
                const id = this.currentID;
                const currObject = this.getObjectFromID(id);
                this.removeExtensionDefChildren(id, currObject, entry, true);
            }
        }
    }

    unmarkBundleObjectsAsPublished(bundle: any) {
        let published_objects = JSON.parse(localStorage.getItem('new_version_objects')) || [];
        let previous_published_objects = JSON.parse(localStorage.getItem('previous_new_version_objects')) || [];
        for (let pre of previous_published_objects) {
            published_objects = published_objects.filter((obj) => obj !== pre);
        }
        localStorage.setItem('new_version_objects', JSON.stringify(published_objects));
    }

    async updateAcsMark(id) {
        return new Promise((resolve, reject) => {
            db.imxCache.toArray().then((objs) => {
                let newVersion = localStorage.getItem('new_version_objects');
                if (newVersion) newVersion = JSON.parse(newVersion);
                objs.forEach((obj) => {
                    if (!obj.object.object_marking_refs) return;

                    if (newVersion) {
                        if (newVersion.includes(obj.object.id)) obj.object.modified = new Date().toISOString();
                    }

                    obj.object.object_marking_refs = obj.object.object_marking_refs.filter((objId) => objId !== id);
                    if (obj.object.object_marking_refs.length === 0) delete obj.object.object_marking_refs;
                });

                db.imxCache
                    .bulkPut(objs)
                    .then((result) => resolve(true))
                    .catch((err) => resolve(true));
            });
        });
    }

    async updateReportObjRef(refid = '', flag = '') {
        return new Promise((resolve, reject) => {
            const cachedCart = JSON.parse(localStorage.getItem('cached-cart'));
            db.imxCache
                .where('id')
                .startsWithIgnoreCase('report')
                .toArray()
                .then((reportObjs) => {
                    for (let obj of reportObjs) {
                        obj = obj.object;
                        //If the report object belongs to guided cart, skip updating obj ref
                        if (this.guidedUI && cachedCart && cachedCart.length > 0) {
                            if (
                                cachedCart.some((cart) => {
                                    if (cart['report-assessment'] && cart['report-assessment']['report']) {
                                        return cart['report-assessment']['report'].some((rep) => rep.id === obj.id);
                                    } else {
                                        return false;
                                    }
                                })
                            ) {
                                continue;
                            }
                        }
                    }

                    if (reportObjs.length > 0) {
                        const objectsToAdd = reportObjs.map((object) => {
                            return { id: object.id, index: object.index, object: object.object };
                        });

                        db.imxCache.bulkPut(objectsToAdd);
                    }

                    resolve(true);
                });
        });
    }

    getCert(header: HttpHeaders, cb: any) {
        if (this.certFound === true) {
            const newHeader = header.set('Authorization', this.cert);
            cb(newHeader);
            return;
        } else if (this.certFound === false) {
            cb(header);
            return;
        }
        if (this.taxiiServerType !== 'default') {
            cb(header);
            return;
        }

        let httpHeaders = new HttpHeaders().set(
            'Authorization',
            `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
        );

        this.httpClient.get<any>(this.envService.env.imxServer.url + '/cert', { headers: httpHeaders }).subscribe(
            (res) => {
                if (res.data) {
                    const newHeader = header.set('Authorization', res.data.pkcs10);
                    this.cert = res.data.pkcs10;
                    this.certFound = true;
                    cb(newHeader);
                } else {
                    this.certFound = false;
                    cb(header);
                }
            },
            (err) => {
                this.certFound = false;
                cb(header);
            }
        );
    }

    async getCertHeader(header: HttpHeaders) {
        try {
            if (this.certFound === true) {
                const newHeader = header.set('Authorization', this.cert);
                return newHeader;
            } else if (this.certFound === false) {
                return header;
            }
            if (this.taxiiServerType !== 'default') {
                return header;
            }

            let httpHeaders = new HttpHeaders().set(
                'Authorization',
                `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`
            );

            const res: any = await lastValueFrom(this.httpClient.get<any>(this.envService.env.imxServer.url + '/cert', { headers: httpHeaders }));

            if (res.data) {
                const newHeader = header.set('Authorization', res.data.pkcs10);
                this.cert = res.data.pkcs10;
                this.certFound = true;
                return newHeader;
            } else {
                this.certFound = false;
                return header;
            }
        } catch (err) {
            this.certFound = false;
            return header;
        }
    }

    showTimezoneAndOffset(timezone) {
        return `${timezone} - (GMT${moment.tz(timezone).format('Z')})`;
    }

    convertToUTC(prop_name, time) {
        if (!time) return null;

        time = new Date(time);
        let utc = moment.tz(this.timezones[prop_name]).format('Z');

        let result = {};

        if (utc !== '') {
            return new Date(`${time.toString().substring(0, 24)} ${utc}`);
        }

        return time;
    }

    getServerValidationTooltip(validation: any = '') {
        let tooltip = '';
        switch (validation.checkLenientValue) {
            case 'DONT_CHECK_CUSTOM_OBJECTS': {
                tooltip =
                    'The STIX specification has deprecated custom objects in favor of the extension mechanism. By default, the server fails those deprecated objects. Selecting pass would allow the deprecated custom object to be published; the returned status message will NOT include any mention of this potential issue.';
                break;
            }
            case 'DONT_CHECK_CUSTOM_PROPERTIES': {
                tooltip =
                    'The STIX specification has deprecated custom properties within objects in favor of the extension mechanism. By default, the server fails objects with custom properties. Selecting pass would allow objects with custom properties to be published; the returned status message will NOT include any mention of this potential issue.';
                break;
            }
            case 'DONT_CHECK_DUPLICATES': {
                tooltip =
                    'The TAXII specification does not provide direction on the server action when presented with a previously received object. By default, the server fails identical objects. Selecting pass would allow identical objects to be published; the returned status message will NOT include any mention of this potential issue. In the absence of other leniencies, objects with the same global identifier but different content will NOT replace the existing content.';
                break;
            }
            case 'DONT_CHECK_NA_COMMONS': {
                tooltip =
                    'The STIX specification identifies common object members that are not applicable to specific object types. By default, objects having members identified in the specification as not applicable will be identified in the status message but will still be accepted. Selecting pass allows members like Created By Ref in SCOs.';
                break;
            }
            case 'DONT_CHECK_REVOKED': {
                tooltip =
                    'The STIX specification requires that once a version of an object is submitted that has the revoked member true, no further versions of the objects are allowed. By default, objects with unique versions submitted after one with revoked set will be identified in the status message but still accepted. Selecting pass informs the server to accept other-versioned objects.';
                break;
            }
            case 'DONT_EXTENSION_VALIDATE': {
                tooltip =
                    'Custom extension are defined within extension-definiion objects; these objects have a schema member which indicates a JSON Schema with which the object content can be validated. The server recognizes incoming objects with extensions, attempts to locate the definition, follows the definition to the schema, and then, by default, validates the object content against the JSON Schema. By default, server would fail missing schema and invalid object with the status message but still return accepted. Selecting pass prevents all attempts at validating extension content; the dangerous implication is that downstream machine interpretation of the content will be broken.';
                break;
            }
            case 'DONT_RESPECT_CREATOR': {
                tooltip =
                    'The best practices document strongly indicates that only the originating creator of an object can issue updated versions. By default, the server will note created_by_ref conflicts on object versions, but objects will be accepted. Selecting pass prevents status messages (and object failures) and forces the server to ignore created_by_ref inter-version conflicts.';
                break;
            }
            case 'DONT_MITRE_VALIDATE': {
                tooltip =
                    'By default, server enforces MITRE validations: https://github.com/oasis-open/cti-stix-validator; non-complient objects (in the opinion of MITRE) will be noted, but the object will be accepted in the form presented. Selecting pass means server would bypass this check.';
                break;
            }
            case 'DONT_REMOVE_EMPTY_ARRAYS': {
                tooltip =
                    'The STIX specification is clear that members of type array whose values are empty are NOT to be included (in the serialized form). By default, in the interest of being inclusive, tthe server would remove empty arrays and return notes. Selecting fail means server would note empty array values and fail.';
                break;
            }
            case 'DONT_TRIM_URLS': {
                tooltip =
                    'The STIX specification is clear that members of type URL must be valid URI values. By default, in the interest of being inclusive, the server would trim leading and trailing whitespaces and return notes. Selecting fail means server would note misformed URLs and fail. This is also applied to other input fields as well for consistency.';
                break;
            }
            case 'REPLACE_SCOS': {
                tooltip =
                    'By default, SCOs with previously seen ids are flagged as duplicates. Selecting this field indicates SCOs with previously seen ids should replace previous.';
                break;
            }
            default:
                break;
        }
        return tooltip;
    }

    checkDuplicates(component) {
        let httpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        let valueString = '';

        switch (component.type) {
            case 'artifact': {
                if (component.url) {
                    valueString = `url.keyword:"${component.url}"`;
                } else if (component.payload_bin) {
                    valueString = `payload_bin.keyword:"${component.payload_bin}"`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'ipv4-addr': {
                if (component.value) {
                    valueString = `value.keyword:${component.value}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'ipv6-addr': {
                if (component.value) {
                    valueString = `value.keyword:"${component.value}"`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'identity': {
                if (component.name) {
                    valueString = `name.keyword:${component.name}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'vulnerability': {
                if (component.name) {
                    valueString = `name.keyword:${component.name}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'autonomous-system': {
                if (component.number) {
                    valueString = `number:${component.number}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'directory': {
                if (component.path) {
                    valueString = `path.keyword:"${component.path}"`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'domain-name': {
                if (component.value) {
                    valueString = `value.keyword:${component.value}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'email-addr': {
                if (component.value) {
                    valueString = `value.keyword:${component.value}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'email-message': {
                if (component.from_ref) {
                    valueString = `from_ref.keyword:${component.from_ref}`;
                } else if (component.subject) {
                    valueString = `subject.keyword:${component.subject}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'file': {
                if (component.hashes) {
                    valueString = `(`;

                    // Hashes
                    let hashes = Object.entries(component.hashes);
                    hashes.forEach((h, i) => {
                        valueString += `hashes.${h[0]}.keyword:${h[1]}`;
                        if (i < hashes.length - 1) {
                            valueString += ' OR ';
                        }
                    });

                    valueString += `)`;
                }
                break;
            }
            case 'mac-address': {
                if (component.value) {
                    valueString = `value.keyword:${component.value}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'mutex': {
                if (component.name) {
                    valueString = `name.keyword:${component.name}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'network-traffic': {
                if (component.src_ref) {
                    valueString = `src_ref.keyword:${component.src_ref}`;
                } else if (component.dst_ref) {
                    valueString = `dst_ref.keyword:${component.dst_ref}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'process': {
                if (component.command_line) {
                    valueString = `command_line.keyword:${component.command_line}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'software': {
                if (component.name) {
                    valueString = `name.keyword:${component.name}`;
                }

                if (component.cpe) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `cpe.keyword:"${component.cpe}"`;
                }

                if (component.id) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `id.keyword:${component.id}`;
                }
                break;
            }
            case 'url': {
                if (component.value) {
                    valueString = `value.keyword:"${component.value}"`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'user-account': {
                if (component.account_type) {
                    valueString = `account_type.keyword:${component.account_type}`;
                }

                if (component.user_id) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `user_id.keyword:${component.user_id}`;
                }

                if (component.account_login) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `account_login.keyword:${component.account_login}`;
                }

                if (component.id) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `id.keyword:${component.id}`;
                }
                break;
            }
            case 'window-registry-key': {
                if (component.key) {
                    valueString = `key.keyword:${component.key}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'x509-certificate': {
                if (component.serial_number) {
                    valueString = `serial_number.keyword:${component.serial_number}`;
                } else if (component.hashes) {
                    valueString = `(`;

                    // Hashes
                    let hashes = Object.entries(component.hashes);
                    hashes.forEach((h, i) => {
                        valueString += `hashes.${h[0]}.keyword:${h[1]}`;
                        if (i < hashes.length - 1) {
                            valueString += ' OR ';
                        }
                    });

                    valueString += `)`;
                    break;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            case 'attack-pattern':
            case 'malware':
            case 'threat-actor': {
                if (component.name) {
                    valueString = `name.keyword:${component.name}`;
                }
                break;
            }
            case 'relationship': {
                valueString = ``;

                if (component.source_ref) {
                    valueString += `source_ref.keyword:${component.source_ref}`;
                }

                if (component.target_ref) {
                    if (valueString.includes('source_ref')) {
                        valueString += ' AND ';
                    }
                    valueString += `target_ref.keyword:${component.target_ref}`;
                }

                if (component.relationship_type) {
                    if (valueString.includes('source_ref') || valueString.includes('target_ref')) {
                        valueString += ' AND ';
                    }
                    valueString += `relationship_type.keyword:${component.relationship_type}`;
                }

                if (component.id) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `id.keyword:${component.id}`;
                }
                break;
            }
            case 'sighting': {
                if (component.sighting_of_ref) {
                    valueString = `sighting_of_ref.keyword:${component.sighting_of_ref}`;
                }

                if (component.id) {
                    if (!!valueString) {
                        valueString += ' OR ';
                    }
                    valueString += `id.keyword:${component.id}`;
                }
                break;
            }
            case 'location': {
                if (component.name) {
                    valueString = `name.keyword:"${component.name}"`;
                } else if (component.country) {
                    valueString = `country.keyword:${component.country}`;
                } else {
                    valueString = `id.keyword:${component.id}`;
                }
                break;
            }
            default: {
                valueString = `id.keyword:${component.id}`;
            }
        }

        let url = `${this.taxiiServer.url}ext/v1.0/search/`;
        let request = `type.keyword:${component.type}`;
        if (valueString) {
            request = `${request} AND (${valueString})`;

            let requestJSON = {
                query: request,
            };

            return this.taxiiHttpReq('post', url, { headers: httpHeaders, observe: 'response' }, requestJSON);
        }

        return null;
    }

    checkReferences(component) {
        let httpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        let url = null;
        url = `${this.taxiiServer.url}ext/v1.0/search/`;
        let request = `object_refs.keyword:${component.id} OR source_ref.keyword:${component.id} OR target_ref.keyword:${component.id}`;

        let requestJSON = {
            query: request,
        };

        if (component.id === this.envService.env.defaultIdentity.id) {
            return undefined;
        }
        return this.taxiiHttpReq('post', url, { headers: httpHeaders, observe: 'response' }, requestJSON);
    }

    checkId(componentId) {
        let httpHeaders = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

        let url = null;
        url = `${this.taxiiServer.url}ext/v1.0/search/`;
        let request = `id.keyword:${componentId}`;

        let requestJSON = {
            query: request,
        };

        return this.taxiiHttpReq('post', url, { headers: httpHeaders, observe: 'response' }, requestJSON);
    }

    getObjectFromIDHelper(ids, sendToBundle: boolean, root, collection) {
        if (ids.length == 0) {
            return [];
        }
        let id = ids.pop();
        try {
            let getURL = this.taxiiServer.url + 'taxii/v2.1-os/' + root + '/collections/' + collection + '/objects/?match[id]=' + id;
            this.httpClient.get<any>(getURL, { headers: this.httpHeaders, observe: 'response' }).subscribe(
                (resp) => {
                    let obj = undefined;
                    if (resp.body['objects']) {
                        obj = resp.body['objects'][0];
                    }
                    if (sendToBundle) {
                        if (obj) this.objectsToLoad.push(obj);
                        if (ids.length == 0) {
                            if (this.objectsToLoad.length > 0) {
                                this.hasObjectsToLoad = true;
                                if (this.getGuided()) {
                                } else {
                                }
                            } else console.error('ERROR: No objects were able to be loaded');
                            return [];
                        }
                        this.getObjectFromIDHelper(ids, true, root, collection);
                    } else {
                        if (obj) return this.getObjectFromIDHelper(ids, true, root, collection)?.concat([obj]);
                        else return this.getObjectFromIDHelper(ids, true, root, collection);
                    }
                },
                (err) => {
                    console.error('Unable to get query results. Error code: %s, URL: %s ', err.status, err.url);
                    if (sendToBundle) {
                        if (ids.length == 0) {
                            if (this.objectsToLoad.length > 0) {
                                this.hasObjectsToLoad = true;
                            } else console.error('ERROR: No objects were able to be loaded');
                            return [];
                        }
                        this.getObjectFromIDHelper(ids, true, root, collection);
                    } else {
                        return this.getObjectFromIDHelper(ids, true, root, collection);
                    }
                }
            );
        } catch (e) {
            console.error('Error getting object by ID: ' + e);
            if (sendToBundle) {
                if (ids.length == 0) {
                    if (this.objectsToLoad.length > 0) {
                        this.hasObjectsToLoad = true;
                    } else console.error('ERROR: No objects were able to be loaded');
                    return [];
                }
                this.getObjectFromIDHelper(ids, true, root, collection);
            } else {
                return this.getObjectFromIDHelper(ids, true, root, collection);
            }
        }
    }

    deleteProp(key: string): void {
        this.toplevel = this.toplevel.filter((p) => p[0] != key);
    }

    setReportName(reportName: string): void {
        this.reportName = reportName;
        localStorage.setItem('report-name', reportName);
    }

    getCuiDisplay(extension, id): string {
        let cui: string = extension.control;

        if (extension.categories?.length > 0) {
            cui += '//';

            let cat = '';

            extension.categories.forEach((category) => {
                if (cat) cat += '/';

                cat += category;
            });

            cui += cat;
        }

        if (extension.subcategories?.length > 0) {
            cui += '//';

            let subcat = '';

            extension.subcategories.forEach((subcategory) => {
                if (subcat) subcat += '/';

                subcat += subcategory;
            });

            cui += subcat;
        }

        if (extension.disseminations?.length > 0) {
            cui += '//';

            let diss = '';

            extension.disseminations.forEach((dissemination) => {
                if (diss) diss += '/';

                diss += dissemination;
            });

            cui += diss;
        }

        if (cui === 'CUI' || cui === 'CONTROLLED') cui += ` (${id})`;

        return cui;
    }

    getCuiRootAndCollections() {
        return new Promise<{ api: string; collection: any }>(async (resolve, reject) => {
            try {
                const url = `${this.envService.env.imxServer.url}/cui`;

                const imxHttpHeaders = new HttpHeaders()
                    .set('Accept', 'application/json')
                    .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`)
                    .set('Content-Type', `application/json`);

                this.httpClient.get(url, { headers: imxHttpHeaders }).subscribe({
                    next: (resp: any) => {
                        if (resp.status !== 200 || JSON.stringify(resp.data) == '{}')
                            return resolve({
                                api: null,
                                collection: null,
                            });

                        const api = resp?.data?.[0]?._source.api;
                        const collection = resp.data?.[0]?._source.collection;

                        return resolve({
                            api: api,
                            collection: collection,
                        });
                    },
                    error: (err) => {
                        return resolve({
                            api: null,
                            collection: null,
                        });
                    },
                });
            } catch (e) {
                return resolve({
                    api: null,
                    collection: null,
                });
            }
        });
    }

    publishCui(bundle) {
        return new Promise(async (resolve, reject) => {
            const cuiDestination = await this.getCuiRootAndCollections();

            try {
                if (cuiDestination.api && cuiDestination.collection) {
                    const cuis = bundle.objects.filter((elem) => {
                        if (elem.type !== 'marking-definition') return false;

                        if (elem.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']) return true;

                        return false;
                    });

                    if (cuis.length > 0) {
                        const cuiUrl = `${this.getBaseURLs().baseTaxiiURL}${cuiDestination.api}/collections/${cuiDestination.collection.id}/objects/`;
                        const headers = new HttpHeaders()
                            .set('Accept', 'application/taxii+json;version=2.1')
                            .set('Content-Type', 'application/taxii+json;version=2.1')
                            .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

                        const cuiBundle = new Bundle(cuis);
                        cuiBundle.id = `bundle--${uuidV4()}`;
                        let beforeLog = {
                            action: 'publish_att',
                            description: 'User has attempted to publish to Taxii Server (CUI)',
                            server_type: this.taxiiServerType,
                            url: cuiUrl,
                            api_root: cuiDestination.api,
                            collection: cuiDestination.collection,
                            bundle: cuiBundle,
                        };

                        let logInfo = {
                            action: 'publish_req',
                            description: 'User has attempted to publish to Taxii Server (CUI)',
                            server_type: this.taxiiServerType,
                            url: cuiUrl,
                            api_root: cuiDestination.api,
                            collection: cuiDestination.collection,
                            bundle: cuiBundle,
                        };

                        this.loggingService.logEvent(beforeLog, {});

                        this.taxiiHttpReq('post', cuiUrl, { headers: headers }, JSON.stringify(cuiBundle)).subscribe({
                            next: (result: any) => {
                                this.saveStatus(result, cuiUrl, cuiDestination.collection, cuiBundle, true);
                                console.debug(result);
                                console.debug('Publication of STIX Bundle successful (CUI)');

                                this.loggingService.logEvent(logInfo, result);
                                resolve(true);
                            },
                            error: (err) => {
                                this.saveStatus(undefined, cuiUrl, cuiDestination.collection, cuiBundle, true);
                                console.error('Error publishing STIX bundle (CUI)');
                                console.error(err);
                                resolve(true);
                            },
                        });
                    }
                }
                resolve(true);
            } catch (e) {
                resolve(true);
            }
        });
    }
}
