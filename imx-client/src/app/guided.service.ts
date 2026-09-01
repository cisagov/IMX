import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from './env-service/env.service';
import { FormModel } from './dynamic-form-component/form-model';
import { StixService } from './stix-service.service';
import { STIX_OBJECTS } from './models/stix-objects';
import { COMPONENT_MAP } from './models/component-map';
import { Artifact } from './models/artifact';
import { AttackPattern } from './models/attack-pattern';
import { Autonomous } from './models/autonomous';
import { Campaign } from './models/campaign';
import { Coa } from './models/coa';
import { Directory } from './models/directory';
import { DomainName } from './models/domain-name';
import { EmailAddress } from './models/email-address';
import { EmailMessage } from './models/email-message';
import { Grouping } from './models/grouping';
import { Identity } from './models/identity';
import { Incident } from './models/incident';
import { Indicator } from './models/indicator';
import { Infrastructure } from './models/infrastructure';
import { IntrusionSet } from './models/intrusion-set';
import { Ipv4Addr } from './models/ipv4';
import { Ipv6Addr } from './models/ipv6';
import { LanguageContent } from './models/language-content';
import { ExtensionDefinition } from './models/extension-definition';
import { MacAddress } from './models/mac-address';
import { Malware } from './models/malware';
import { MalwareAnalysis } from './models/malware-analysis';
import { MarkingDefinition } from './models/marking-definition';
import { Mutex } from './models/mutex';
import { NetworkTraffic } from './models/network-traffic';
import { Note } from './models/note';
import { ObservedData } from './models/observed-data';
import { Opinion } from './models/opinion';
import { Process } from './models/process';
import { Relationship } from './models/relationship';
import { Report } from './models/report';
import { Sighting } from './models/sighting';
import { Software } from './models/software';
import { ThreatActor } from './models/threat-actor';
import { Tool } from './models/tool';
import { Url } from './models/url';
import { UserAccount } from './models/user-account';
import { Vulnerability } from './models/vulnerability';
import { WindowsRegistryKey } from './models/windows-registry-key';
import { XCert } from './models/x-cert';
import { File } from './models/file';
import { Location } from './models/location';
import { Subject, BehaviorSubject } from 'rxjs';
import all_schemas from './bundle/schemas.json';
import * as moment from 'moment';
import { db } from './db.service';

@Injectable({
    providedIn: 'root',
})
export class GuidedService {
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

    gr = {
        // Guided Report
        gr_name: null,
        gr_report_type: null,
        gr_published: null,
        gr_description: null,
    };

    cart: any = {};
    cartLengths: any = {
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
    cartEditMode: boolean = false;
    editCartObject: any = {};
    editCart: any = {};

    currentCartIndex: number = null;
    cachedCart: any[] = [];

    cartDisabled$ = new BehaviorSubject<boolean>(true);
    newCartItem$ = new Subject<any>();
    editModeChange$ = new Subject<boolean>();
    syncCartTrigger$ = new Subject<void>();
    getEditItemTrigger$ = new Subject<any>();
    clearCartTrigger$ = new Subject<void>();
    addItemClicked$ = new Subject<boolean>();
    updateItemClicked$ = new Subject<any>();

    observablesToRemove: string[] = [];

    currentReport: any = {};

    simplifiedCart = {};
    categories = {
        REPORT: [],
        'WHAT (Impact)': [],
        'HOW (CWE)': [],
        'HOW (TTP)': [],
        'HOW (Query)': [],
        'HOW (Observable)': [],
        'HOW (Detection)': [],
        'WHERE (Location)': [],
        WHO: [],
    };

    filteredCategories = {
        REPORT: [],
        'WHAT (Impact)': [],
        'HOW (CWE)': [],
        'HOW (TTP)': [],
        'HOW (Query)': [],
        'HOW (Observable)': [],
        'HOW (Detection)': [],
        'WHERE (Location)': [],
        WHO: [],
    };

    identitySectors = [
        { key: 'agriculture', value: 'Agriculture' },
        { key: 'aerospace', value: 'Aerospace' },
        { key: 'automotive', value: 'Automotive' },
        { key: 'chemical', value: 'Chemical' },
        { key: 'commercial', value: 'Commercial' },
        { key: 'communications', value: 'Communications' },
        { key: 'construction', value: 'Construction' },
        { key: 'defense', value: 'Defense' },
        { key: 'education', value: 'Education' },
        { key: 'energy', value: 'Energy' },
        { key: 'entertainment', value: 'Entertainment' },
        { key: 'financial-services', value: 'Financial Services' },
        { key: 'government', value: 'Government' },
        { key: 'emergency-services', value: 'Emergency Services' },
        { key: 'government-local', value: 'Government Local' },
        { key: 'government-national', value: 'Government National' },
        { key: 'government-public-services', value: 'Government Public Services' },
        { key: 'government-regional', value: 'Government Regional' },
        { key: 'healthcare', value: 'Healthcare' },
        { key: 'hospitality-leisure', value: 'Hospitality Leisure' },
        { key: 'infrastructure', value: 'Infrastructure' },
        { key: 'dams', value: 'Dams' },
        { key: 'nuclear', value: 'Nuclear' },
        { key: 'water', value: 'Water' },
        { key: 'insurance', value: 'Insurance' },
        { key: 'legal', value: 'Legal' },
        { key: 'manufacturing', value: 'Manufacturing' },
        { key: 'mining', value: 'Mining' },
        { key: 'non-profit', value: 'Non-Profit' },
        { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
        { key: 'retail', value: 'Retail' },
        { key: 'technology', value: 'Technology' },
        { key: 'telecommunications', value: 'Telecommunications' },
        { key: 'transportation', value: 'Transportation' },
        { key: 'utilities', value: 'Utilities' },
    ];

    stixObjects = [];
    allIOCObjects = [];
    componentMap = COMPONENT_MAP;
    isGuidedReport = false;
    currentComponent = null;

    httpHeaders: HttpHeaders;
    httpHeadersJSON: HttpHeaders;
    httpHeadersJSONNoAuth: HttpHeaders;

    bundle: any = [];
    addedObjects = new Subject<any>();

    moment = moment;

    incidentCoreIncident = {};
    incidentCoreEvent = {};
    incidentCoreImpact = {};

    incidentCoreExtentionIncidentId = 'extension-definition--ef765651-680c-498d-9894-99799f2fa126';
    incidentCoreExtensionEventId = 'extension-definition--4ca6de00-5b0d-45ef-a1dc-ea7279ea910e';
    incidentCoreExtensionImpactId = 'extension-definition--7cc33dd6-f6a1-489b-98ea-522d351d71b9';

    attackers: string[] = [];

    eventDetails: any[] = [];

    locations: any[] = [];

    observablesWithAlignment = [];

    autoGenRelationships = false;

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private http: HttpClient
    ) {
        let tempCachedCart = localStorage.getItem('cached-cart');
        let tempCart = localStorage.getItem('guided-cart');
        let tempCartIndex = localStorage.getItem('cart-index');
        let tempEditCart = localStorage.getItem('edit-cart');

        if (tempEditCart) this.editCart = JSON.parse(tempEditCart);
        if (tempCachedCart) this.cachedCart = JSON.parse(tempCachedCart);
        if (tempCart) {
            this.cart = JSON.parse(tempCart);

            for (let page in this.cart) {
                if (page === 'relationships') continue;

                let count = 0;
                for (let type in this.cart[page]) {
                    count += this.cart[page][type].length;
                }
                this.cartLengths[page] = count;
                this.cartLengths['total'] += this.cartLengths[page];
            }
        }
        if (tempCartIndex !== null && tempCartIndex !== 'null') {
            this.currentCartIndex = Number(tempCartIndex);
        }

        this.stixObjects = [...STIX_OBJECTS];

        this.getAllIOCs();

        this.httpHeaders = new HttpHeaders()
            .set('Accept', '*/*')
            .set('Authorization', ``)
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`)
            .set('Content-Type', `application/taxii+json;version=2.1`);

        this.httpHeadersJSON = new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

        this.httpHeadersJSONNoAuth = new HttpHeaders().set('Accept', '*/*').set('Content-Type', `application/json`);

        this.componentMap.set('artifact', new Artifact(stixService));
        this.componentMap.set('attack-pattern', new AttackPattern(stixService));
        this.componentMap.set('autonomous-system', new Autonomous(stixService));
        this.componentMap.set('campaign', new Campaign(stixService));
        this.componentMap.set('course-of-action', new Coa(stixService));
        this.componentMap.set('directory', new Directory(stixService));
        this.componentMap.set('domain-name', new DomainName(stixService));
        this.componentMap.set('email-addr', new EmailAddress(stixService));
        this.componentMap.set('email-message', new EmailMessage(stixService));
        this.componentMap.set('file', new File(stixService));
        this.componentMap.set('grouping', new Grouping(stixService));
        this.componentMap.set('identity', new Identity(stixService));
        this.componentMap.set('incident', new Incident(stixService));
        this.componentMap.set('indicator', new Indicator(stixService));
        this.componentMap.set('infrastructure', new Infrastructure(stixService));
        this.componentMap.set('intrusion-set', new IntrusionSet(stixService));
        this.componentMap.set('ipv4-addr', new Ipv4Addr(stixService));
        this.componentMap.set('ipv6-addr', new Ipv6Addr(stixService));
        this.componentMap.set('location', new Location(stixService));
        this.componentMap.set('mac-addr', new MacAddress(stixService));
        this.componentMap.set('malware-analysis', new MalwareAnalysis(stixService));
        this.componentMap.set('malware', new Malware(stixService));
        this.componentMap.set('malware-analysis', new MalwareAnalysis(stixService));
        this.componentMap.set('marking-definition', new MarkingDefinition(stixService));
        this.componentMap.set('mutex', new Mutex(stixService));
        this.componentMap.set('network-traffic', new NetworkTraffic(stixService));
        this.componentMap.set('note', new Note(stixService));
        this.componentMap.set('observed-data', new ObservedData(stixService));
        this.componentMap.set('opinion', new Opinion(stixService));
        this.componentMap.set('process', new Process(stixService));
        this.componentMap.set('relationship', new Relationship(stixService));
        this.componentMap.set('report', new Report(stixService));
        this.componentMap.set('sighting', new Sighting(stixService));
        this.componentMap.set('software', new Software(stixService));
        this.componentMap.set('threat-actor', new ThreatActor(stixService));
        this.componentMap.set('tool', new Tool(stixService));
        this.componentMap.set('url', new Url(stixService));
        this.componentMap.set('user-account', new UserAccount(stixService));
        this.componentMap.set('vulnerability', new Vulnerability(stixService));
        this.componentMap.set('windows-registry-key', new WindowsRegistryKey(stixService));
        this.componentMap.set('x509-certificate', new XCert(stixService));
        this.componentMap.set('report', new Report(stixService));
        this.componentMap.set('language-content', new LanguageContent(stixService));
        this.componentMap.set('extension-definition', new ExtensionDefinition(stixService));
    }

    //CART Functions
    async syncCart(page, cart?) {
        if (cart) {
            this.cart[page] = cart;
        }
        this.cartLengths['total'] = 0;

        for (let page in this.cart) {
            if (page === 'relationships') continue;

            let count = 0;
            for (let type in this.cart[page]) {
                count += this.cart[page][type].length;
            }
            this.cartLengths[page] = count;
            this.cartLengths['total'] += this.cartLengths[page];
        }
        if (this.cart['Incident']) {
            this.cartLengths['how-event-detection']++;
        }

        return new Promise((resolve, reject) => {
            localStorage.setItem('guided-cart', JSON.stringify(this.cart));
            resolve('true');
        });
    }

    async cancelEditFromBundle() {
        this.cart = {};
        this.editCart = {};
        this.currentCartIndex = null;
        this.observablesToRemove = [];

        this.editCartObject = {};
        this.cartLengths = {
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

        this.cachedCart = JSON.parse(localStorage.getItem('cached-cart'));

        localStorage.setItem('guided-cart', JSON.stringify(this.cart));
        localStorage.setItem('cart-index', JSON.stringify(this.currentCartIndex));
        localStorage.setItem('edit-cart', JSON.stringify(this.editCart));
        await db.clearItemBeingEdited();
    }

    async editFromBundle() {
        let regTypes = [];
        let regData = [];

        // Determine the current report
        this.currentReport = this.cart['report-assessment']['report'][0];

        for (let page in this.editCart) {
            if (page === 'report-assessment') continue;

            for (let type in this.cart[page]) {
                for (let newObject of this.cart[page][type]) {

                    // Retrieve the old object id
                    const oldObjectRef = this.editCart[page][type].find(obj => obj.cartId === newObject.cartId);
                    const oldId = oldObjectRef ? oldObjectRef.id : null;
                    const oldObject = oldId ? this.getObjectInCart(page, type, oldId) : null;
                    const oldBundleObject = oldObject ? this.getStixFromBundle(oldObject) : null;

                    // CASE 1: New Object
                    if (!oldObject || !oldBundleObject) {
                        regTypes.push(type);
                        regData.push(this.cleanItem(newObject));
                        continue;
                    }

                    // CASE 2: Edit Object
                    const edited: any = this.cleanItem(newObject);

                    if(newObject.extensions){
                        edited.extensions = newObject.extensions;
                    }
                    delete edited.cartId;

                    const cleanedOld = this.cleanItem(oldBundleObject);
                    const cleanedNew = this.cleanItem(edited);
                    if(JSON.stringify(cleanedOld) === JSON.stringify(cleanedNew)) continue;

                    // Remove Stale Extension Container
                    if(!edited.extensions && oldBundleObject.extensions) {
                        delete oldBundleObject.extensions;
                    }

                    // Apply edited fields onto bundle object
                    for(let field in edited) {
                        if(field === 'extensions'){
                            oldBundleObject.extensions = edited.extensions;
                            continue;
                        }
                        oldBundleObject[field] = edited[field];
                    }

                    // Detect ID Change
                    const idChanged = oldObject.id !== edited.id;
                    if(idChanged) {
                        // Clean up transitive references
                        const transitiveRefs = this.stixService.findAllTransitiveReferences(oldObject.id);
                        for(const refObj of transitiveRefs) {
                            this.replaceIdInObject(refObj, oldObject.id, edited.id);
                            await this.stixService.addComponent(refObj);
                        }
                        await this.stixService.removeComponent(oldObject.id);
                    }

                    // Update bundle object ID
                    oldBundleObject.id = edited.id;
                    newObject.id = edited.id;

                    // Insert edited object into bundle
                    await this.stixService.addComponent(oldBundleObject);

                    // Sync Cart with updated bundle object
                    const cleaned:any = this.cleanItem(oldBundleObject);

                    // Overwrite the cart entry that corresponds to this edit
                    this.cart[page][type] = this.cart[page][type].map(obj =>
                        obj.cartId === newObject.cartId ? {...cleaned, cartId: obj.cartId } : obj
                    );

                    if(this.simplifiedCart[type]){
                        this.simplifiedCart[type] = this.simplifiedCart[type].map(obj =>
                            obj.cartId === newObject.cartId ? {...cleaned, cartId: obj.cartId } : obj
                        );
                    }
                }
            }
        }

        await this.addComponents(regTypes, regData);

        if (this.editCart['Incident'] || this.editCart['what-impact']) await this.updateIncident();

        // Rebuild report ONLY if user edited the report itself
        const editingReport = this.editCart['report-assessment'] && this.editCart['report-assessment']['report'];

        if(editingReport) {
            this.cart['report-assessment']['report'] = [this.currentReport];

            let tempReport = {};
            for (let field in this.currentReport) {
                if (field === 'cartId') continue;
                if (this.currentReport[field] === null) continue;

                tempReport[field] = this.currentReport[field];
            }

            await this.reconstructRelationships();
            await this.addComponents(['report'], [tempReport]);
        }

        // Remove observables queued for deletion
        for (const observable of this.observablesToRemove) {
            await this.stixService.removeComponent(observable);
        }

        const cached = JSON.parse(localStorage.getItem('cached-cart') || '[]');
        const reportId = this.currentReport?.id;

        const merged = cached.map(entry => {
            const entryReportId = entry?.['report-assessment']?.['report']?.[0]?.id;
            return entryReportId === reportId ? this.cart : entry;
        });

        localStorage.setItem('cached-cart', JSON.stringify(merged));
        await this.organizeCategoriesAsync();

        this.cancelEditFromBundle();
    }

    replaceIdInObject(obj: any, oldId: string, newId: string) {
        const escapedOldId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOldId, 'g');

        const updated = JSON.parse(JSON.stringify(obj).replace(regex, newId));
        Object.assign(obj, updated);
    }

    async reconstructRelationships() {
        if (this.cart['relationships'] && this.cart['relationships']['relationships']) {
            this.cart['relationships']['relationships'] = this.cart['relationships']['relationships'].filter(
                (rel) => !this.currentReport.object_refs.some((id) => id.startsWith('rel') && rel.id === id)
            );
        }

        for (let j = 0; j < this.currentReport.object_refs.length; j++) {
            if (this.currentReport.object_refs[j].startsWith('relationship') || this.currentReport.object_refs[j].startsWith('note')) {
                this.stixService.removeComponent(this.currentReport.object_refs[j]);
                this.currentReport.object_refs.splice(j, 1);
                j--;
            }
        }

        let cwes = [];
        const relationshipsToBuild = [];

        // mapping observables -> ttp & indicators -> ttp
        let ttps = [];
        if (this.cart['how-ttp'] && this.cart['how-ttp']['Attack Pattern']) {
            ttps = this.cart['how-ttp']['Attack Pattern'];
        }

        if (this.cart['how-cwe'] && this.cart['how-cwe']['Vulnerability']) {
            cwes = this.cart['how-cwe']['Vulnerability'];
        }

        let obs = [];
        if (this.cart['how-observable'] && this.cart['how-observable']['Observed Data']) {
            obs = this.cart['how-observable']['Observed Data'];
        }
        if (this.cart['how-pattern-builder'] && this.cart['how-pattern-builder']['Observed Data']) {
            obs = obs.concat(this.cart['how-pattern-builder']['Observed Data']);
        }

        const ttpObsMap = ttps.reduce((m, obj) => {
            m[obj.id] = obj['sco_ttp'];
            return m;
        }, {});

        const ttpIndMap = ttps.reduce((m, obj) => {
            m[obj.id] = obj['ind_ttp'];
            return m;
        }, {});

        const cweTtpMap = cwes.reduce((m, obj) => {
            m[obj.id] = obj.ttp;
            return m;
        }, {});

        const obsMap = obs.reduce((m, obj) => {
            m[obj.id] = obj['object_refs'];
            return m;
        }, {});

        let locs = [];
        if (this.cart['where-location'] && this.cart['where-location']['Location']) {
            locs = this.cart['where-location']['Location'];
        }

        const locIdMap = locs.reduce((m, obj) => {
            if (obj['id_loc']) m[obj.id] = obj['id_loc'];
            return m;
        }, {});

        const locTaMap = locs.reduce((m, obj) => {
            if (obj['ta_loc']) m[obj.id] = obj['ta_loc'];
            return m;
        }, {});

        for (let page in this.cart) {
            for (let type in this.cart[page]) {
                for (let item of this.cart[page][type]) {
                    switch (item.type) {
                        default:
                            if (page === 'how-observable' && item) {
                                if (item.alignment === 'Benign') {
                                    const note = {
                                        content: 'Benign',
                                        object_refs: [item.id],
                                        relationshipsToBuild: { type: 'related-to', description: 'Benign', id: item.id },
                                    };
                                    relationshipsToBuild.push(note.relationshipsToBuild);
                                    await this.addComponents(['note'], [note]);
                                } else if (item.alignment === 'Target') {
                                    relationshipsToBuild.push({
                                        type: 'related-to',
                                        description: item.alignment,
                                        id: item.id,
                                        targetId: item.target,
                                    });
                                } else if (item.alignment === 'Attacker') {
                                    relationshipsToBuild.push({
                                        type: 'related-to',
                                        description: item.alignment,
                                        id: item.id,
                                        targetId: item.attacker,
                                    });
                                }
                            }
                    }
                }
            }
        }

        // auto-generate ttp -> cwe relationship
        await this.setupRelationships(cweTtpMap, ttpObsMap, ttpIndMap, locIdMap, locTaMap, obsMap, relationshipsToBuild);

        return new Promise((resolve, reject) => {
            resolve('true');
        });
    }

    getObjectInCart(page, type, id) {
        if (!this.editCart[page][type]) return null;

        for (let object of this.editCart[page][type]) {
            if (object.id === id) {
                return object;
            }
        }

        return null;
    }

    getStixFromBundle(oldObject) {
        switch (oldObject.type) {
            case 'event':
            case 'impact':
                for (let object of this.stixService.customObjects) {
                    if (object.id === oldObject.id) {
                        return object;
                    }
                }
                break;
            default:
                for (let object of this.stixService.bundle.objects) {
                    if (object.id === oldObject.id) {
                        return object;
                    }
                }
        }

        return null;
    }

    addAttacker(attacker) {
        if (!this.attackers.includes(attacker)) {
            this.attackers.push(attacker);
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

    addComponents(types = [], data = []) {
        return new Promise(async (resolve, reject) => {
            for (let typeIndex = 0; typeIndex < types.length; typeIndex++) {
                let type = types[typeIndex];

                let date = new Date();
                let millSec = date.getMilliseconds();
                date.setMilliseconds(millSec + typeIndex * 10);

                let currentComponent: any = {};
                currentComponent['type'] = type;

                // Only add created/modified for NON‑SCO objects
                if (!all_schemas.SCOs.includes(type)) {
                    currentComponent['created_by_ref'] = this.envService.env.defaultIdentity.id;
                    currentComponent['created'] = date.toISOString();
                    currentComponent['modified'] = date.toISOString();
                }

                currentComponent['spec_version'] = '2.1';

                const keys = Object.keys(data[typeIndex]);
                for (let k of keys) {
                    if (
                        !k.includes('gr_') &&
                        data[typeIndex][k] != null &&
                        (!isNaN(data[typeIndex][k]) || data[typeIndex][k].length > 0 || typeof data[typeIndex][k] === 'object')
                    ) {
                        currentComponent[k] = data[typeIndex][k];
                    } else {
                        currentComponent[k] = null;
                    }
                }

                let cartId = currentComponent.cartId;
                delete currentComponent.cartId;

                if (currentComponent.display_name) delete currentComponent.display_name;

                if (!currentComponent.id) {
                    currentComponent.id = currentComponent.type + '--' + this.stixService.getUUIDFrIdContributingProperties(currentComponent);
                    data[typeIndex].id = currentComponent.id;
                    if (cartId) {
                        this.updateCurrentCartItem(currentComponent, cartId);
                    }
                    if (currentComponent.type === 'note' && currentComponent.relationshipsToBuild) {
                        currentComponent.relationshipsToBuild.targetId = currentComponent.id;
                        delete currentComponent.relationshipsToBuild;
                    }
                }
                if (currentComponent.type !== 'report') this.currentReport.object_refs.push(currentComponent.id);
                currentComponent = this.cleanObject(currentComponent);
                await this.stixService.addComponent(Object.assign({}, currentComponent as FormModel));
            }
            resolve('true');
        });
    }

    updateCurrentCartItem(currentComponent, cartId) {
        for (let page in this.cart) {
            for (let type in this.cart[page]) {
                if (this.cart[page][type][0].type === currentComponent.type) {
                    for (let i in this.cart[page][type]) {
                        let item = this.cart[page][type][i];
                        if (item.cartId === cartId) {
                            this.cart[page][type][i]['id'] = currentComponent.id;
                            return;
                        }
                    }
                }
            }
        }
    }

    async addCartToBundle() {
        let types = [];
        let items = [];
        let cwes = [];

        // mapping observables -> ttp & indicators -> ttp
        let ttps = [];
        if (this.cart['how-ttp'] && this.cart['how-ttp']['Attack Pattern']) {
            ttps = this.cart['how-ttp']['Attack Pattern'];
        }

        let obs = [];
        if (this.cart['how-observable'] && this.cart['how-observable']['Observed Data']) {
            obs = this.cart['how-observable']['Observed Data'];
        }
        if (this.cart['how-pattern-builder'] && this.cart['how-pattern-builder']['Observed Data']) {
            obs = obs.concat(this.cart['how-pattern-builder']['Observed Data']);
        }

        const relationshipsToBuild = [];

        const ttpObsMap = ttps.reduce((m, obj) => {
            m[obj.id] = obj['sco_ttp'];
            return m;
        }, {});

        const ttpIndMap = ttps.reduce((m, obj) => {
            m[obj.id] = obj['ind_ttp'];
            return m;
        }, {});

        const obsMap = obs.reduce((m, obj) => {
            m[obj.id] = obj['object_refs'];
            return m;
        }, {});

        if (this.cart['how-cwe'] && this.cart['how-cwe']['Vulnerability']) {
            cwes = this.cart['how-cwe']['Vulnerability'];
        }

        const cweTtpMap = cwes.reduce((m, obj) => {
            m[obj.id] = obj.ttp;
            return m;
        }, {});

        let locs = [];
        if (this.cart['where-location'] && this.cart['where-location']['Location']) {
            locs = this.cart['where-location']['Location'];
        }

        const locIdMap = locs.reduce((m, obj) => {
            if (obj['id_loc']) m[obj.id] = obj['id_loc'];
            return m;
        }, {});

        const locTaMap = locs.reduce((m, obj) => {
            if (obj['ta_loc']) m[obj.id] = obj['ta_loc'];
            return m;
        }, {});

        for (let page in this.cart) {
            for (let type in this.cart[page]) {
                for (let item of this.cart[page][type]) {
                    switch (item.type) {
                        case 'incident':
                            types.push('incident');

                            let tempItem = {
                                name: item.name,
                                extensions: item.extensions,
                                cartId: item.cartId,
                                id: item.id,
                            };

                            items.push(tempItem);
                            break;
                        default:
                            if (page === 'how-observable' && item) {
                                if (item.alignment === 'Benign') {
                                    const note = {
                                        content: 'Benign',
                                        object_refs: [item.id],
                                        relationshipsToBuild: { type: 'related-to', description: 'Benign', id: item.id },
                                    };
                                    relationshipsToBuild.push(note.relationshipsToBuild);
                                    types.push('note');
                                    items.push(note);
                                } else if (item.alignment === 'Target') {
                                    relationshipsToBuild.push({
                                        type: 'related-to',
                                        description: item.alignment,
                                        id: item.id,
                                        targetId: item.target,
                                    });
                                } else if (item.alignment === 'Attacker') {
                                    relationshipsToBuild.push({
                                        type: 'related-to',
                                        description: item.alignment,
                                        id: item.id,
                                        targetId: item.attacker,
                                    });
                                }

                                if (item.is_family === 'true') {
                                    item.is_family = true;
                                } else if (item.is_family === 'false') {
                                    item.is_family = false;
                                }
                            } else if (page == '') {
                            }
                            types.push(item.type);

                            items.push(this.cleanItem(item));
                    }
                }
            }
        }

        let addComponentsSuccessful = await this.addComponents(types, items);

        let incidentResult = await this.updateIncident();

        // auto-generate ttp -> cwe relationship
        await this.setupRelationships(cweTtpMap, ttpObsMap, ttpIndMap, locIdMap, locTaMap, obsMap, relationshipsToBuild);

        await this.createReportObject();

        await this.finishedGuidedReport();
    }

    async setupRelationships(cweTtpMap, ttpObsMap, ttpIndMap, locIdMap, locTaMap, obsMap, relationshipsToBuild) {
        let relationship_types = [];
        let source_refs = [];
        let target_refs = [];
        let descriptions = [];

        for (let ttp in ttpObsMap) {
            let target = this.stixService.bundle.objects.find((obj) => obj.type === 'attack-pattern' && obj.id === ttp);
            let targetId = target['id'];
            let obs = ttpObsMap[ttp];
            for (let sourceId of obs) {
                relationship_types.push('related-to');
                source_refs.push(sourceId);
                target_refs.push(targetId);
                descriptions.push(null);
            }
        }

        for (let ttp in ttpIndMap) {
            let target = this.stixService.bundle.objects.find((obj) => obj.type === 'attack-pattern' && obj.id === ttp);
            let targetId = target['id'];
            let inds = ttpIndMap[ttp];
            for (let sourceId of inds) {
                relationship_types.push('indicates');
                source_refs.push(sourceId);
                target_refs.push(targetId);
                descriptions.push(null);
            }
        }

        for (let cwe in cweTtpMap) {
            let ttp = cweTtpMap[cwe];
            if (ttp) {
                let target = this.findObjectInBundle('vulnerability', cwe);
                let targetId = target['id'];
                let source = this.findObjectInBundle('attack-pattern', ttp);
                let sourceId = source['id'];
                relationship_types.push('targets');
                source_refs.push(sourceId);
                target_refs.push(targetId);
                descriptions.push(null);
            }
        }

        for (let loc in locIdMap) {
            relationship_types.push('located-at');
            source_refs.push(locIdMap[loc]);
            target_refs.push(loc);
        }

        for (let loc in locTaMap) {
            relationship_types.push('located-at');
            source_refs.push(locTaMap[loc]);
            target_refs.push(loc);
        }

        for (let obs in obsMap) {
            let target = this.stixService.bundle.objects.find((obj) => obj.type === 'observed-data' && obj.id === obs);
            let targetId = target['id'];
            let ind = obsMap[obs];
            for (let sourceId of ind) {
                relationship_types.push('related-to');
                source_refs.push(sourceId);
                target_refs.push(targetId);
                descriptions.push(null);
            }
        }

        for (let relationship of relationshipsToBuild) {
            relationship_types.push(relationship.type);
            source_refs.push(relationship.id);
            target_refs.push(relationship.targetId);
            descriptions.push(relationship.description);
        }

        await this.createRelationshipObjects(relationship_types, source_refs, target_refs, descriptions);

        return new Promise((resolve, reject) => {
            resolve('true');
        });
    }

    async createReportObject() {
        this.currentReport['cartId'] = -2;
        this.currentReport['display_name'] = this.currentReport.name;

        this.cart['report-assessment'] = {
            report: [this.currentReport],
        };

        await this.addComponents(['report'], [this.currentReport]);
    }

    findObjectInBundle(type, id) {
        for (let object of this.stixService.bundle.objects) {
            if (object.type === type && object.id === id) {
                return object;
            }
        }
    }

    async updateIncident() {
        let incidentObject: any = this.getIncidentObject();

        return new Promise(async (resolve, reject) => {
            if (incidentObject === false) resolve('false');

            let eventObjects: any = this.getEventObjects();
            let impactObjects: any = this.getImpactObjects();

            if (eventObjects.length !== 0) {
                incidentObject.extensions[this.incidentCoreExtentionIncidentId]['events'] = [];

                for (let object of eventObjects) {
                    let tempEventRef = {
                        event_ref: object.id,
                    };

                    incidentObject.extensions[this.incidentCoreExtentionIncidentId]['events'].push(tempEventRef);
                }
            }

            if (impactObjects.length !== 0) {
                incidentObject.extensions[this.incidentCoreExtentionIncidentId]['impact_refs'] = [];

                for (let object of impactObjects) {
                    incidentObject.extensions[this.incidentCoreExtentionIncidentId]['impact_refs'].push(object.id);
                }
            }

            if (incidentObject !== false) {
                await this.stixService.addComponent(incidentObject);
                incidentObject.cartId = -1;
                this.cart['Incident']['Incident'][0] = incidentObject;
            }

            resolve('true');
        });
    }

    getIncidentObject() {
        if (!this.cart['Incident']) return false;

        let incidentId = this.cart['Incident']['Incident'][0].id;
        for (let object of this.stixService.bundle.objects) {
            if (object.id === incidentId) {
                return object;
            }
        }

        return false;
    }

    getEventObjects() {
        let result = [];
        if (!this.cart['how-event-detection']) return result;

        for (let object of this.cart['how-event-detection']['Event']) {
            if (object.type === 'event') {
                result.push(object);
            }
        }

        return result;
    }

    getImpactObjects() {
        let result = [];
        if (!this.cart['what-impact']) return result;

        for (let object of this.cart['what-impact']['Impact']) {
            if (object.type === 'impact') {
                result.push(object);
            }
        }

        return result;
    }

    cleanItem(item) {
        let tempItem = {};

        for (let field in item) {
            tempItem[field] = item[field];

            switch (field) {
                case 'firstObservedTimeZone':
                case 'lastObservedTimeZone':
                    break;
                case 'linkId':
                case 'display_name':
                case 'sco_ttp':
                case 'ind_ttp':
                case 'ttp':
                case 'id_loc':
                case 'ta_loc':
                case 'alignment':
                case 'attacker':
                case 'target':
                    delete tempItem[field];
                    break;
                case 'sectors':
                    if (item[field][0] === null) {
                        delete tempItem[field];
                    }

                    break;
                case 'first_observed':
                    let firstObserved = new Date(item[field]);
                    if (item['firstObservedTimeZone']) {
                        tempItem[field] = this.convertTimeToTzUtc(firstObserved, item['firstObservedTimeZone']);
                        delete tempItem['firstObservedTimeZone'];
                        break;
                    }
                    tempItem[field] = this.convertTimeToTzUtc(firstObserved, item['timeZone']);
                    break;
                case 'last_observed':
                    let lastObserved = new Date(item[field]);
                    if (item['lastObservedTimeZone']) {
                        tempItem[field] = this.convertTimeToTzUtc(lastObserved, item['lastObservedTimeZone']);
                        delete tempItem['lastObservedTimeZone'];
                        break;
                    }
                    tempItem[field] = this.convertTimeToTzUtc(lastObserved, item['timeZone']);
                    break;
                case 'valid_from':
                    let date = new Date(item[field]);
                    tempItem[field] = this.convertTimeToTzUtc(date, item['timeZone']);
                    break;
                default:
                    if (item[field] === null || item[field] === '') {
                        delete tempItem[field];
                    }
            }
        }

        if (item['timeZone']) {
            delete tempItem['timeZone'];
        }

        return tempItem;
    }

    async finishedGuidedReport() {
        if (this.currentCartIndex === null) {
            this.cachedCart.push(this.cart);
        } else {
            this.cachedCart[this.currentCartIndex] = this.cart;
        }
        localStorage.setItem('cached-cart', JSON.stringify(this.cachedCart));

        this.currentReport = {};

        this.cart = {};

        this.cartLengths = {
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

        localStorage.setItem('guided-cart', JSON.stringify(this.cart));
    }

    addEventMethod(types = [], data = []) {
        for (let i in data) {
            this.eventDetails.push(data[i]);
        }
    }

    cleanObject(myobject: any) {
        for (let x in myobject) {
            if (x == 'hashes') {
                if (Object.keys(myobject[x]).length == 0) {
                    delete myobject[x];
                }
            } else if (x == 'values' || x == 'body_multipart') {
                if (this.stixService.modalObjectArray.length > 0) {
                    myobject[x] = this.stixService.modalObjectArray;
                } else if (!myobject[x] || myobject[x].length == 0) {
                    delete myobject[x];
                }
            } else if (x == 'contents') {
                if (this.stixService.modalObjectArray.length == 0) {
                    delete myobject[x];
                } else {
                    const contentObject = this.stixService.convertLanguageContentsToObject(this.stixService.modalObjectArray);
                    myobject[x] = contentObject;
                }
            } else if (x == 'revoked') {
                if (myobject[x] === '' || myobject[x] === null) {
                    delete myobject[x];
                }
            } else if (x == 'defanged') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_service_account') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_privileged') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_disabled') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'can_escalate_privs') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_family') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_active') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_hidden') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'summary') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'loaded') {
                delete myobject[x];
            } else if (x == 'is_multipart') {
                if (myobject[x] === '') {
                    delete myobject[x];
                } else if (typeof myobject[x] === 'string') {
                    myobject[x] = JSON.parse(myobject[x]);
                }
            } else if (x == 'is_service_account') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_privileged') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'can_escalate_privs') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if (x == 'is_disableds') {
                if (myobject[x] === '') {
                    delete myobject[x];
                }
            } else if ((x == 'same' || x == 'last_source_target') && myobject instanceof Relationship) {
                delete myobject[x];
            } else if (myobject[x] != undefined && typeof myobject[x] == 'boolean') {
            } else if (myobject[x] instanceof Array && myobject[x].length == 0) {
                delete myobject[x];
            } else if (myobject[x] === '') {
                delete myobject[x];
            } else if (myobject[x] instanceof StixService) {
                delete myobject[x];
            } else if (myobject[x] == undefined) {
                delete myobject[x];
            } else if (myobject[x] == null) {
                delete myobject[x];
            } else if (myobject[x].size == 0) {
                delete myobject[x];
            } else if (
                typeof myobject[x] != 'string' &&
                typeof myobject[x] != 'number' &&
                typeof myobject[x] != 'boolean' &&
                Object.prototype.toString.call(myobject[x]) !== '[object Date]'
            ) {
                console.info(x);
                let empty = true;
                for (let i in myobject[x]) {
                    empty = false;
                }

                if (empty) delete myobject[x];
            }
        }
        return myobject;
    }

    async createRelationships(type, sourceInputs = null, targetInputs = null, description = []) {
        let sourceIsId = false;
        let targetIsId = false;
        const regexExp = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i; // dont' use /g since it moves lastIndex
        sourceIsId = regexExp.test(sourceInputs);
        targetIsId = regexExp.test(targetInputs);

        if (sourceIsId && !targetIsId && (typeof targetInputs === 'string' || targetInputs instanceof String)) {
            this.findPreviouslyAddedObjects(targetInputs, 'source-is-id');
            this.addedObjects.subscribe((data) => {
                if (data.eventType === 'source-is-id' && data.objects && data.objects.length > 0) {
                    let relationshipTypes = [];
                    let sources = [];

                    const objectIds = data.objects.map((o) => o.id);
                    objectIds.forEach((id) => {
                        relationshipTypes = relationshipTypes.concat(type);
                        sources = sources.concat(sourceInputs);
                    });

                    this.createRelationshipObjects(relationshipTypes, sources, objectIds, description);
                }
            });
            return;
        }

        if (!sourceIsId && targetIsId && (typeof sourceInputs === 'string' || sourceInputs instanceof String)) {
            this.findPreviouslyAddedObjects(sourceInputs, 'target-is-id');
            this.addedObjects.subscribe((data) => {
                if (data.eventType === 'target-is-id' && data.objects && data.objects.length > 0) {
                    let relationshipTypes = [];
                    let targets = [];

                    const objectIds = data.objects.map((o) => o.id);
                    objectIds.forEach((id) => {
                        relationshipTypes = relationshipTypes.concat(type);
                        targets = targets.concat(targetInputs);
                    });

                    this.createRelationshipObjects(relationshipTypes, objectIds, targets, description);
                }
            });
        }

        if (sourceIsId && targetIsId) {
            let relationshipTypes = [];
            let targets = [];
            let sources = [];

            relationshipTypes = relationshipTypes.concat(type);
            targets = targets.concat(targetInputs);
            sources = sources.concat(sourceInputs);

            this.createRelationshipObjects(relationshipTypes, sources, targets, description);
        }
    }

    async createRelationshipObjects(types = [], sources = [], targets = [], description = []) {
        const typeLength = types.length;
        const sourceLength = sources.length;
        const targetLength = targets.length;

        return new Promise(async (resolve, reject) => {
            if (typeLength !== sourceLength || sourceLength !== targetLength || typeLength !== targetLength) {
                resolve('true');
            }
            for (let typeIndex = 0; typeIndex < types.length; typeIndex++) {
                let type = types[typeIndex];
                let data: any[] = [
                    {
                        type: 'relationship',
                        relationship_type: type,
                        source_ref: sources[typeIndex],
                        target_ref: targets[typeIndex],
                    },
                ];

                if (description[typeIndex]) data[0].description = description[typeIndex];

                await this.addComponents(['relationship'], data);
                if (this.cart['relationships']) {
                    this.cart['relationships']['relationships'].push(data[0]);
                } else {
                    this.cart['relationships'] = {
                        relationships: [data[0]],
                    };
                }
            }

            resolve('true');
        });
    }

    findPreviouslyAddedObjects(objectType, eventType) {
        this.stixService.db.imxCache.toArray().then(async (results) => {
            let addedObjects: any = [];
            let objects: any = [];

            this.bundle = [...results.map((r) => r.object)];
            addedObjects = this.bundle.filter((o) => o.type === objectType);

            if (addedObjects && addedObjects.length > 0) {
                let closestTime: any = new Date(Math.max(...addedObjects.map((e) => new Date(e.created)))).toISOString();
                addedObjects.forEach((o: any) => {
                    const t1: any = new Date(o.created);
                    const t2: any = new Date(closestTime);
                    if (o.created === closestTime || Math.abs(t1 - t2) < 500) {
                        objects.push(o);
                    }
                });
            }

            let data = {
                objects,
                eventType,
            };

            this.addedObjects.next(data);
        });
    }

    convertTimeToTzUtc(time: Date, timezone) {
        let year = time.getFullYear();
        let month = ('0' + (time.getMonth() + 1)).slice(-2);
        let date = ('0' + time.getDate()).slice(-2);
        let hours = ('0' + time.getHours()).slice(-2);
        let minutes = ('0' + time.getMinutes()).slice(-2);
        let timeFormatted = `${year}-${month}-${date} ${hours}:${minutes}`;
        let timeInTz = moment.tz(timeFormatted, timezone).format('YYYY-MM-DD HH:mm');
        let timeInTzUtc = moment.tz(timeInTz, timezone).utc().format();

        return timeInTzUtc;
    }

    showTimezoneAndOffset(timezone) {
        return `${timezone} - (GMT${moment.tz(timezone).format('Z')})`;
    }

    async validateCveId(cveId = ''): Promise<any> {
        let url = 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=' + cveId;
        return new Promise(async (resolve, reject) => {
            this.http.get(url).subscribe(
                (data) => resolve(data),
                (error) => resolve(error)
            );
        });
    }

    autoGenerateNameFromPage(pageName) {
        if (pageName) {
            let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let time = new Date();

            return `${pageName}-name-generated-${this.convertTimeToTzUtc(time, timezone)}`;
        }
        return pageName;
    }

    disableName(name) {
        if (name && name.includes('generated')) {
            return true;
        }
        return false;
    }

    getTipByLabel(label = '') {
        let tooltip = '';
        switch (label) {
            case 'individual_target': {
                tooltip = 'The name of the targeted individual. If the target is an enterprise or organization, toggle to "Organization".';
                break;
            }
            case 'individual_phone': {
                tooltip = 'The phone number for this individual.';
                break;
            }
            case 'individual_email': {
                tooltip = 'The e-mail for this individual.';
                break;
            }
            case 'organiztion_target': {
                tooltip =
                    'The name, e-mail, phone number of the targeted organization. If the target is an individual, toggle to "Individual". Use the following format, line delimited: "name, phone, email"';
                break;
            }
            case 'sectors': {
                tooltip = 'The list of industry sectors that this targeted organization belongs to.';
                break;
            }
            case 'attacker_name': {
                tooltip = 'The name of the individual or organization that initiated the attack.';
                break;
            }
            case 'attacker_motivation': {
                tooltip = "Select attacker's motivation from the dropdown list on the right.";
                break;
            }
            case 'incident_name': {
                tooltip = "Enter a label or designation. If you don't have one, it will be autogenerated for you.";
                break;
            }
            case 'determination': {
                tooltip =
                    'For the determination, select whether the cyber threat event was a failed attempt, blocked, confirmed, a false positive, or just suspected.';
                break;
            }
            case 'investigation_status': {
                tooltip = 'Is this attack being investigated? If so, what is the status of the investigation?';
                break;
            }
            case 'detection_methods': {
                tooltip = 'Select how the attack was detected using the list menu.';
                break;
            }
            case 'event_details': {
                tooltip = 'Please provide contextual information in the description if you have it.';
                break;
            }
            case 'string_label': {
                tooltip =
                    'A name used to identify the Indicator. Producers SHOULD provide this property to help products and analysts understand what this Indicator actually does.';
                break;
            }
            case 'pattern_type': {
                tooltip = 'The pattern language used in this indicator.';
                break;
            }
            case 'time_zone_1': {
                tooltip = 'The time zone for the time of valid_from property.';
                break;
            }
            case 'valid_from': {
                tooltip = 'The time from which this Indicator is considered a valid indicator of the behaviors it is related or represents.';
                break;
            }
            case 'pattern': {
                tooltip =
                    'The detection pattern for this Indicator MAY be expressed as a STIX Pattern as specified in section 9 or another appropriate language such as SNORT, YARA, etc.';
                break;
            }
            case 'time_zone_2': {
                tooltip = 'The time zone for the time of first_observed property.';
                break;
            }
            case 'first_observed': {
                tooltip = 'The beginning of the time window during which the data was seen.';
                break;
            }
            case 'last_observed': {
                tooltip =
                    'The end of the time window during which the data was seen. This MUST be greater than or equal to the timestamp in the first_observed property.';
                break;
            }
            case 'number_observed': {
                tooltip =
                    'The number of times that each Cyber-observable object represented in the objects or object_ref property was seen. If present, this MUST be an integer between 1 and 999,999,999 inclusive.';
                break;
            }
            case 'ttp_designation': {
                tooltip = "Enter a label or designation. If you don't have one, it will be autogenerated for you.";
                break;
            }
            case 'ttp_tactic': {
                tooltip =
                    "If you have a tactic, you may enter it here. You may also use CISA's Decider Tool to analyze adversary activity and help you arrive at the correct tactic.";
                break;
            }
            case 'ttp_technique': {
                tooltip =
                    "You may also use CISA's Decider Tool to analyze adversary activity and help you arrive at the correct technique, or sub-technique.";
                break;
            }
            case 'add_observables': {
                tooltip = 'You may now add observables that you have previously created and pair them with an Attack TTP.';
                break;
            }
            case 'detection_string': {
                tooltip = 'Choose a detection string to link to an Attack TTP.';
                break;
            }
            case 'target_region': {
                tooltip = 'The region that this targeted Location describes.';
                break;
            }
            case 'attacker_region': {
                tooltip = "The region that this attacker's Location describes.";
                break;
            }
            case 'target_country': {
                tooltip =
                    'The country that this targeted Location describes. This property SHOULD contain a valid ISO 3166-1 ALPHA-2 Code [ISO3166-1].';
                break;
            }
            case 'attacker_country': {
                tooltip =
                    "The country that this attacker's Location describes. This property SHOULD contain a valid ISO 3166-1 ALPHA-2 Code [ISO3166-1].";
                break;
            }
            case 'target_city': {
                tooltip = 'The city that this targeted Location describes.';
                break;
            }
            case 'attacker_city': {
                tooltip = "The city that this attacker's Location describes.";
                break;
            }
            case 'target_street_address': {
                tooltip =
                    'The street address that this targeted Location describes. This property includes all aspects or parts of the street address.';
                break;
            }
            case 'attacker_street_address': {
                tooltip =
                    "The street address that this attacker's Location describes. This property includes all aspects or parts of the street address.";
                break;
            }
            case 'target_postal_code': {
                tooltip = 'The postal code for this targeted Location.';
                break;
            }
            case 'attacker_postal_code': {
                tooltip = "The postal code for this attacker's Location.";
                break;
            }
            case 'target_latitude': {
                tooltip =
                    'The latitutde of the targeted Location in decimal degrees. The value of this property MUST be between -90.0 and 90.0, inclusive.';
                break;
            }
            case 'target_longitude': {
                tooltip =
                    'The longitude of the targeted location in decimal degrees. The value of this property MUST be between -180.0 and 180.0, inclusive.';
                break;
            }
            case 'attacker_latitude': {
                tooltip =
                    "The latitutde of the attacker's Location in decimal degrees. The value of this property MUST be between -90.0 and 90.0, inclusive.";
                break;
            }
            case 'attacker_longitude': {
                tooltip =
                    "The longitude of the attacker's location in decimal degrees. The value of this property MUST be between -180.0 and 180.0, inclusive.";
                break;
            }
            case 'target_admin_area': {
                tooltip =
                    'The state, province or other sub-national administrative area that this targeted Location describes. This property SHOULD contain a valid ISO 3166-2 Code.';
                break;
            }
            case 'attacker_admin_area': {
                tooltip =
                    "The state, province or other sub-national administrative area that this attacker's Location describes. This property SHOULD contain a valid ISO 3166-2 Code.";
                break;
            }
            case 'select_target': {
                tooltip = 'Select a target located at this Location.';
                break;
            }
            case 'select_attacker': {
                tooltip = 'Select an attacker located at this Location.';
                break;
            }
            case 'observable_relationship': {
                tooltip = 'Describe the relationship of this observable; is it relevant to the target or attacker:<br>';
                tooltip += `
          • <b>Target</b> = the observable was used to target the victim of the event.<br>
          • <b>Attacker</b> = the observable was used by a threat actor to target the victim.<br>
          • <b>Unknown</b> = the observable was used related to the event but cannot be related to the attacker or victim at this time.<br>
          • <b>Benign</b> = the observable is not related to either the attacker or the target.
          `;
                break;
            }
            case 'common_controls': {
                tooltip = 'Select any neglected controls that resulted in a weakness';
                break;
            }
            case 'common_weakness': {
                tooltip += `Select the exploitation caused by a known software weakness defined in CWE.`;
                break;
            }
            case 'common_vulnerability': {
                tooltip += 'Select the exploited vulnerability that can be referenced by its corresponding CVE.';
                break;
            }
            case 'recoverability': {
                tooltip = `
          • <b>Extended</b> = Recovery requires significant additional time, resources, or external support beyond normal capabilities.<br>
          • <b>Not Applicable</b> = Recoverability does not apply for this type of impact (e.g., no restoration is needed or the concept isn’t relevant).<br>
          • <b>Not Recoverable</b> = The impacted assets or functionality cannot be restored to their original state.<br>
          • <b>Regular</b> = Recovery can be achieved using standard processes, resources, and timelines.<br>
          • <b>Supplemented</b> = Recovery is possible but requires additional internal resources or special measures beyond normal procedures.
          `;
                break;
            }
            case 'impacted_refs': {
                tooltip = 'Select the STIX object you want to reference, then click the <b>+ Add</b> button to include it in the Impact.';
                break;
            }
            default: {
                tooltip = '';
            }
        }
        return tooltip;
    }

    getObjectTypeName(type: string): string {
        const abbreviations = { addr: 'Address', url: 'URL' };

        return type
            .split('-')
            .map((word) => {
                if (abbreviations[word]) return abbreviations[word];
                if (word.startsWith('ip')) return word.slice(0, 2).toUpperCase() + word.slice(2);
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    emptyDropdown(value) {
        return value === null || value === undefined || value === '';
    }

    applyNewYear(normalizedYear: Date, currentValue: any): Date | null {
        if (!currentValue) return null;
        const existing = new Date(currentValue);
        if (isNaN(existing.getTime())) return null;
        existing.setFullYear(normalizedYear.getFullYear());
        return existing;
    }

    organizeCart() {
        let cachedCarts: any = localStorage.getItem('cached-cart');

        this.simplifiedCart = {};

        if (cachedCarts) {
            cachedCarts = JSON.parse(cachedCarts);
            cachedCarts.forEach((cachedCart) => {
                for (let page in cachedCart) {
                    for (let type in cachedCart[page]) {
                        const stixObjects = [];
                        cachedCart[page][type].forEach((elem) => {
                            const foundObject = this.stixService.bundle.objects.find((obj) => elem.id == obj.id);
                            if (foundObject) stixObjects.push(foundObject);
                        });

                        if (this.simplifiedCart[type]) {
                            stixObjects.forEach((elem) => {
                                const foundIndex = this.simplifiedCart[type].find((obj) => obj.id == elem.id);
                                if (!foundIndex) this.simplifiedCart[type].push(elem);
                            });
                        } else {
                            this.simplifiedCart[type] = stixObjects;
                        }
                    }
                }
            });
        }

        return this.simplifiedCart;
    }

    getCategoryLength(type) {
        return `${this.categories[type].length}`;
    }

    organizeCategories() {
        const addedObjects = new Set();

        for (const category in this.categories) {
            this.categories[category] = [];

            switch (category) {
                case 'WHO':
                    if (this.simplifiedCart['Identity']) {
                        this.simplifiedCart['Identity']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                        // this.categories[category] = [...this.simplifiedCart['Identity']];
                    }
                    if (this.simplifiedCart['Threat Actor']) {
                        this.simplifiedCart['Threat Actor']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                        // this.categories[category] = [...this.categories[category], ...this.simplifiedCart['Threat Actor']];
                    }
                    break;
                case 'WHERE (Location)':
                    if (this.simplifiedCart['Location']) {
                        this.simplifiedCart['Location']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Location']];
                    break;
                case 'HOW (Detection)':
                    if (this.simplifiedCart['Event']) {
                        this.simplifiedCart['Event']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Event']];
                    if (this.simplifiedCart['Incident']) {
                        this.simplifiedCart['Incident']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.categories[category], ...this.simplifiedCart['Incident']];
                    break;
                case 'HOW (Observable)':
                    const observableTypes = [
                        'Artifact',
                        'Autonomous System',
                        'Directory',
                        'Domain Name',
                        'Email Address',
                        'Email Message',
                        'File',
                        'IPv4 Address',
                        'IPv6 Address',
                        'Mac Address',
                        'Malware',
                        'Malware Analysis',
                        'Mutex',
                        'Network Traffic',
                        'Process',
                        'Software',
                        'URL',
                        'User Account',
                        'Windows Registry Key',
                        'X509 Certificate',
                    ];

                    for (const type of observableTypes) {
                        if (this.simplifiedCart[type]) {
                            this.simplifiedCart[type]?.forEach((elem) => {
                                this.categories[category].push(elem);
                                addedObjects.add(elem.id);
                            });
                        }
                        // this.categories[category] = [...this.categories[category], ...this.simplifiedCart[type]];
                    }
                    break;
                case 'HOW (Query)':
                    if (this.simplifiedCart['Indicator']) {
                        this.simplifiedCart['Indicator']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Indicator']];
                    break;
                case 'HOW (TTP)':
                    if (this.simplifiedCart['Attack Pattern']) {
                        this.simplifiedCart['Attack Pattern']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Attack Pattern']];
                    break;
                case 'HOW (CWE)':
                    if (this.simplifiedCart['Vulnerability']) {
                        this.simplifiedCart['Vulnerability']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Vulnerability']];
                    break;
                case 'WHAT (Impact)':
                    if (this.simplifiedCart['Impact']) {
                        this.simplifiedCart['Impact']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['Impact']];
                    break;
                case 'REPORT':
                    if (this.simplifiedCart['report']) {
                        this.simplifiedCart['report']?.forEach((elem) => {
                            this.categories[category].push(elem);
                            addedObjects.add(elem.id);
                        });
                    }
                    // this.categories[category] = [...this.simplifiedCart['report']];
                    break;
            }

            this.filteredCategories[category] = [...this.categories[category]];
        }

        this.stixService.bundle.objects.forEach((elem) => {
            if (!addedObjects.has(elem.id)) {
                if (!this.categories['MISCELLANEOUS']) {
                    this.categories['MISCELLANEOUS'] = [];
                    this.filteredCategories['MISCELLANEOUS'] = [];
                }

                this.categories['MISCELLANEOUS'].push(elem);
                this.filteredCategories['MISCELLANEOUS'].push(elem);
            }
        });
    }

    getCategory(type) {
        return this.categories[type];
    }

    async organizeCategoriesAsync() {
        await Promise.resolve();
        this.organizeCart();
        this.organizeCategories();
        this.filteredCategories = { ...this.filteredCategories };
    }
}
