import { Component, Input, OnInit } from '@angular/core';
import { faAngleDoubleUp, faCaretDown, faDownload, faExternalLinkAlt, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from 'src/app/env-service/env.service';
import { MispService } from 'src/app/misp-service/misp.service';
import { Bundle } from 'src/app/models/bundle';
import { StixService } from 'src/app/stix-service.service';
import { v4 } from 'uuid';

@Component({
    selector: 'app-misp-result',
    templateUrl: './misp-result.component.html',
    styleUrls: ['./misp-result.component.css', '../misp-dialog.component.css'],
    standalone: false,
})
export class MispResultComponent implements OnInit {
    @Input() results: any[];

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

    eventToStixMap = new Map();

    faAngleDoubleUp = faAngleDoubleUp;
    faExternalLinkAlt = faExternalLinkAlt;
    faStop = faQuestionCircle;
    faDownload = faDownload;
    faCaretDown = faCaretDown;

    allSelected = false;
    allExpanded = false;

    constructor(
        public readonly mispService: MispService,
        public readonly stixService: StixService,
        public readonly envService: EnvService
    ) {}

    ngOnInit(): void {}

    toggleExpansion(result) {
        result.expanded = !result.expanded;
    }

    toggleChecked(event) {
        event.checked = !event.checked;
    }

    setTab(event, tab) {
        if (tab == 'stix') {
            this.setEventToStixMap(event);
        }

        event.tab = tab;
    }

    getThreatLevel(event) {
        const threat = ['High', 'Medium', 'Low', 'Undefined'];

        return event.threat_level_id ? threat[event.threat_level_id - 1] : 'Undefined';
    }

    getTags(event) {
        const clusters = new Set<number>();
        const tags = [];

        event.misp.Galaxy?.forEach((galaxy) => {
            galaxy.GalaxyCluster?.forEach((cluster) => {
                clusters.add(cluster.tag_id);
            });
        });

        event.misp.Tag?.forEach((tag) => {
            if (tag.name.startsWith('tlp:')) {
                this.determineTlp(tag);
            } else {
                tag.font = '#fff';
            }

            if (!clusters.has(Number(tag.id))) tags.push(tag);
        });

        return tags;
    }

    determineTlp(tag) {
        tag.colour = '#000000';

        switch (tag.name) {
            case 'tlp:green':
                tag.font = '#33FF00';
                break;
            case 'tlp:amber':
            case 'tlp:amber+strict':
                tag.font = '#FFC000';
                break;
            case 'tlp:red':
                tag.font = '#FF2B2B';
                break;
            case 'tlp:clear':
            case 'tlp:white':
            default:
                tag.font = '#fff';
                break;
        }
    }

    getTagCount(event) {
        let attributeCount = event.misp.Attribute?.length;
        event.misp.Object?.forEach((obj) => {
            if (obj.Attribute) {
                attributeCount += obj.Attribute.length;
            }
        });

        return attributeCount;
    }

    getObjectAttributes(event) {
        let attributes = [];
        event.misp.Object?.forEach((obj) => {
            if (obj.Attribute) {
                attributes = [...attributes, ...obj.Attribute];
            }
        });

        return attributes;
    }

    setEventToStixMap(event) {
        if (this.eventToStixMap.get(event.eventId)) return this.eventToStixMap.get(event.eventId);

        const stixObjects = {};

        const returnArr = [];
        const collapsedTypes = new Set();
        const collapsedObjects = new Set();

        event.stix.objects.forEach((obj) => {
            if (!stixObjects[obj.type]) {
                stixObjects[obj.type] = [];
            }

            stixObjects[obj.type].push(obj);
            collapsedObjects.add(obj.id);
        });

        for (const key in stixObjects) {
            returnArr.push({
                type: key,
                objects: stixObjects[key],
            });

            collapsedTypes.add(key);
        }

        const stix = {
            objects: returnArr,
            collapsedTypes: collapsedTypes,
            collapsedObjects: collapsedObjects,
        };

        this.eventToStixMap.set(event.eventId, stix);

        return stix;
    }

    selectAll(event, clickEvent) {
        if (clickEvent) {
            event.stix.objects.forEach((elem) => {
                const stixObj = event.checkedObjectsMap.get(elem.id);
                stixObj.checked = true;

                event.checkedObjectsMap.set(elem.id, stixObj);
            });
        }
    }

    toggleTypeCollapse(eventId, objCategory) {
        const event = this.eventToStixMap.get(eventId);

        if (event.collapsedTypes.has(objCategory.type)) {
            event.collapsedTypes.delete(objCategory.type);
        } else {
            event.collapsedTypes.add(objCategory.type);
        }
    }

    toggleObjectSelect(event, objId, clickEvent) {
        const stixObj = event.checkedObjectsMap.get(objId);
        stixObj.checked = clickEvent.target.checked;

        event.checkedObjectsMap.set(objId, stixObj);

        if (!clickEvent.target.checked) {
            event.selectAll = false;
        }
    }

    toggleObjectCollapse(eventId, objId) {
        const event = this.eventToStixMap.get(eventId);

        if (event.collapsedObjects.has(objId)) {
            event.collapsedObjects.delete(objId);
        } else {
            event.collapsedObjects.add(objId);
        }
    }

    capitalize(string: string) {
        const split = string.split('-');
        let str = '';

        for (const s of split) {
            if (str) str += '-';

            str += s.charAt(0).toUpperCase() + s.slice(1);
        }

        return str;
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
                default:
                    return component.name ? component.name : `<NO NAME> (${component.id})`;
            }

            return componentDisplay;
        } else return component.name ? component.name : '<NO NAME>';
    }

    returnJson(obj) {
        return JSON.stringify(obj, null, 2);
    }

    emitStix() {
        const objectsToImport = [];

        this.results.forEach((event) => {
            if (!event.checked) return;

            for (const [key, stixObj] of event.checkedObjectsMap) {
                if (stixObj.checked) objectsToImport.push(stixObj.object);
            }
        });

        return objectsToImport;
    }

    buildLink(type: 'event' | 'galaxy' | 'tag', id) {
        if (type == 'tag') {
            return `${this.envService.env.mispServer.url}events/index/searchtag:${id}`;
        }

        const view = type === 'event' ? 'events' : 'galaxy_clusters';
        return `${this.envService.env.mispServer.url}${view}/view/${id}`;
    }

    openWindow(type: 'event' | 'galaxy' | 'tag', id) {
        window.open(this.buildLink(type, id), '_blank');
    }

    downloadMisp(event) {
        this.downloadFiles(
            [
                {
                    name: `${event.searchall}-misp.json`,
                    data: JSON.stringify({
                        Event: event.misp,
                    }),
                },
            ],
            event.searchall
        );
    }

    downloadStix(event) {
        const objectsToDownload = [];

        event.stix.objects.forEach((elem) => {
            const stixObj = event.checkedObjectsMap.get(elem.id);
            if (stixObj.checked) objectsToDownload.push(elem);
        });

        const bundle = new Bundle(objectsToDownload);
        bundle.id = `bundle--${v4()}`;

        this.downloadFiles(
            [
                {
                    name: `${event.searchall}-stix.json`,
                    data: JSON.stringify(bundle),
                },
            ],
            event.searchall
        );
    }

    async downloadFiles(files, name) {
        files.forEach((file) => {
            const blob = new Blob([file.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            window.URL.revokeObjectURL(url);
        });
    }

    selectAllEvents() {
        this.allSelected = !this.allSelected;
        this.results.forEach((result) => (result.checked = this.allSelected));
    }

    expandAllEvents() {
        this.allExpanded = !this.allExpanded;
        this.results.forEach((result) => (result.expanded = this.allExpanded));
    }
}
