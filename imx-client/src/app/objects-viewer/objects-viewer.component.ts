import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { faAngleDoubleUp, faBan, faFileImport, faSearch } from '@fortawesome/free-solid-svg-icons';
import { STIX_OBJECTS } from '../models/stix-objects';
import { StixService } from '../stix-service.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';

export interface ViewerRow {
    object: any;
    root: string;
    collectionId: string;
    collectionTitle: string;
    display: string;
    typeDisplayName: string;
    externalId: string;
    modifiedLabel: string;
    filterKey: string;
    checked: boolean;
    expanded: boolean;
}

export interface RootGroup {
    apiPath: string;
    title: string;
    rows: ViewerRow[];
    expanded: boolean;
}

const COLLAPSE_THRESHOLD = 25;

const TYPE_DISPLAY_NAMES = new Map<string, string>(
    STIX_OBJECTS.flatMap((category) => category.objects.map((object): [string, string] => [object.type, object.displayName]))
);

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
    @Input() useDefaultServerRoots = false;

    faAngleDoubleUp = faAngleDoubleUp;
    faBan = faBan;
    faAddToBundle = faFileImport;
    faSearch = faSearch;

    groups: RootGroup[] = [];
    visibleGroups: RootGroup[] = [];

    filterText = '';
    totalRowCount = 0;
    visibleRowCount = 0;

    hasMixedTypes = false;
    isImporting = false;

    constructor(
        public activeModal: NgbActiveModal,
        public stixService: StixService,
        private router: Router,
        private announcementService: AnnouncementService
    ) {}

    async ngOnInit(): Promise<void> {
        this.buildGroups();

        const roots = await this.resolveRoots();
        this.applyRootLabels(roots);

        this.applyFilter();
    }

    // --- Building the row model -------------------------------------------------

    private buildGroups(): void {
        const groupsByRoot = new Map<string, RootGroup>();

        (this.objects || []).forEach((object: any, index: number) => {
            const foundIn = this.rcPairs?.[index] || {};

            for (const root of Object.keys(foundIn)) {
                let group = groupsByRoot.get(root);

                if (!group) {
                    group = { apiPath: root, title: root, rows: [], expanded: false };
                    groupsByRoot.set(root, group);
                }

                for (const collectionId of foundIn[root] || []) {
                    group.rows.push(this.buildRow(object, root, collectionId));
                }
            }
        });

        this.groups = [...groupsByRoot.values()];
        this.totalRowCount = this.groups.reduce((count, group) => count + group.rows.length, 0);

        this.hasMixedTypes = new Set((this.objects || []).map((object: any) => object.type)).size > 1;
        this.assignFilterKeys();

        this.visibleGroups = this.groups;
        this.visibleRowCount = this.totalRowCount;

        const startExpanded = this.totalRowCount <= COLLAPSE_THRESHOLD;
        for (const group of this.groups) {
            group.expanded = startExpanded;
        }
    }

    private buildRow(object: any, root: string, collectionId: string): ViewerRow {
        return {
            object,
            root,
            collectionId,
            collectionTitle: collectionId,
            display: this.getComponentDisplay(object),
            typeDisplayName: this.getTypeDisplayName(object.type),
            externalId: this.getExternalId(object),
            modifiedLabel: this.formatModified(object.modified),
            filterKey: '',
            checked: false,
            expanded: false,
        };
    }

    private assignFilterKeys(): void {
        for (const group of this.groups) {
            for (const row of group.rows) {
                row.filterKey = this.buildFilterKey(row, group.title);
            }
        }
    }

    private buildFilterKey(row: ViewerRow, rootTitle: string): string {
        const parts = [row.display, row.externalId, row.root, rootTitle, row.collectionId, row.collectionTitle];

        if (this.hasMixedTypes) {
            parts.push(row.object?.type, row.typeDisplayName);
        }

        return parts.join(' ').toLowerCase();
    }

    // --- Resolving root and collection titles -----------------------------------

    private async resolveRoots(): Promise<any[]> {
        if (!this.useDefaultServerRoots) {
            return this.stixService.apiRoots2 || [];
        }

        const defaultRoots = await this.stixService.getDefaultServerRootsForLabels();

        return defaultRoots?.length > 0 ? defaultRoots : this.stixService.apiRoots2 || [];
    }

    private applyRootLabels(roots: any[]): void {
        for (const group of this.groups) {
            const root = roots.find((r) => r.apiPath === group.apiPath);
            if (!root) continue;

            group.title = root.title || group.apiPath;

            for (const row of group.rows) {
                const collection = (root.collections || []).find((c: any) => c.id === row.collectionId);
                if (collection?.title) {
                    row.collectionTitle = collection.title;
                }
            }
        }

        this.assignFilterKeys();
    }

    // --- Filtering --------------------------------------------------------------

    applyFilter(): void {
        const needle = this.filterText.trim().toLowerCase();

        if (!needle) {
            this.visibleGroups = this.groups;
            this.visibleRowCount = this.totalRowCount;
            return;
        }

        const matches: RootGroup[] = [];

        for (const group of this.groups) {
            const rows = group.rows.filter((row) => row.filterKey.includes(needle));

            if (rows.length > 0) {
                matches.push({ ...group, rows, expanded: true });
            }
        }

        this.visibleGroups = matches;
        this.visibleRowCount = matches.reduce((count, group) => count + group.rows.length, 0);
    }

    // --- Expanding and selecting ------------------------------------------------

    toggleGroup(group: RootGroup): void {
        group.expanded = !group.expanded;
    }

    toggleRow(row: ViewerRow): void {
        row.expanded = !row.expanded;
    }

    toggleGroupSelection(group: RootGroup, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;

        for (const row of group.rows) {
            row.checked = checked;
        }
    }

    isGroupFullySelected(group: RootGroup): boolean {
        return group.rows.length > 0 && group.rows.every((row) => row.checked);
    }

    isGroupPartiallySelected(group: RootGroup): boolean {
        return group.rows.some((row) => row.checked) && !this.isGroupFullySelected(group);
    }

    disableAddToBundle(): boolean {
        return !this.groups.some((group) => group.rows.some((row) => row.checked));
    }

    // --- Importing --------------------------------------------------------------

    async addToBundle(): Promise<void> {
        this.isImporting = true;

        try {
            const seenObjectIds = new Set<string>();
            const rowsToImport: ViewerRow[] = [];

            for (const group of this.groups) {
                for (const row of group.rows) {
                    if (!row.checked || seenObjectIds.has(row.object.id)) continue;
                    seenObjectIds.add(row.object.id);

                    rowsToImport.push(row);
                }
            }

            for (const row of rowsToImport) {
                await this.stixService.addComponent(row.object);
            }

            // Pull in any referenced objects the bundle is missing so relationships are not left dangling
            for (const row of rowsToImport) {
                const refs = this.collectReferencedIds(row.object).filter((id) => !seenObjectIds.has(id) && !this.stixService.getObjectFromID(id));

                if (refs.length === 0) continue;

                const fetched = await this.stixService.fetchObjectsByIds(refs, row.root, row.collectionId, this.useDefaultServerRoots);

                for (const object of fetched) {
                    seenObjectIds.add(object.id);
                    await this.stixService.addComponent(object);
                }
            }

            const count = seenObjectIds.size;
            const message = count === 1 ? 'Imported 1 object from TAXII' : `Imported ${count} objects from TAXII`;
            this.announcementService.show('Successfully imported', message, 'success', false);

            this.router.navigate(['bundle']);

            this.activeModal.close({ type: 'add' });
        } finally {
            this.isImporting = false;
        }
    }

    private collectReferencedIds(object: any): string[] {
        const refs: string[] = [];

        if (object.object_refs?.length > 0) {
            refs.push(...object.object_refs);
        }

        if (object.type === 'relationship') {
            if (object.source_ref) refs.push(object.source_ref);
            if (object.target_ref) refs.push(object.target_ref);
        }

        return refs;
    }

    close(): void {
        this.activeModal.close({ type: 'cancel' });
    }

    // --- Display helpers --------------------------------------------------------

    private getTypeDisplayName(type: string): string {
        return TYPE_DISPLAY_NAMES.get(type) || type;
    }

    private formatModified(modified: string): string {
        if (!modified) return '';

        const date = new Date(modified);
        if (isNaN(date.getTime())) return '';

        const absoluteDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

        let relativeTime: string;
        if (diffDays === 0) {
            relativeTime = 'today';
        } else if (diffDays === 1) {
            relativeTime = '1 day ago';
        } else if (diffDays < 30) {
            relativeTime = `${diffDays} days ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            relativeTime = months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            relativeTime = years === 1 ? '1 year ago' : `${years} years ago`;
        }

        return `${absoluteDate} (${relativeTime})`;
    }

    getExternalId(component: any): string {
        const ref = (component?.external_references || []).find((r: any) => r?.external_id);

        return ref?.external_id || '';
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
}
