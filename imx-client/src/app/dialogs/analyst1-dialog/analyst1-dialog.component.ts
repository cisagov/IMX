import { Component, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { lastValueFrom } from 'rxjs';
import {
    faTrash,
    faFileImport,
    faInfoCircle,
    faPlus,
    faBan,
    faArrowRight,
    faUserEdit,
    faSearch,
    faArrowLeft,
    faAngleDoubleDown,
    faAngleDoubleUp,
    faAngleDown,
    faAngleUp,
    faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { EnvService } from 'src/app/env-service/env.service';
import { StixService } from '../../stix-service.service';
import { STIX_OBJECTS } from '../../models/stix-objects';
import { Content } from '../../models/content';
import all_schemas from '../../bundle/schemas.json';
import { v4 as uuid } from 'uuid';
import { TLP20_OPTIONS, TLP_OPTIONS } from 'src/app/tlpMarkingDef';
import { AccessPrivilege, AcsConfig, FurtherSharing, ListProperties, PrivilegeScope, acs_enums } from './acs-types';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { validateStix } from 'src/app/shared/utils/validation.utils';

declare const require: any;
const Validator = require('jsonschema').Validator;

@Component({
    selector: 'app-analyst1-dialog',
    templateUrl: './analyst1-dialog.component.html',
    styleUrls: ['./analyst1-dialog.component.css'],
    standalone: false,
})
export class Analyst1DialogComponent {
    @ViewChild('stixModal') stixModal!: TemplateRef<any>;

    acs_enums = acs_enums;

    configureOption = false;

    usDC = {
        administrative_area: 'US-DC',
        country: 'US',
        created: '2021-03-13T20:09:21.286293Z',
        created_by_ref: 'identity--8ce3f695-d5a4-4dc8-9e93-a65af453a31a',
        id: 'location--78a7f0f3-ea60-4ca2-894e-9e825b94b592',
        modified: '2021-12-01T16:19:51.601791Z',
        name: 'District of Columbia',
        spec_version: '2.1',
        type: 'location',
    };

    faTrash = faTrash;
    faAddToBundle = faFileImport;
    faInfoCircle = faInfoCircle;
    faPlus = faPlus;
    faBan = faBan;
    faArrowRight = faArrowRight;
    faUserEdit = faUserEdit;
    faSearch = faSearch;
    faArrowLeft = faArrowLeft;
    faArrowDown = faAngleDoubleDown;
    faArrowUp = faAngleDoubleUp;
    faMinus = faMinus;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;

    showAccessPriv = false;
    showFurtherSharing = false;

    collectionId = this.envService.env.taxiiServer.ctiCollectionId;
    stixObjects = STIX_OBJECTS;
    showingAnalyst1 = true;
    searchTextAnalyst1: string = '';
    analyst1Objects: any[] = [];
    analyst1ObjectsInCart: any = [];
    analyst1TotalPages: number = 0;
    analyst1currentPage: number = 0;
    addingStixToPending: boolean = false;
    textOutput = false;
    csvOutput = false;
    stixOutput = false;
    xmlOutput = false;
    expandDetails = true;
    exportingObjects = false;
    searchError = '';

    //Evidence Map maps Evidence ID to STIX 2.1 Bundle
    evidenceMap = new Map();
    evidenceInCart = new Set();

    configModalRef: NgbModalRef;
    defaultStixConfig = {
        aisTlp: '',
        orgCountry: 'US',
        orgAdmin: 'US-DC',
        acsMarkings: {},
    };

    acsLoading = false;
    acsIsValid = false;
    acsErrors = {
        destination: 'Destination must be filled',
        classification: 'Classification must be filled',
        formal_determination: 'Formal Determination must be selected',
        usage_permission: '',
        further_sharing: '',
    };

    access_privilege_collapse = [];
    further_sharing_collapse = [];

    enableObj = {
        access_privilege: false,
        further_sharing: false,
    };
    enableAddValue = {
        entity_list: false,
        permitted_nationalities_list: false,
        permitted_organizations_list: false,
        shareability_list: false,
        sharing_scope_list: false,
    };
    acsMarking;
    acsMarkingConfig: AcsConfig = {
        destination: '',
        classification: 'U',
        formal_determination: '',
        control_shareability: [],
        usage_permissions: 'Deny',
        privilege_action: '',
        usage_rule_effect: '',
        entity: '',
        entity_list: [],
        permitted_nationalities: '',
        permitted_nationalities_list: [],
        permitted_organizations: '',
        permitted_organizations_list: [],
        shareability: '',
        shareability_list: [],
        further_sharing: 'Deny',
        sharing_scope: '',
        sharing_scope_list: [],
        further_rule_effect: '',
        access_privilege_list: [
            {
                privilege_action: 'CISAUSES',
                rule_effect: 'permit',
                privilege_scope: {
                    entity: ['ALL'],
                    permitted_nationalities: ['ALL'],
                    permitted_organizations: ['ALL'],
                    shareability: ['ALL'],
                },
            },
        ],
        further_sharing_list: [
            {
                sharing_scope: ['USA.USG'],
                rule_effect: 'permit',
            },
        ],
    };
    skipAcs = false;

    countries = new Map();
    countriesLoaded = false;
    stixConfigType;
    tempStixConfig = JSON.parse(JSON.stringify(this.defaultStixConfig));
    stixConfig = JSON.parse(JSON.stringify(this.defaultStixConfig));
    saveConfig = false;
    stixConfigSaved = false;

    loadingStix = false;
    previewAnalyst1;
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
    rownumber: number = -1;
    objnumber: number = -1;

    step = 0;
    pendingObjects = [];
    pendingStixObjects = [];
    activeTab = 'indicator';
    objectIdMapping = [];

    useGeneralApi = true;
    useBatchCheckApi = false;

    analyst1ObjectsObservable = null;
    totalResults = 0;

    formalDeterminationOptions = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'FOUO', 'AIS', 'PUBREL'];
    filteredFormalDeterminationOptions: string[];
    selectedFormalDeterminations = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT'];
    formalDeterminationText = '';

    destinationDisabledProp = {
        shareability: false,
        furtherSharing: false,
        furtherSharingOption: false,
        accessPrivilege: false,
        accessPrivilegeOption: false,
        formalDetermination: false,
    };

    indicatorMap = new Map();

    private httpHeadersJSON = new HttpHeaders()
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${btoa(this.taxiiServer.username + ':' + this.taxiiServer.password)}`);

    constructor(
        public activeModal: NgbActiveModal,
        private httpClient: HttpClient,
        public stixService: StixService,
        private modalService: NgbModal,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {}

    /**
     * Search Analyst1 with given search term in JSON format (Not STIX)
     */
    async getAnalyst1Objects() {
        await this.envService.checkAuth('/bundle');

        let url = null;
        let isId = false;
        this.loadingStix = true;
        this.addingStixToPending = true;
        this.analyst1Objects = [];
        this.analyst1currentPage = 0;
        this.analyst1TotalPages = 0;
        this.searchError = '';

        this.resetAcs();

        // Indicator API
        if (this.useGeneralApi) {
            if (isNaN(Number(this.searchTextAnalyst1))) {
                isId = false;
                url = this.taxiiServer.url + 'A1/evidence/?searchTerm=*' + this.searchTextAnalyst1 + '*&indicatorValueOnlySearch=true&pageSize=10';
            } else {
                isId = true;
                url = this.taxiiServer.url + 'A1/evidence/' + this.searchTextAnalyst1;
            }
        }

        this.analyst1ObjectsObservable = this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe(
            async (resp: any) => {
                if (isId) {
                    //Expanded Result has 3 states, not-loaded, hidden, loaded.
                    this.totalResults = resp.message === 'The requested resource was not found.' ? 0 : 1;
                    resp['checked'] = false;
                    resp['expandedResult'] = 'not-loaded';
                    resp['indicatorExpanded'] = false;
                    resp['threatActorExpanded'] = 'not-loaded';
                    resp['cveExpanded'] = false;
                    resp['indicatorChecked'] = true;
                    resp['objectsList'] = new Map();
                    resp['objectsList'].set('location', {
                        expanded: false,
                        checked: false,
                        objects: [{ evidenceId: resp.id, id: this.usDC.id, name: 'US-DC', expanded: false, checked: false }],
                    });

                    if (resp.tlp != 'undetermined' && resp.tlp != 'red') {
                        if (!resp.message) this.analyst1Objects = [resp];
                        if (this.useGeneralApi) {
                            this.analyst1currentPage = 1;
                            this.analyst1TotalPages = 1;
                        }
                    } else {
                        this.analyst1Objects = [];
                        if (this.useGeneralApi) {
                            this.analyst1currentPage = 1;
                            this.analyst1TotalPages = 1;
                        }
                    }
                } else {
                    this.totalResults = resp.totalResults;
                    resp.results = resp.results.filter((o) => o.tlp && o.tlp != 'undetermined' && o.tlp != 'red');

                    for (const o of resp.results) {
                        o['checked'] = false;
                        o['expandedResult'] = 'not-loaded';
                        o['indicatorExpanded'] = false;
                        o['threatActorExpanded'] = 'not-loaded';
                        o['cveExpanded'] = false;
                        o['indicatorChecked'] = true;
                        o['objectsList'] = new Map();
                        o['objectsList'].set('location', {
                            expanded: false,
                            checked: false,
                            objects: [{ evidenceId: o.id, id: this.usDC.id, name: 'US-DC', expanded: false, checked: false }],
                        });
                    }

                    this.analyst1Objects = resp.results;
                    if (this.useGeneralApi) {
                        this.analyst1currentPage = resp.page;
                        this.analyst1TotalPages = resp.totalPages;
                    }
                }

                this.addingStixToPending = false;
                this.loadingStix = false;
            },
            (err) => {
                console.error('Error retrieving data from server', err);
                if (err.statusText && err.status) this.searchError = err.statusText + ' (Error code: ' + err.status + ')';
                else err.statusText = 'Unexpected error has occurred';
                this.loadingStix = false;
                this.addingStixToPending = false;
            }
        );
    }

    /**
     * Expands or collapses list of CVEs under an object
     * @param analyst1Object The object to expand
     */
    getCves(analyst1Object) {
        analyst1Object.cveExpanded = !analyst1Object.cveExpanded;
    }

    expand(obj) {
        obj.expanded = !obj.expanded;
    }

    /**
     * Retrieves a list of threat actors associated with the Analyst1 Object and either expands or collapses the view
     * @param analyst1Object The object to expand
     */
    async getThreatActors(analyst1Object) {
        try {
            if (analyst1Object.threatActorExpanded === 'loading') return;
            if (analyst1Object.threatActorExpanded === 'not-loaded') {
                analyst1Object.threatActorExpanded = 'loading';
                const countries = new Set();
                const attackPatterns = new Set(analyst1Object.attackPattern?.idNamePairs?.length > 0 ? analyst1Object.attackPattern.idNamePairs : []);
                const targets = new Set(analyst1Object.targets?.idNamePairs?.length > 0 ? analyst1Object.targets.idNamePairs : []);

                for (const actors of analyst1Object.actors?.idNamePairs) {
                    const url = this.taxiiServer.url + 'A1/actor/' + actors.id;
                    const threatActor: any = await this.httpClient.get(url, { headers: this.httpHeadersJSON }).toPromise();
                    if (threatActor.country?.name && !countries.has(threatActor.country.name)) countries.add(threatActor.country.name);
                    for (const target of threatActor.targets) {
                        if (!targets.has(target.name)) targets.add(target);
                    }

                    for (const attackPattern of threatActor.attackPatterns) {
                        if (!attackPatterns.has(attackPattern)) attackPatterns.add(attackPattern);
                    }

                    analyst1Object.threatActorCountry = [...countries];
                    analyst1Object.threatActorTargets = [...targets];
                    analyst1Object.threatActorAttackPatterns = [...attackPatterns];
                }
                analyst1Object.threatActorExpanded = 'visible';
            } else if (analyst1Object.threatActorExpanded === 'hidden') {
                analyst1Object.threatActorExpanded = 'visible';
            } else if (analyst1Object.threatActorExpanded === 'visible') {
                analyst1Object.threatActorExpanded = 'hidden';
            }
        } catch (err) {
            analyst1Object.threatActorExpanded = 'visible';
        }
    }

    expandIndicator(analyst1Object) {
        analyst1Object.indicatorExpanded = !analyst1Object.indicatorExpanded;
    }

    expandProperty(obj) {
        obj.expanded = !obj.expanded;
    }

    decodeXML(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text.trim();
        return textarea.value;
    }

    getStix1(analyst1Obj) {
        this.getIndicators(analyst1Obj, false)
            .then((resp) => {
                this.addingStixToPending = true;

                this.mapIndicatorIds(analyst1Obj).then((evidPckg) => {
                    this.getImxPy(evidPckg)
                        .then((resp) => {
                            const xml = this.decodeXML(resp);
                            const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
                            const newUrl = URL.createObjectURL(blob);
                            const newTab = window.open(newUrl);
                            newTab?.document.write('<pre>', resp, '</pre>');
                            newTab?.document.close();

                            this.addingStixToPending = false;
                        })
                        .catch((err) => {
                            this.addingStixToPending = false;
                            let errorMessage = err;

                            if (err.message?.includes('400 Bad Request')) {
                                errorMessage = err.message;
                            }
                            this.announcementService.show('IMX was unable to generate STIX 1.1 for this object', errorMessage, 'error', false);
                        });
                });
            })
            .catch((err) => {
                console.error(err);
                this.addingStixToPending = false;
            });
    }

    async mapIndicatorIds(analyst1Obj) {
        try {
            const evidPckg = {
                evPkgs: [
                    {
                        evID: analyst1Obj.id,
                        indIDs: [],
                    },
                ],
                forExport: true,
            };

            if (!analyst1Obj.indicatorIds) {
                const ids = await this.getIndicatorIds(analyst1Obj.id);

                if (!ids) analyst1Obj.indicatorIds = new Map();
                else {
                    const idMap = new Map();

                    ids.forEach((indicator) => {
                        let typeMap = analyst1Obj.indicatorIds?.get(indicator.value.name);

                        if (typeMap) typeMap.set(indicator.type, indicator.id);
                        else {
                            typeMap = new Map();
                            typeMap.set(indicator.type, indicator.id);
                        }

                        idMap.set(indicator.value.name, typeMap);
                    });

                    analyst1Obj.indicatorIds = idMap;
                }
                for (const indType in analyst1Obj.indicatorList) {
                    const indicators = analyst1Obj.indicatorList[indType];

                    indicators.forEach((obj) => {
                        const splitStr = obj.pattern.split(" = '");
                        let type = splitStr[0].split(':')[0].split('[')[1];
                        if (type.startsWith('(')) type = type.substring(1);
                        if (type.includes(" AND ")) {
                            type = type.split(" AND ")[0];
                        }
                        if (type.includes(" OR ")) {
                            type = type.split(" OR ")[0];
                        }
                        if (type.endsWith(')'))
                            type = type.slice(0, -1);

                        switch (type) {
                            case 'email-addr':
                                type = 'email';
                                break;
                            case 'ipv4-addr':
                                type = 'ip';
                                break;
                            case 'ipv6-addr':
                                type = 'ipv6';
                                break;
                            case 'domain-name':
                                type = 'domain';
                                break;
                        }

                        const indicatorName = splitStr[1].split("'")[0];

                        if (type !== 'file') {
                            const indicatorId = analyst1Obj.indicatorIds.get(indicatorName)?.get(type);

                            if (indicatorId) {
                                obj.indicatorId = indicatorId;

                                if (obj.checked) evidPckg.evPkgs[0].indIDs.push(indicatorId);
                            }
                        } else if (type === 'file') {
                            let patterns = obj.pattern;
                            const patternMap = [];

                            if (patterns.startsWith('[')) patterns = patterns.substring(1);
                            if (patterns.endsWith(']')) patterns = patterns.substring(0, patterns.length - 1);

                            let patternArr = patterns.split(' OR ');

                            for (const patternType of patternArr) {
                                const hashTypes = patternType.split(' = ');
                                let hashValue = hashTypes[1].replace(/\'/g, '');

                                patternMap.push(hashValue);
                            }
                            let foundId;

                            patternMap.forEach((elem) => {
                                if (foundId) return;

                                foundId = analyst1Obj.indicatorIds.get(elem)?.get(type);
                            });

                            if (foundId) {
                                obj.indicatorId = foundId;

                                if (obj.checked) {
                                    evidPckg.evPkgs[0].indIDs.push(foundId);
                                }
                            }
                        }
                    });
                }

                return evidPckg;
            } else {
                for (const ind in analyst1Obj.indicatorList) {
                    const indicator = analyst1Obj.indicatorList[ind];

                    indicator.forEach((obj) => {
                        if (obj.checked && obj.indicatorId) evidPckg.evPkgs[0].indIDs.push(obj.indicatorId);
                    });
                }

                return evidPckg;
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async getImxPy(pckg) {
        try {
            const url = `${this.envService.env.imxServer.url}/get-stix-one`;
            await this.envService.checkAuth('/bundle');

            const resp: any = await lastValueFrom(
                this.httpClient.post(url, JSON.stringify(pckg), {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
                    }),
                    responseType: 'text',
                })
            );

            return resp;
        } catch (err) {
            if (err.error?.includes('Value Error')) {
                let message = JSON.parse(err.error);
                throw new Error(message.message);
            }
            throw new Error(err.message);
        }
    }

    async getIndicatorIds(evidId: string, pageNum = 1) {
        try {
            const url = `${this.taxiiServer.url}A1/evidence/${evidId}/indicator?page=${pageNum}&pageSize=100`;
            const resp: any = await this.httpClient.get(url, { headers: this.httpHeadersJSON }).toPromise();

            if (!resp || !resp.results) {
                return [];
            }

            if (resp.totalPages > resp.page) {
                return [...resp.results, ...(await this.getIndicatorIds(evidId, pageNum + 1))];
            } else {
                return resp.results;
            }
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    /**
     * Get indicators in STIX format associated with the Analyst1 Object. Assigned to evidenceMap.
     * @param analyst1Object The object to retrieve indicators for
     * @param loadAfter Whether to expand the view after
     */
    async getIndicators(analyst1Object, loadAfter = true) {
        if (analyst1Object.expandedResult === 'not-loaded') {
            this.addingStixToPending = true;
            analyst1Object.expandedResult = 'loading';
            const url = this.taxiiServer.url + 'A1/evidence/' + analyst1Object.id + '/stix?stixVersion=v2_1';
            let indicatorNum = 0;
            const indicatorList = {};
            const indicatorTypes = [];

            const resp: any = await this.httpClient.get(url, { headers: this.httpHeadersJSON }).toPromise();

            resp.tlp = analyst1Object.tlp;
            if (analyst1Object.attackPattern && analyst1Object.attackPattern.idNamePairs)
                resp.attackPatterns = analyst1Object.attackPattern.idNamePairs;

            this.evidenceMap.set(analyst1Object.id, resp);

            this.filterMarkingdefs(resp.objects);

            const report = resp.objects?.find((obj) => obj.type === 'report');
            resp.objects.forEach((obj) => {
                //Requested to remove description from all objects except report, specific to AE
                if (this.envService.env.aeSetting) {
                    if (obj.external_references) {
                        obj.external_references = obj.external_references.filter((elem) => elem.source_name.toLowerCase() === 'mitre-attack');

                        if (obj.external_references.length === 0) delete obj.external_references;
                    }

                    delete obj.granular_markings;
                    delete obj.aliases;

                    if (obj.type !== 'indicator' && obj.type !== 'report') delete obj.description;
                }

                this.deleteEmptyList(obj);

                obj.tlp = analyst1Object.tlp;

                //Verify all objects in the bundle is included in the report object refs (Which is true for some bundles from Analyst1)
                if (report && obj.type !== 'report') {
                    if (!report.object_refs) report.object_refs = [];

                    if (!report.object_refs.includes(obj.id) && !obj.id.startsWith('marking-definition--')) report.object_refs.push(obj.id);
                }

                //Add all objects to a list
                if (obj.type !== 'indicator' && obj.type !== 'relationship' && obj.type !== 'marking-definition') {
                    const objectsList: Map<string, any> = analyst1Object.objectsList;
                    let list = {
                        expanded: false,
                        checked: obj.type !== 'threat-actor' ? true : false,
                        objects: [],
                    };

                    if (!objectsList.get(obj.type)) objectsList.set(obj.type, list);
                    else list = objectsList.get(obj.type);

                    let name = '';
                    if (obj.type === 'relationship') {
                        const src = resp.objects.find((elem) => elem.id === obj.source_ref);
                        const target = resp.objects.find((elem) => elem.id === obj.target_ref);

                        if (src && target) {
                            let srcName = '';
                            let targName = '';
                            if (src.type === 'indicator') {
                                srcName = this.parseIndicatorName(src);
                            } else {
                                srcName = src.name ? src.name : src.id;
                            }

                            if (target.type === 'indicator') {
                                targName = this.parseIndicatorName(target);
                            } else {
                                targName = target.name ? target.name : target.id;
                            }

                            name = srcName + ' ' + obj.relationship_type.toUpperCase() + ' ' + targName;
                        } else name = obj.id;
                    } else {
                        name = obj.name ? obj.name : obj.id;
                    }

                    const objectToAdd = {
                        evidenceId: analyst1Object.id,
                        id: obj.id,
                        description: obj.description,
                        name: name,
                        expanded: false,
                        checked: obj.type !== 'threat-actor' ? true : false,
                    };

                    list.objects.push(objectToAdd);
                    objectsList.keys();
                }

                if (obj.type !== 'indicator') return;

                const splitStr = obj.pattern.split(" = '");
                let type = splitStr[0].split(':')[0].split('[')[1];
                if (type.startsWith('(')) type = type.substring(1);
                const value = splitStr[1].split("'")[0];

                if (!indicatorList[type]) {
                    indicatorList[type] = [];
                    indicatorTypes.push({ type: type, expanded: false, checked: true });
                }

                obj.evidenceId = analyst1Object.id;
                obj.nameValue = value;
                obj.expanded = false;
                obj.checked = true;
                obj.indicatorId = '';

                indicatorList[type].push(obj);
                indicatorNum++;
            });

            analyst1Object.indicatorList = indicatorList;
            analyst1Object.indicatorTypes = indicatorTypes;
            analyst1Object.indicatorNum = indicatorNum;

            if (indicatorNum === 0) analyst1Object.hasNoIndicator = true;

            if (loadAfter) {
                analyst1Object.expandedResult = 'visible';
            } else {
                analyst1Object.expandedResult = 'hidden';
            }
            this.addingStixToPending = false;
        } else if (analyst1Object.expandedResult === 'visible' && loadAfter) {
            analyst1Object.expandedResult = 'hidden';
        } else if (analyst1Object.expandedResult === 'hidden' && loadAfter) {
            analyst1Object.expandedResult = 'visible';
        }
    }

    parseIndicatorName(indicator) {
        const splitStr = indicator.pattern.split(" = '");
        let type = splitStr[0].split(':')[0].split('[')[1];
        if (type.startsWith('(')) type = type.substring(1);
        const value = splitStr[1].split("'")[0];

        return value;
    }

    checkAllAnalyst1Indicators(analyst1Object, event) {
        analyst1Object.indicatorChecked = event.target.checked;

        if (analyst1Object.indicatorList) {
            for (const indicator in analyst1Object.indicatorList) {
                analyst1Object.indicatorList[indicator].forEach((i) => {
                    i.checked = event.target.checked;
                });
            }
        }

        if (analyst1Object.indicatorTypes) {
            analyst1Object.indicatorTypes.forEach((i) => {
                i.checked = event.target.checked;
            });
        }

        if (analyst1Object.objectsList)
            analyst1Object.objectsList.forEach((value, key) => {
                if (key !== 'threat-actor' || !event.target.checked) {
                    value.checked = event.target.checked;
                    value.objects.forEach((elem) => {
                        elem.checked = event.target.checked;
                    });
                }
            });

        if (analyst1Object.expandedResult === 'not-loaded') {
            this.getIndicators(analyst1Object, false);
        }
    }

    checkAllAnalyst1Types(analyst1Object, event) {
        if (analyst1Object.indicatorList) {
            for (const indicator in analyst1Object.indicatorList) {
                analyst1Object.indicatorList[indicator].forEach((i) => {
                    i.checked = event.target.checked;
                });
            }
        }
        if (analyst1Object.indicatorTypes) {
            analyst1Object.indicatorTypes.forEach((i) => {
                i.checked = event.target.checked;
            });
        }
    }

    checkAllTypes(objects, event) {
        objects.checked = event.target.checked;
        objects.objects.forEach((elem) => {
            elem.checked = event.target.checked;
        });
    }

    checkAllIndicators(indicators, event) {
        for (const indicator in indicators) {
            indicators[indicator].checked = event.target.checked;
        }
    }

    checkAllAnalyst1Objects(event) {
        this.analyst1Objects.forEach((o) => {
            o.indicatorChecked = event.target.checked;
            o.checked = event.target.checked;
            if (o.indicatorList) {
                for (const indicator in o.indicatorList) {
                    o.indicatorList[indicator].forEach((i) => {
                        i.checked = event.target.checked;
                    });
                }
            }
            if (o.indicatorTypes) {
                o.indicatorTypes.forEach((i) => {
                    i.checked = event.target.checked;
                });
            }

            if (o.expandedResult === 'not-loaded') {
                const url = this.taxiiServer.url + 'A1/evidence/' + o.id;
                this.getIndicators(o, false);
            }
        });
    }

    /**
     * Remove all marking defs preconfigured by Analyst1 and references to the id of marking defs
     * @param objects bundle objects of evidence to remove marking defs from
     */
    filterMarkingdefs(objects) {
        const markingDefToRemove = new Set();

        objects.forEach((elem) => {
            if (elem.type === 'marking-definition') markingDefToRemove.add(elem.id);
        });

        if (markingDefToRemove.size > 0)
            objects.forEach((elem) => {
                if (elem.object_marking_refs) {
                    elem.object_marking_refs = elem.object_marking_refs.filter((refs) => !markingDefToRemove.has(refs));
                    if (elem.object_marking_refs.length === 0) delete elem.object_marking_refs;
                }
            });
    }

    viewDetail() {
        let objectReqs = [];
        this.pendingObjects = [];
        this.pendingStixObjects = [];
        this.objectIdMapping = [];
        const evidenceToAdd = new Set<string>();
        const addedIndicators = new Set<string>();
        this.addingStixToPending = true;
        this.acsLoading = true;

        const checkedMap = this.getChecked();

        this.stixConfig = JSON.parse(JSON.stringify(this.tempStixConfig));
        this.analyst1ObjectsInCart.forEach((elem) => {
            const indicator = JSON.parse(JSON.stringify(elem));
            this.pendingObjects.push(indicator);
            addedIndicators.add(indicator.id);

            if (!evidenceToAdd.has(indicator.evidneceId)) evidenceToAdd.add(indicator.evidenceId);

            delete indicator.evidenceId;
            delete indicator.indicatorId;
            delete indicator.nameValue;
            delete indicator.expanded;
            delete indicator.checked;
        });

        this.convertToStixObject();

        const reports = [];
        //Search for evidence package stored in map by its ID
        this.evidenceInCart.forEach((evidenceId) => {
            const evidence = JSON.parse(JSON.stringify(this.evidenceMap.get(evidenceId)));
            const evidenceObjects = [];
            this.filterMarkingdefs(evidence.objects);

            //Iterate through the objects in the evidence package
            evidence.objects.forEach((elem) => {
                if (elem.type === 'indicator' || elem.type === 'marking-definition') {
                    return;
                }

                if (elem.type === 'relationship') {
                    let src = addedIndicators.has(elem.source_ref);
                    if (!src) src = checkedMap.get(evidenceId).includes(elem.source_ref);

                    let targ = addedIndicators.has(elem.target_ref);
                    if (!targ) targ = checkedMap.get(evidenceId).includes(elem.target_ref);

                    if (!targ || !src) return;
                }

                if (elem.type === 'report') reports.push(elem);

                if (elem.type === 'relationship' || checkedMap.get(evidenceId).includes(elem.id)) evidenceObjects.push(elem);
            });

            this.addRelAndLoc({ objects: evidenceObjects, tlp: evidence.tlp });
            this.pendingObjects.push(...evidenceObjects);
        });

        this.addTlpAndAcs({ objects: [...this.pendingObjects, ...this.pendingStixObjects] });

        if (JSON.stringify(this.stixConfig.acsMarkings) !== '{}' && !this.skipAcs) {
            const acsObj = this.stixConfig.acsMarkings;
            if (!this.pendingObjects.find((elem) => elem.id === acsObj.id)) {
                this.pendingObjects.push(acsObj);
            }

            localStorage.setItem('user-acs', JSON.stringify(acsObj));
        }

        reports.forEach((report) => {
            report.object_refs = [];

            this.pendingObjects.forEach((elem) => {
                if (elem.id === report.id) return;

                report.object_refs.push(elem.id);
            });
        });

        this.configModalRef.close();
        this.addingStixToPending = false;
        this.acsLoading = false;

        const evidenceId = checkedMap.entries().next().value[0];
        const evidenceName = this.analyst1Objects.find((elem) => {
            if (elem.id === evidenceId) return true;
            return false;
        });

        if (!this.stixService.reportName) this.stixService.setReportName(evidenceName?.title?.name ? evidenceName.title.name : 'Analyst1 Evidence');

        this.addToBundle('indicator');
    }

    updateAnalyst1Checked(object) {
        object.checked = !object.checked;
    }

    showNextAnalyst1Page() {
        return this.analyst1currentPage < this.analyst1TotalPages;
    }

    showPrevAnalyst1Page() {
        return this.analyst1currentPage > 1;
    }

    getNextAnalyst1Page() {
        this.addingStixToPending = true;
        // API call to proxy and get selected objects when add to bundle
        let url =
            this.taxiiServer.url +
            'A1/evidence/?searchTerm=' +
            this.searchTextAnalyst1 +
            '*&indicatorValueOnlySearch=true&page=' +
            (this.analyst1currentPage + 1) +
            '&pageSize=10';

        this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe((resp: any) => {
            this.analyst1Objects = resp.results;
            this.analyst1Objects.forEach((o) => {
                o['checked'] = false;
                o['expandedResult'] = 'not-loaded';
                o['indicatorExpanded'] = false;
                o['threatActorExpanded'] = 'not-loaded';
                o['cveExpanded'] = false;
                o['indicatorChecked'] = false;
                o['objectsList'] = new Map();
                o['objectsList'].set('location', {
                    expanded: false,
                    checked: false,
                    objects: [{ evidenceId: o.id, id: this.usDC.id, name: 'US-DC', expanded: false, checked: false }],
                });
            });
            this.analyst1currentPage = resp.page;
            this.analyst1TotalPages = resp.totalPages;
            this.addingStixToPending = false;
        });
    }

    getPrevAnalyst1Page() {
        this.addingStixToPending = true;
        let url =
            this.taxiiServer.url +
            'A1/evidence/?searchTerm=' +
            this.searchTextAnalyst1 +
            '*&indicatorValueOnlySearch=true&page=' +
            (this.analyst1currentPage - 1) +
            '&pageSize=10';

        this.httpClient.get<any>(url, { headers: this.httpHeadersJSON }).subscribe((resp: any) => {
            this.analyst1Objects = resp.results;
            this.analyst1Objects.forEach((o) => {
                o['checked'] = false;
                o['expandedResult'] = 'not-loaded';
                o['indicatorExpanded'] = false;
                o['threatActorExpanded'] = 'not-loaded';
                o['cveExpanded'] = false;
                o['indicatorChecked'] = false;
                o['objectsList'] = new Map();
                o['objectsList'].set('location', {
                    expanded: false,
                    checked: false,
                    objects: [{ evidenceId: o.id, id: this.usDC.id, name: 'US-DC', expanded: false, checked: false }],
                });
            });
            this.analyst1currentPage = resp.page;
            this.analyst1TotalPages = resp.totalPages;
            this.addingStixToPending = false;
        });
    }

    convertToStixObject() {
        let v = new Validator();

        let tempStixObjects = [];
        this.pendingObjects.forEach((po) => {
            if (po.pattern) {
                let tempObj = {};
                let patterns = po.pattern.split('=');
                if (patterns[0].startsWith('[')) {
                    patterns[0] = patterns[0].substring(1);
                    patterns[1] = patterns[1].substring(0, patterns[1].length - 1);
                }

                let property = patterns[0].trim();
                let value = patterns[1].trim();
                if (value[0] === "'") {
                    value = value.substring(1, value.length - 1);
                }

                let properties = property.split(':');
                let type = properties[0].trim();
                let attributeName = properties[1].trim();

                // If attribute is not alphabet, push original object.
                if (!/^[a-zA-Z]+$/.test(attributeName) && type !== 'file') {
                    return;
                }

                if (type !== 'file') {
                    tempObj['id'] = type + '--' + po.id.split('--')[1];
                    tempObj['spec_version'] = po.spec_version;
                    tempObj['type'] = type;
                    tempObj[attributeName] = value;
                    tempObj['tlp'] = po.tlp;
                } else {
                    tempObj['id'] = type + '--' + po.id.split('--')[1];
                    tempObj['spec_version'] = po.spec_version;
                    tempObj['type'] = type;
                    tempObj['tlp'] = po.tlp;
                    tempObj['hashes'] = {};
                    patterns = po.pattern;
                    if (patterns.startsWith('[')) patterns = patterns.substring(1);
                    if (patterns.endsWith(']')) patterns = patterns.substring(0, patterns.length - 1);

                    let patternArr = patterns.split(' OR ');

                    for (const patternType of patternArr) {
                        const hashTypes = patternType.split(' = ');
                        let hashType: string = hashTypes[0].split('.')[1];
                        hashType = hashType.replace(/\'/g, '');
                        let hashValue = hashTypes[1].replace(/\'/g, '');

                        tempObj['hashes'][hashType] = hashValue;
                    }
                }

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

            if (report.errors.length == 0 && this.pendingStixObjects.findIndex((po) => po.id === obj.id) === -1) {
                this.pendingStixObjects.push(obj);
            }
        }
    }

    enableReview() {
        return this.analyst1ObjectsInCart.length > 0;
    }

    enableAddToCart() {
        if (this.analyst1Objects.some((evidence) => evidence.expandedResult === 'loading')) {
            return false;
        }

        return this.analyst1Objects.some((evidence) => evidence.checked);
    }

    removeFromCart() {
        const idsToRemove = new Set();
        this.analyst1Objects.forEach((evidence) => {
            for (const type in evidence.indicatorList) {
                for (const indicator of evidence.indicatorList[type]) {
                    if (indicator.checked) idsToRemove.add(indicator.id);
                }
            }
        });

        this.analyst1ObjectsInCart = this.analyst1ObjectsInCart.filter((obj) => !idsToRemove.has(obj.id));
    }

    getChecked() {
        const newObj = [];
        const checkedMap = new Map();

        this.analyst1Objects.forEach((evidence) => {
            if (evidence.checked && !this.evidenceInCart.has(evidence.id)) this.evidenceInCart.add(evidence.id);

            for (const type in evidence.indicatorList) {
                for (const indicator of evidence.indicatorList[type]) {
                    if (indicator.checked) newObj.push(indicator);
                }
            }

            if (evidence.checked) {
                const [checkedObjs, checkedAP] = this.getCheckedObjects(evidence);
                checkedMap.set(evidence.id, checkedObjs);
            }
        });

        const newObjs = JSON.parse(JSON.stringify(newObj));

        newObjs.forEach((o) => {
            if (!this.analyst1ObjectsInCart.some((objCart) => objCart.id === o.id)) {
                this.analyst1ObjectsInCart.push(o);
            }
        });

        return checkedMap;
    }

    clearSearchAnalyst1() {
        this.searchTextAnalyst1 = '';
    }

    close() {
        this.activeModal.close('cancel');
    }

    confirm() {
        this.activeModal.close('confirm');
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
        const objects = this.activeTab === 'indicator' ? this.pendingObjects : this.pendingStixObjects;
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

    addToBundle(type) {
        let objectsToAdd = type === 'indicator' ? this.pendingObjects : this.pendingStixObjects;

        if (type === 'both') {
            this.pendingObjects.forEach((po) => {
                if (!objectsToAdd.some((o) => o.id === po.id)) {
                    objectsToAdd.push(po);
                }
            });
        }

        let ignoreList: string[] = JSON.parse(localStorage.getItem('acsIgnore'));
        if (!ignoreList) ignoreList = [];

        const ignoreSet = new Set([...ignoreList]);

        objectsToAdd.forEach((o) => {
            if (
                o.type !== 'indicator' &&
                o.type !== 'report' &&
                o.type !== 'relationship' &&
                !all_schemas['SCOs'].includes(o.type) &&
                !ignoreSet.has(o.id)
            )
                ignoreSet.add(o.id);

            this.stixService.addComponent(o, true);
        });

        localStorage.setItem('acsIgnore', JSON.stringify(Array.from(ignoreSet)));

        //Update later to work with multiple reports?
        localStorage.setItem('evidence', this.evidenceInCart.values().next().value);
        this.activeModal.close('added');
    }

    cancelAnalyst1Search() {
        this.analyst1ObjectsObservable.unsubscribe();
        this.loadingStix = false;
        this.addingStixToPending = false;
    }

    expandResultDetail() {
        this.expandDetails = !this.expandDetails;
    }

    getCheckedObjects(analyst1Object) {
        if (analyst1Object.objectsList?.size > 0) {
            const checkedObjs = [];
            const checkedAP = [];
            analyst1Object.objectsList.forEach((type) => {
                type.objects.forEach((obj) => {
                    if (obj.checked) {
                        checkedObjs.push(obj.id);
                        if (obj.id.startsWith('attack-pattern')) checkedAP.push(obj.name);
                    }
                });
            });

            return [checkedObjs, checkedAP];
        } else return [[], []];
    }

    //Finish bundle processing for download/preview
    finalizeBundle(outputStix, indicatorToRemove: Set<any>) {
        if (JSON.stringify(this.stixConfig.acsMarkings) !== '{}' && !this.skipAcs) {
            const acsObj = this.stixConfig.acsMarkings;
            if (!outputStix.objects.find((elem) => elem.id === acsObj.id)) outputStix.objects.push(acsObj);
        }

        outputStix.objects = outputStix.objects.filter((elem) => {
            return elem.type !== 'relationship' || (elem.type === 'relationship' && !indicatorToRemove.has(elem.source_ref));
        });

        this.addRelAndLoc(outputStix);
        this.addTlpAndAcs(outputStix);
    }

    async exportObjects() {
        try {
            this.exportingObjects = true;
            this.addingStixToPending = true;
            const files = [];
            const evidPckgs = [];
            let mpeError = false;
            let mpeErrorMessage = 'IMX encountered an unexpected error while generating STIX 1.1';
            for (const obj of this.analyst1Objects) {
                if (obj.checked) {
                    await this.getIndicators(obj, false);
                    const outputStix = JSON.parse(JSON.stringify(this.evidenceMap.get(obj.id)));
                    const indicatorToRemove = new Set();
                    const reports = [];
                    const [checkedObjects, checkedAP] = this.getCheckedObjects(obj);

                    this.filterMarkingdefs(outputStix.objects);
                    this.filterObjects(outputStix, indicatorToRemove, reports, checkedObjects);

                    if (this.textOutput) {
                        let textFile = this.buildText(obj, outputStix);

                        files.push({ name: `${obj.id}_text.txt`, blob: new Blob([textFile], { type: 'text/plain;charset=utf-8;' }) });
                    }

                    if (this.csvOutput) {
                        const csvFile = [['INDICATOR_VALUE', 'TYPE', 'COMMENT', 'ROLE', 'ATTACK_PHASE', 'OBSERVED_DATE', 'HANDLING', 'DESCRIPTION']];

                        this.buildCsv(csvFile, outputStix, obj, checkedObjects, checkedAP);

                        files.push({
                            name: `${obj.id}_csv.csv`,
                            blob: new Blob([csvFile.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' }),
                        });
                    }

                    if (this.stixOutput) {
                        this.finalizeBundle(outputStix, indicatorToRemove);

                        reports.forEach((report) => {
                            report.object_refs = [];

                            outputStix.objects.forEach((elem) => {
                                if (elem.type === 'report') return;

                                report.object_refs.push(elem.id);
                            });

                            if (report.object_refs.length === 0) delete report.object_refs;
                        });

                        const stixFile = {
                            type: 'bundle',
                            id: outputStix.id,
                            objects: outputStix.objects,
                        };

                        files.push({
                            name: `${obj.id}_bundle.json`,
                            blob: new Blob([JSON.stringify(stixFile)], { type: 'application/taxii+json;version=2.1' }),
                        });
                    }

                    if (this.xmlOutput) {
                        const evid = await this.mapIndicatorIds(obj);
                        if (evid) {
                            try {
                                const mpe = await this.getImxPy(evid);
                                let xml = this.decodeXML(mpe);
                                if (mpe) {
                                    files.push({ name: `${obj.id}_xml.xml`, blob: new Blob([xml], { type: 'application/xml;charset=utf-8;' }) });
                                }
                            } catch (err) {
                                mpeError = true;
                                if (err.message?.includes('400 Bad Request')) {
                                    mpeErrorMessage = err.message;
                                }
                            }
                        }
                    }
                }
            }

            if (mpeError) {
                this.announcementService.show('IMX was unable to generate STIX 1.1', mpeErrorMessage, 'error', false);
            }

            if (files.length === 0) {
                this.exportingObjects = false;
                this.addingStixToPending = false;
                return;
            }

            for (const file of files) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(file.blob);
                a.download = file.name;
                setTimeout(() => {
                    a.click();
                    this.exportingObjects = false;
                    this.addingStixToPending = false;
                }, 400);
            }
        } catch (err) {
            console.error('Error while exporting', err);
            this.exportingObjects = false;
            this.addingStixToPending = false;
        }
    }

    findCountry() {
        const countries = this.countries.get(this.tempStixConfig.orgCountry);
        if (countries.length === 1) {
            return countries[0];
        } else {
            return countries.find((country) => {
                if (!this.tempStixConfig.orgAdmin && !country.administrative_area) return true;

                return this.tempStixConfig.orgAdmin === country.administrative_area;
            });
        }
    }

    addRelAndLoc(stix) {
        const countries = this.countries.get(this.stixConfig.orgCountry);
        const location = this.findCountry();

        if (!stix.objects.some((elem) => location.id === elem.id)) {
            let relationship;
            if (location.id === 'location--78a7f0f3-ea60-4ca2-894e-9e825b94b592') {
                relationship = {
                    type: 'relationship',
                    spec_version: '2.1',
                    id: 'relationship--b6fe158f-fa95-4a40-ac68-78e480a54c69',
                    created_by_ref: 'identity--b1160532-b8f3-4cfa-9b7d-423e253fbc59',
                    created: '2024-08-07T16:30:26.628Z',
                    modified: '2024-08-07T16:30:26.628Z',
                    source_ref: 'identity--b1160532-b8f3-4cfa-9b7d-423e253fbc59',
                    relationship_type: 'located-at',
                    target_ref: 'location--78a7f0f3-ea60-4ca2-894e-9e825b94b592',
                    tlp: stix.tlp,
                };
            } else {
                relationship = {
                    type: 'relationship',
                    spec_version: '2.1',
                    id: `relationship--${uuid()}`,
                    created_by_ref: this.envService.env.defaultIdentity.id,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    source_ref: this.envService.env.defaultIdentity.id,
                    relationship_type: 'located-at',
                    target_ref: location.id,
                    tlp: stix.tlp,
                };
            }

            stix.objects.push(location);
            stix.objects.push(relationship);
            const reports = stix.objects.filter((elem) => elem.type === 'report');

            reports.forEach((report) => {
                if (!report.object_refs) report.object_refs = [];
                if (!report.object_refs.includes(location.id)) report.object_refs.push(location.id);
                if (!report.object_refs.includes(relationship.id)) report.object_refs.push(relationship.id);
            });
        }
    }

    addTlpAndAcs(stix) {
        const acsList = new Set();
        let tlp;

        //Add ACS Markings to all object_marking_refs and add created_by_ref to appropriate objects
        for (const obj of stix.objects) {
            if (obj.type === 'marking-definition') continue;
            if (obj.type === 'indicator' || obj.type === 'relationship' || obj.type === 'report') {
                obj.created_by_ref = this.envService.env.defaultIdentity.id;
            }
            if (obj.type === 'attack-pattern' && !obj.created_by_ref) {
                obj.created_by_ref = this.envService.env.defaultIdentity.id;
            }

            if (JSON.stringify(this.stixConfig.acsMarkings) !== '{}' && !this.skipAcs) {
                const acs = this.stixConfig.acsMarkings;
                if (!obj.object_marking_refs) obj.object_marking_refs = [];

                obj.object_marking_refs = obj.object_marking_refs.filter((elem) => !acsList.has(elem));
                obj.object_marking_refs.push(acs.id);

                if (obj.type === 'report') {
                    if (!obj.object_refs) {
                        obj.object_refs = [];
                    }

                    if (!obj.object_refs.includes(acs.id)) obj.object_refs.push(acs.id);
                }
            }

            //Remove TLP from object marking refs
            const markingRefs = new Set<string>();
            TLP_OPTIONS.forEach((tlp) => markingRefs.add(tlp.id));
            const markingRefs2 = new Set<string>();
            TLP20_OPTIONS.forEach((tlp) => markingRefs2.add(tlp.id));

            const tlp2 = new Map();
            TLP20_OPTIONS.forEach((tlpOpt) => tlp2.set(tlpOpt.name, tlpOpt.id));

            if (obj.object_marking_refs) {
                obj.object_marking_refs = obj.object_marking_refs.filter((id) => !markingRefs.has(id) && !markingRefs2.has(id));

                if (obj.object_marking_refs.length === 0) delete obj.object_marking_refs;
            }

            //Add TLP ONly when ACS is added:

            if (JSON.stringify(this.stixConfig.acsMarkings) !== '{}' && !this.skipAcs) {
                if (this.acsMarkingConfig.destination.endsWith('(TLP:CLEAR)')) {
                    if (!obj.object_marking_refs) obj.object_marking_refs = [];

                    obj.object_marking_refs.push('marking-definition--94868c89-83c2-464b-929b-a1a8aa3c8487');
                } else if (this.acsMarkingConfig.destination.endsWith('(TLP:GREEN)')) {
                    if (!obj.object_marking_refs) obj.object_marking_refs = [];

                    obj.object_marking_refs.push('marking-definition--bab4a63c-aed9-4cf5-a766-dfca5abac2bb');
                } else if (this.acsMarkingConfig.destination.endsWith('(TLP:AMBER)')) {
                    if (!obj.object_marking_refs) obj.object_marking_refs = [];

                    obj.object_marking_refs.push('marking-definition--55d920b0-5e8b-4f79-9ee9-91f868d9b421');
                }
            }

            delete obj.tlp;
        }
    }

    buildText(obj, outputStix) {
        let textFile = '';

        const [checkedObjects, checkedAP] = this.getCheckedObjects(obj);

        if (obj.title && obj.title.name) {
            textFile += obj.title.name.replace("'", '');
        } else {
            textFile += 'No Document Title provided';
        }

        textFile +=
            '\n\nDepartment of Homeland Security\n' +
            'Cybersecurity and Infrastructure Security Agency (CISA)\n' +
            'Reference Number: ' +
            obj.id +
            '\n' +
            'Report Date: ' +
            obj.reportedDate.date +
            '\n\n' +
            'Notification:\n\n' +
            'DISCLAIMER: CISA has not independently verified this information. CISA does not provide\n' +
            'any warranties of any kind regarding this information. The information in this report\n' +
            'is being provided "as is" for informational purposes only. CISA does not endorse any\n' +
            'commercial entity, product, company, or service, including any entities, products, or\n' +
            'services linked or referenced within this document. Any reference to specific commercial\n' +
            'entities, products, processes, or services by service mark, trademark, manufacturer, or\n' +
            'otherwise, does not constitute or imply endorsement, recommendation, or favoring by CISA.\n';

        if (obj.tlp) {
            if (obj.tlp.toLowerCase() === 'white') {
                textFile +=
                    'This document is being shared subject to Traffic Light Protocol (TLP) marking TLP:WHITE.\n' +
                    'TLP:WHITE means that recipients may share this information without restriction.\n' +
                    'Information is subject to standard copyright rules.\n';
            } else if (obj.tlp.toLowerCase() === 'clear') {
                textFile +=
                    'This document is being shared subject to Traffic Light Protocol (TLP) marking TLP:CLEAR\n' +
                    'TLP:CLEAR means that recipients may share this information without restriction.\n' +
                    'Information is subject to standard copyright rules.\n';
            } else if (obj.tlp.toLowerCase() === 'green') {
                textFile +=
                    'This document is being shared subject to Traffic Light Protocol (TLP) marking TLP:GREEN.\n' +
                    'TLP:GREEN means that recipients may share TLP:GREEN information with peers and partner\n' +
                    'organizations within their community, but not via publicly accessible channels. Unless\n' +
                    'otherwise specified, TLP:GREEN information may not be shared outside of the cybersecurity\n';
            } else if (obj.tlp.toLowerCase() === 'amber') {
                textFile +=
                    'This document is being shared subject to Traffic Light Protocol (TLP) marking TLP:AMBER.\n' +
                    'TLP:AMBER means that recipients may share TLP:AMBER information with members of their\n' +
                    'own organization and its clients on a need-to-know basis to protect their organization\n' +
                    'and its clients and prevent further harm.\n';
            } else if (obj.tlp.toLowerCase() === 'amber+strict' || obj.tlp.toLowerCase() === 'amberstrict') {
                textFile +=
                    'This document is distributed as TLP:AMBER+STRICT: Limited disclosure, restricted to \n' +
                    'participants organizations. Recipients may share TLP:AMBER+STRICT information only \n' +
                    'with members of their own organization on a need-to-know basis to protect their \n' +
                    'organization and prevent further harm. \n';
            } else if (obj.tlp.toLowerCase() === 'red') {
                textFile +=
                    'document is distributed as TLP:RED: Not for disclosure, restricted to participants\n' +
                    'only. Recipients may not share TLP:RED information with any parties outside of \n' +
                    'the specific exchange, meeting, or conversation in which it was originally disclosed.\n';
            }

            textFile +=
                'For more information on the Traffic Light Protocol, see\n' +
                'https://www.cisa.gov/news-events/news/traffic-light-protocol-tlp-definitions-and-usage.\n';
        }

        let newLine = '';
        let newDesc = '';

        if (obj.description?.name && obj.description.name.length > 0) {
            newDesc = obj.description.name
                .split('\r\n\r\n')
                .map((para) => {
                    let lines = para.split('\r\n');
                    let wrappedLines = [];

                    for (let line of lines) {
                        let words = line.split(' ');
                        let currentLine = '';

                        for (let word of words) {
                            if ((currentLine + word).length > 80) {
                                wrappedLines.push(currentLine.trim());
                                currentLine = '';
                            }

                            currentLine += word + ' ';
                        }

                        if (currentLine.trim()) wrappedLines.push(currentLine.trim());
                    }
                    return wrappedLines.join('\r\n');
                })
                .join('\r\n\r\n');
        }

        textFile += '\n\nSummary:\n\n';
        if (newDesc) textFile += newDesc + '\n\n';
        else textFile += 'No Summary Provided\n\n';

        const attackPatterns = outputStix.attackPatterns?.filter((ap) => checkedAP.includes(ap.name));

        if (attackPatterns && attackPatterns.length > 0) {
            textFile += '\nAttack Patterns:\n';
            for (const ap of attackPatterns) {
                textFile += ap.name + '\n';
            }
            textFile += '\n';
        }
        return textFile;
    }

    filterObjects(outputStix, indicatorToRemove: Set<any>, reports: any[], checkedObjects: any[]) {
        outputStix.objects.forEach((elem) => {
            if (elem.type === 'indicator' && !elem.checked) indicatorToRemove.add(elem.id);

            if (elem.type === 'report') {
                reports.push(elem);
            }
        });

        outputStix.objects = outputStix.objects.filter((elem) => {
            if (elem.type === 'marking-definition') return false;

            let add;
            if (elem.type === 'indicator') {
                if (elem.checked) add = true;
                else add = false;
            } else if (elem.type === 'relationship') {
                let src = elem.source_ref.startsWith('indicator--') && !indicatorToRemove.has(elem.source_ref);
                if (!src) src = checkedObjects.includes(elem.source_ref);

                let targ = elem.target_ref.startsWith('indicator--') && !indicatorToRemove.has(elem.target_ref);
                if (!targ) targ = checkedObjects.includes(elem.target_ref);
                if (!targ || !src) add = false;
                else add = true;
            } else {
                if (checkedObjects.includes(elem.id)) add = true;
                else add = false;
            }

            if (elem.type === 'indicator') {
                delete elem.evidenceId;
                delete elem.indicatorId;
                delete elem.nameValue;
                delete elem.expanded;
                delete elem.checked;
            }

            return add;
        });
    }

    async previewFile(type: string, obj: any = null) {
        let blob, url, newTab, outputStix;
        let checkedObjects, checkedAP;
        try {
            this.acsLoading = true;

            switch (type) {
                case 'stix':
                    let addAll = false;
                    await this.getIndicators(this.previewAnalyst1, false);
                    const previewStix = JSON.parse(JSON.stringify(this.evidenceMap.get(this.previewAnalyst1.id)));
                    this.stixConfig = JSON.parse(JSON.stringify(this.tempStixConfig));
                    const indicatorToRemove = new Set();
                    const reports = [];

                    [checkedObjects, checkedAP] = this.getCheckedObjects(obj);

                    //If previewing and all indicators are unselected, select all by default
                    if (
                        previewStix.objects.every((elem) => {
                            if (elem.type !== 'indicator') {
                                return !checkedObjects.includes(elem.id);
                            }

                            return !elem.checked;
                        })
                    ) {
                        previewStix.objects.forEach((elem) => {
                            if (elem.type === 'indicator') {
                                elem.checked = true;
                            }
                        });

                        addAll = true;
                    }

                    this.filterMarkingdefs(previewStix.objects);
                    this.filterObjects(previewStix, indicatorToRemove, reports, checkedObjects);

                    this.finalizeBundle(previewStix, indicatorToRemove);

                    reports.forEach((report) => {
                        report.object_refs = [];

                        previewStix.objects.forEach((obj) => {
                            if (obj.id === report.id) return;

                            report.object_refs.push(obj.id);
                        });
                    });

                    const prev = {
                        type: 'bundle',
                        id: previewStix.id,
                        objects: previewStix.objects,
                    };

                    blob = new Blob([JSON.stringify(prev, null, 2)], { type: 'application/taxii+json;version=2.1' });
                    url = URL.createObjectURL(blob);
                    newTab = window.open(url);
                    newTab?.document.write('<pre>', JSON.stringify(prev, null, 2), '</pre>');
                    newTab?.document.close();

                    this.saveStixConfig();
                    break;
                case 'text':
                    this.addingStixToPending = true;
                    await this.getIndicators(obj, false);
                    outputStix = JSON.parse(JSON.stringify(this.evidenceMap.get(obj.id)));

                    [checkedObjects, checkedAP] = this.getCheckedObjects(obj);
                    let textFile = this.buildText(obj, outputStix);

                    blob = new Blob([textFile], { type: 'text/plain;charset=utf-8;' });
                    url = URL.createObjectURL(blob);
                    newTab = window.open(url);
                    newTab?.document.write('<pre>', textFile, '</pre>');
                    newTab?.document.close();
                    this.addingStixToPending = false;
                    this.acsLoading = false;
                    break;
                case 'csv':
                    this.addingStixToPending = true;

                    await this.getIndicators(obj, false);
                    outputStix = JSON.parse(JSON.stringify(this.evidenceMap.get(obj.id)));
                    const csvFile = [['INDICATOR_VALUE', 'TYPE', 'COMMENT', 'ROLE', 'ATTACK_PHASE', 'OBSERVED_DATE', 'HANDLING', 'DESCRIPTION']];

                    [checkedObjects, checkedAP] = this.getCheckedObjects(obj);
                    this.buildCsv(csvFile, outputStix, obj, checkedObjects, checkedAP);

                    blob = new Blob([csvFile.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
                    url = URL.createObjectURL(blob);
                    newTab = window.open(url);
                    newTab?.document.write('<pre>', csvFile.map((row) => row.join(',')).join('\n'), '</pre>');
                    newTab?.document.close();

                    this.addingStixToPending = false;
                    this.acsLoading = false;
                    break;
            }
        } catch (err) {
            console.error('Error', err);
            this.addingStixToPending = false;
            this.acsLoading = false;
        }
    }

    buildCsv(csvFile: string[][], outputStix: any, obj: any, checkedObjects, checkedAP) {
        if (outputStix.attackPatterns) {
            for (const attackPattern of outputStix.attackPatterns) {
                if (checkedAP === null) csvFile.push([attackPattern.name, 'ATT&CK Technique', '', 'Behavior / TTP', '', '', '', '']);
                else if (checkedAP.includes(attackPattern.name))
                    csvFile.push([attackPattern.name, 'ATT&CK Technique', '', 'Behavior / TTP', '', '', '', '']);
            }
        }

        const checkedIndicators = [];

        for (const key in obj.indicatorList) {
            obj.indicatorList[key].forEach((elem) => {
                if (elem.checked) checkedIndicators.push(elem.id);
            });
        }

        for (const stixObj of outputStix.objects) {
            if (stixObj.type !== 'indicator') continue;

            if (!checkedIndicators.includes(stixObj.id)) continue;

            let indicator_value = '';
            let type = '';
            let comment = '';
            let role = '';
            let attack_phase = '';
            let observed_date = '';
            let handling = '';
            let description = '';

            let patterns;

            const patternType = stixObj.pattern
                .substring(1, stixObj.pattern.length - 1)
                .split(':')[0]
                .replace(/[()\[\]']/g, '');

            if (patternType !== 'file') {
                patterns = stixObj.pattern
                    .substring(1, stixObj.pattern.length - 1)
                    .replace(/[()\[\]']/g, '')
                    .split('AND');
            }
            observed_date = stixObj.valid_from;
            const validTlps = new Set(['white', 'clear', 'amber', 'green', 'amber+strict', 'red']);

            if (obj.tlp && validTlps.has(obj.tlp.toLowerCase())) {
                handling = 'TLP:' + obj.tlp.toUpperCase();
            }

            if (patternType === 'file') {
                let patternString = stixObj.pattern;
                patternString = patternString.replace(/[()\[\]']/g, '');
                let patternArr = patternString.split(' OR ');
                let fileTypes = new Map();

                let buildPatterns = patternString.split(' AND ');
                const fileParse = {
                    hashes: {
                        SHA1: '',
                        SHA256: '',
                        SHA512: '',
                        SSDEEP: '',
                        MD5: '',
                    },
                    FILE_NAME: [],
                    FILE_SIZE: [],
                };

                for (let parseType of buildPatterns) {
                    const fileInfos = parseType.split(' OR ');
                    for (let fileType of fileInfos) {
                        if (fileType.startsWith('file:hashes.')) {
                            let hashes = fileType.split(' = ');
                            let hash = hashes[0];
                            let value = hashes[1];

                            hash = hash.substring(12);

                            fileParse.hashes[hash] = value;
                        } else if (fileType.startsWith('file:name')) {
                            let names = fileType.split(' = ');
                            fileParse.FILE_NAME.push(names[1]);
                        } else if (fileType.startsWith('file:size')) {
                            let sizes = fileType.split(' = ');
                            fileParse.FILE_SIZE.push(sizes[1]);
                        }
                    }
                }

                type = 'MD5';
                role = 'FILE HASH WATCHLIST';
                indicator_value = fileParse.hashes.MD5;
                delete fileParse.hashes.MD5;

                for (const key in fileParse.hashes) {
                    if (fileParse.hashes[key]) {
                        if (comment.length > 0) comment += '|';

                        comment += key + ':' + fileParse.hashes[key];
                    }
                }

                for (const size of fileParse.FILE_SIZE) {
                    if (comment.length > 0) comment += '|';

                    comment += 'FILE_SIZE:' + size;
                }

                csvFile.push([indicator_value, type, comment, role, attack_phase, observed_date, handling, description]);
            } else {
                for (let pattern of patterns) {
                    const keyValue = pattern.split('=');
                    type = keyValue[0].split(':')[0];
                    type = type.trim();
                    indicator_value = keyValue[1].trim();

                    switch (type) {
                        case 'mutex':
                            type = 'STRING';
                            role = 'MUTEX';
                            if (indicator_value.length > 500) indicator_value = `"${indicator_value.substring(0, 500)}"`;
                            else indicator_value = `"${indicator_value}"`;
                            break;
                        case 'domain-name':
                            type = 'FQDN';
                            role = 'DOMAIN WATCHLIST';
                            indicator_value = indicator_value.replace('http', 'hxxp').replace(/\./g, '[.]').replace(/:/g, '[:]');
                            break;
                        case 'url':
                            type = 'URL';
                            role = 'URL WATCHLIST';
                            indicator_value = indicator_value.replace('http', 'hxxp').replace(/\./g, '[.]').replace(/:/g, '[:]');
                            break;
                        case 'ipv4-addr':
                            type = 'IPV4ADDR';
                            role = 'IP WATCHLIST';
                            break;
                        case 'ipv6-addr':
                            type = 'IPV6ADDR';
                            role = 'IP WATCHLIST';
                            break;
                        case 'user-account':
                            type = 'STRING';
                            comment = 'USER_AGENT_STRING';
                            role = 'MALWARE ARTIFACTS';
                            break;
                        case 'email-addr':
                            type = 'EMAIL';
                            role = 'EMAIL_SOURCE_ADDRESS';
                            break;
                        case 'email-message':
                            type = 'EMAIL';
                            role = 'SUBJECT';
                            break;
                        default:
                            type = type;
                            ((role = type.toUpperCase()), ' WATCHLIST');
                            break;
                    }

                    if (type === 'windows-registry-key') csvFile.push(['Registry is not a supported Indicator Type in TPG IB.']);
                    else csvFile.push([indicator_value, type, comment, role, attack_phase, observed_date, handling, description]);
                }
            }
        }
    }

    openStixConfig(type, previewObj = null) {
        if (this.stixOutput || type === 'preview' || type === 'review') {
            this.previewAnalyst1 = previewObj;

            this.stixConfigType = type;

            if (this.saveConfig) this.tempStixConfig = JSON.parse(JSON.stringify(this.stixConfig));

            this.saveConfig = false;
            this.validateAcsMarking();
            this.filterFormalDetermination();

            this.determineDestination();

            this.configModalRef = this.modalService.open(this.stixModal, { ariaLabelledBy: 'stix-config-modal', size: 'xl' });
            this.configModalRef.result.finally(() => {
                this.acsLoading = false;

                if (this.saveConfig) {
                    this.stixConfig = JSON.parse(JSON.stringify(this.tempStixConfig));
                    this.tempStixConfig = JSON.parse(JSON.stringify(this.defaultStixConfig));
                } else {
                    this.tempStixConfig = JSON.parse(JSON.stringify(this.stixConfig));

                    if (!this.stixConfigSaved) this.stixOutput = false;
                }
            });
        }
    }

    resetAcs() {
        this.acsMarkingConfig = {
            destination: '',
            classification: 'U',
            formal_determination: '',
            control_shareability: [],
            usage_permissions: 'Deny',
            privilege_action: '',
            usage_rule_effect: '',
            entity: '',
            entity_list: [],
            permitted_nationalities: '',
            permitted_nationalities_list: [],
            permitted_organizations: '',
            permitted_organizations_list: [],
            shareability: '',
            shareability_list: [],
            further_sharing: 'Deny',
            sharing_scope: '',
            sharing_scope_list: [],
            further_rule_effect: '',
            access_privilege_list: [
                {
                    privilege_action: 'CISAUSES',
                    rule_effect: 'permit',
                    privilege_scope: {
                        entity: ['ALL'],
                        permitted_nationalities: ['ALL'],
                        permitted_organizations: ['ALL'],
                        shareability: ['ALL'],
                    },
                },
            ],
            further_sharing_list: [
                {
                    sharing_scope: ['USA.USG'],
                    rule_effect: 'permit',
                },
            ],
        };

        this.acsIsValid = false;
        this.acsErrors = {
            destination: 'Destination must be filled',
            classification: 'Classification must be filled',
            formal_determination: 'Formal Determination must be selected',
            usage_permission: '',
            further_sharing: '',
        };

        this.enableAddValue = {
            entity_list: false,
            permitted_nationalities_list: false,
            permitted_organizations_list: false,
            shareability_list: false,
            sharing_scope_list: false,
        };
        this.enableObj = {
            access_privilege: false,
            further_sharing: false,
        };
    }

    closeStixConfig() {
        if (this.configModalRef) this.configModalRef.dismiss();
    }

    /**
     *
     * @param type The expected format of the output. Output for downloading, review for adding to stix bundle, preview to open new tab
     * @param obj The evidence object expected from specifically PREVIEW.
     */
    async getCountries(type: 'output' | 'review' | 'preview', previewObj = null) {
        try {
            if (!this.stixOutput && type === 'output') return;

            //Used to get list of countries/regions, but now defaulting to US-DC

            this.countries.set(this.usDC.country, [this.usDC]);
            this.countriesLoaded = true;
            this.openStixConfig(type, previewObj);
            return;
        } catch (err) {
            this.addingStixToPending = false;
            this.countries.set(this.usDC.country, [this.usDC]);
            this.countriesLoaded = true;
            this.openStixConfig(type, previewObj);
            return;
        }
    }

    changeCountry(event: any) {
        this.tempStixConfig.orgCountry = event.target.value;
        this.tempStixConfig.orgAdmin = '';
    }

    sortAdmin(arr) {
        return arr.sort((elem1, elem2) => {
            if (elem1.administrative_area === undefined && elem2.administrative_area !== undefined) return -1;
            if (elem1 !== undefined && elem2.administrative_area === undefined) return 1;
            return elem1.administrative_area.localeCompare(elem2.administrative_area);
        });
    }

    changeAdmin(event: any) {
        this.tempStixConfig.orgAdmin = event.target.value;
    }

    saveStixConfig() {
        this.saveConfig = true;
        this.stixConfigSaved = true;
        this.configModalRef.dismiss();
    }

    enableAdmin() {
        return this.countries.get(this.tempStixConfig.orgCountry).length > 1;
    }

    selectAcsMarking(event) {
        this.tempStixConfig.acsMarkings = event.target.value;
    }

    /**
     * Generate ACS Marking Definition based on the configurations set in ACS Config Modal
     */
    generateAcs() {
        const storedIdentity = localStorage.getItem('identity');

        const acs = {
            type: 'marking-definition',
            spec_version: '2.1',
            id: `marking-definition--${uuid()}`,
            created: new Date().toISOString(),
            created_by_ref: storedIdentity ? storedIdentity : this.envService.env.defaultIdentity.id,
            extensions: {
                'extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce': {
                    extension_type: 'property-extension',
                    identifier: 'isa:guide.19001.DFTA-a9bdb603-7f4f-44c6-acb0-d47f614e64b2',
                    create_date_time: new Date().toISOString(),
                    responsible_entity_custodian: 'USA.DHS.CISA.CSD.TH',
                    responsible_entity_originator: 'USA.DHS.CISA.CSD.TH',
                    policy_reference: `urn:isa:policy:acs:ns:v3.0?privdefault=${this.acsMarkingConfig.usage_permissions.toLowerCase()}&sharedefault=${this.acsMarkingConfig.further_sharing.toLowerCase()}`,
                    control_set: {
                        classification: this.acsMarkingConfig.classification,
                    },
                    authority_reference: ['urn:isa:authority:ais'],
                },
            },
        };

        const acs_type: string = localStorage.getItem('acs-type');
        let acs_types: Record<string, string>;

        if (!acs_type) acs_types = {};
        else acs_types = JSON.parse(acs_type);

        acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['formal_determination'] = [
            ...this.selectedFormalDeterminations,
        ];

        acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'] = [
            ...this.acsMarkingConfig.control_shareability,
        ];

        if (acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'].length === 0)
            delete acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce'].control_set['shareability'];

        acs_types[acs.id] = this.acsMarkingConfig.destination;

        localStorage.setItem('acs-type', JSON.stringify(acs_types));

        if (this.acsMarkingConfig.access_privilege_list.length > 0) {
            acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']['access_privilege'] =
                this.acsMarkingConfig.access_privilege_list;
        }
        if (this.acsMarkingConfig.further_sharing_list.length > 0) {
            acs.extensions['extension-definition--3a65884d-005a-4290-8335-cb2d778a83ce']['further_sharing'] =
                this.acsMarkingConfig.further_sharing_list;
        }

        this.tempStixConfig.acsMarkings = acs;
    }

    validateAcsMarking() {
        let valid = true;

        if (!this.acsMarkingConfig.destination) {
            this.acsErrors.destination = 'Destination must be filled';
            valid = false;
        } else {
            this.acsErrors.destination = '';
        }

        if (!this.acsMarkingConfig.classification) {
            this.acsErrors.classification = 'Classification must be filled';
            valid = false;
        } else {
            this.acsErrors.classification = '';
        }

        if (this.selectedFormalDeterminations.length === 0) {
            this.acsErrors.formal_determination = 'Formal Determination must be selected';
            valid = false;
        } else {
            this.acsErrors.formal_determination = '';
        }

        if (!this.acsMarkingConfig.usage_permissions) {
            this.acsErrors.usage_permission = 'Usage Permissions must be selected';
            valid = false;
        } else {
            this.acsErrors.usage_permission = '';
        }

        if (!this.acsMarkingConfig.further_sharing) {
            this.acsErrors.further_sharing = 'Further Sharing must be selected';
            valid = false;
        } else {
            this.acsErrors.further_sharing = '';
        }

        this.acsIsValid = valid;
    }

    validateAddString(prop) {
        const propList = `${prop}_list`;

        if (!this.acsMarkingConfig[prop]) {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].length > 0 && this.acsMarkingConfig[prop] === 'ALL') {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].includes('ALL')) {
            this.enableAddValue[propList] = false;
            return;
        }

        if (this.acsMarkingConfig[propList].includes(this.acsMarkingConfig[prop])) {
            this.enableAddValue[propList] = false;
        } else {
            this.enableAddValue[propList] = true;
        }
    }

    addString(prop: ListProperties) {
        const propList = `${prop}_list`;
        this.acsMarkingConfig[propList].push(this.acsMarkingConfig[prop]);
        this.acsMarkingConfig[prop] = '';
        this.enableAddValue[propList] = false;
        this.validateAddObj();

        if (prop === 'formal_determination') this.validateAcsMarking();
    }

    removeString(prop: keyof AcsConfig, value) {
        const propList = `${prop}_list`;
        this.acsMarkingConfig[propList] = this.acsMarkingConfig[propList].filter((elem) => elem !== value);
        this.validateAddString(prop);
        this.validateAddObj();

        if (prop === 'formal_determination') this.validateAcsMarking();
    }

    validateAddObj() {
        if (
            !this.acsMarkingConfig.privilege_action ||
            !this.acsMarkingConfig.usage_rule_effect ||
            (this.acsMarkingConfig.entity_list.length === 0 &&
                this.acsMarkingConfig.permitted_nationalities_list.length === 0 &&
                this.acsMarkingConfig.permitted_organizations_list.length === 0 &&
                this.acsMarkingConfig.shareability_list.length === 0)
        ) {
            this.enableObj.access_privilege = false;
        } else {
            this.enableObj.access_privilege = true;
        }

        if (this.acsMarkingConfig.sharing_scope_list.length === 0 || !this.acsMarkingConfig.further_rule_effect) {
            this.enableObj.further_sharing = false;
        } else {
            this.enableObj.further_sharing = true;
        }
    }

    //Need to lowercase
    addObj(prop: 'access_privilege_list' | 'further_sharing_list') {
        if (prop === 'access_privilege_list') {
            const privilege_scope: PrivilegeScope = {};
            if (this.acsMarkingConfig.entity_list.length > 0) privilege_scope.entity = this.acsMarkingConfig.entity_list;
            if (this.acsMarkingConfig.permitted_nationalities_list.length > 0)
                privilege_scope.permitted_nationalities = this.acsMarkingConfig.permitted_nationalities_list;
            if (this.acsMarkingConfig.permitted_organizations_list.length > 0)
                privilege_scope.permitted_organizations = this.acsMarkingConfig.permitted_organizations_list;
            if (this.acsMarkingConfig.shareability_list.length > 0) privilege_scope.shareability = this.acsMarkingConfig.shareability_list;

            const access_privilege: AccessPrivilege = {
                privilege_action: this.acsMarkingConfig.privilege_action,
                rule_effect: this.acsMarkingConfig.usage_rule_effect.toLowerCase() as 'deny' | 'permit',
            };

            if (JSON.stringify(privilege_scope) !== '{}') access_privilege.privilege_scope = privilege_scope;

            this.acsMarkingConfig.access_privilege_list.push(JSON.parse(JSON.stringify(access_privilege)));
            this.access_privilege_collapse.push(false);

            this.acsMarkingConfig.privilege_action = '';
            this.acsMarkingConfig.usage_rule_effect = '';
            this.acsMarkingConfig.entity = '';
            this.acsMarkingConfig.permitted_nationalities = '';
            this.acsMarkingConfig.permitted_organizations = '';
            this.acsMarkingConfig.shareability = '';
            this.acsMarkingConfig.entity_list = [];
            this.acsMarkingConfig.permitted_nationalities_list = [];
            this.acsMarkingConfig.permitted_organizations_list = [];
            this.acsMarkingConfig.shareability_list = [];
            this.enableAddValue.entity_list = false;
            this.enableAddValue.permitted_nationalities_list = false;
            this.enableAddValue.permitted_organizations_list = false;
            this.enableAddValue.shareability_list = false;
            this.enableObj.access_privilege = false;
        } else {
            const further_sharing: FurtherSharing = {
                sharing_scope: this.acsMarkingConfig.sharing_scope_list,
                rule_effect: this.acsMarkingConfig.further_rule_effect.toLowerCase() as 'deny' | 'permit',
            };

            this.acsMarkingConfig.further_sharing_list.push(JSON.parse(JSON.stringify(further_sharing)));
            this.further_sharing_collapse.push(false);

            this.acsMarkingConfig.sharing_scope = '';
            this.acsMarkingConfig.further_rule_effect = '';
            this.acsMarkingConfig.sharing_scope_list = [];
            this.enableAddValue.sharing_scope_list = false;
            this.enableObj.further_sharing = false;
        }
        this.validateAcsMarking();
    }

    removeObj(type: 'access_privilege' | 'further_sharing', index) {
        this.acsMarkingConfig[`${type}_list`].splice(index, 1);
        this[`${type}_collapse`].splice(index, 1);
        this.validateAcsMarking();
    }

    collapseJson(type: 'access_privilege_collapse' | 'further_sharing_collapse', index: number) {
        this[type][index] = !this[type][index];
    }

    goBack() {
        this.step = 0;
        this.analyst1ObjectsInCart = [];
        this.evidenceInCart = new Set();

        const relationship = this.pendingObjects.find((elem) => elem.type === 'relationship' && elem.target_ref.startsWith('location'));
        this.pendingObjects.forEach((elem) => {
            if (elem.type === 'report') {
                elem.object_refs = elem.object_refs.filter((ref) => !ref.startsWith('location') && ref !== relationship.id);
            }
        });
    }

    isReady() {
        if (!this.csvOutput && !this.textOutput && !this.stixOutput && !this.xmlOutput) return false;

        return this.analyst1Objects.some((evidence) => evidence.checked);
    }

    setSkipAcs(bool) {
        this.skipAcs = bool;
    }

    /**
     * Remove empty array and objects from STIX objects that are present from Analyst1
     * @param obj
     */
    deleteEmptyList(obj) {
        for (let prop in obj) {
            if ((Array.isArray(obj[prop]) && obj[prop].length === 0) || JSON.stringify(obj[prop]) === '{}') {
                delete obj[prop];
            }
        }
    }

    expandAccessPrivilege() {
        this.showAccessPriv = !this.showAccessPriv;
    }

    expandFurtherSharing() {
        this.showFurtherSharing = !this.showFurtherSharing;
    }

    formalDeterminationView(formalDet) {
        if (formalDet === 'Federal and non-Federal Entities') return 'Federal and CISCP';

        return formalDet;
    }

    addFormalDetermination() {
        this.selectedFormalDeterminations.push(this.formalDeterminationText);
        this.formalDeterminationText = '';
        this.validateAcsMarking();
        this.filterFormalDetermination();
    }

    removeFormalDetermination(index: number) {
        this.selectedFormalDeterminations.splice(index, 1);
        this.validateAcsMarking();
        this.filterFormalDetermination();
    }

    filterFormalDetermination() {
        this.filteredFormalDeterminationOptions = this.formalDeterminationOptions.filter((opt) => {
            if (this.selectedFormalDeterminations.includes(opt)) return false;

            return opt.toLowerCase().includes(this.formalDeterminationText.toLowerCase());
        });
    }

    updateDestination() {
        this.destinationDisabledProp = {
            shareability: false,
            furtherSharing: false,
            furtherSharingOption: false,
            accessPrivilege: false,
            accessPrivilegeOption: false,
            formalDetermination: false,
        };

        switch (this.acsMarkingConfig.destination) {
            case '':
                return;
            case 'Federal':
                this.acsMarkingConfig.control_shareability = [];
                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    delete acl.privilege_scope?.shareability;

                    this.acsMarkingConfig.usage_permissions = 'Deny';
                    this.acsMarkingConfig.further_sharing = 'Deny';
                });
                break;
            case 'Federal, Public (TLP:CLEAR)':
                this.selectedFormalDeterminations = ['INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT', 'PUBREL'];
                this.acsMarkingConfig.usage_permissions = 'Permit';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = [];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'permit';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem != 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['AIS'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem != 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['AIS'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, CISCP (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');

                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['CISCP'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, CISCP (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['CISCP'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public, CISCP (TLP:GREEN)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Permit';
                this.acsMarkingConfig.control_shareability = ['CISCP', 'AIS'];
                this.acsMarkingConfig.further_sharing_list = [];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
            case 'Federal, Public, CISCP (TLP:AMBER)':
                this.selectedFormalDeterminations = this.selectedFormalDeterminations.filter((elem) => elem !== 'PUBREL');
                if (this.selectedFormalDeterminations.length === 0)
                    this.selectedFormalDeterminations.push('INFORMATION-DIRECTLY-RELATED-TO-CYBERSECURITY-THREAT');

                this.acsMarkingConfig.usage_permissions = 'Deny';
                this.acsMarkingConfig.further_sharing = 'Deny';
                this.acsMarkingConfig.control_shareability = ['CISCP', 'AIS'];

                this.acsMarkingConfig.further_sharing_list = [
                    {
                        sharing_scope: ['NONFED'],
                        rule_effect: 'permit',
                    },
                ];

                this.acsMarkingConfig.access_privilege_list.forEach((acl) => {
                    acl.privilege_action = 'ANONYMOUSACCESS';
                    acl.rule_effect = 'deny';
                    delete acl.privilege_scope?.shareability;
                });
                break;
        }

        this.validateAcsMarking();
    }

    determineDestination() {
        const acsObj = {
            control_set: {
                formal_determination: this.selectedFormalDeterminations,
                shareability: this.acsMarkingConfig.control_shareability,
            },
            access_privilege: this.acsMarkingConfig.access_privilege_list,
            further_sharing: this.acsMarkingConfig.further_sharing_list,
        };

        this.acsMarkingConfig.destination = this.stixService.determineAcs(
            acsObj,
            this.acsMarkingConfig.usage_permissions,
            this.acsMarkingConfig.further_sharing
        );
        this.updateDestination();
    }
}
