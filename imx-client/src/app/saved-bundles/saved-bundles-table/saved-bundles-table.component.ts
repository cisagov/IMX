import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StixService } from '../../stix-service.service';
import { SavedBundlesService } from '../saved-bundles-service/saved-bundles.service';
import {
    faArrowRight,
    faArrowLeft,
    faEdit,
    faTrash,
    faReply,
    faSave,
    faBan,
    faCloud,
    faHdd,
    faAngleUp,
    faAngleDown,
    faSearch,
    faCheck,
    faCopy,
    faTimes,
    faFileDownload,
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { SavedBundlesDialogComponent } from '../saved-bundles-dialog/saved-bundles-dialog.component';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AnnouncementService } from 'src/app/announcement-service/announcement-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-saved-bundles-table',
    templateUrl: './saved-bundles-table.component.html',
    styleUrls: ['./saved-bundles-table.component.css'],
    standalone: false,
})
export class SavedBundlesTableComponent implements OnInit {
    @Input('mode') mode: string;

    @Output() bundleStatus = new EventEmitter<any>();

    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faEdit = faEdit;
    faTrash = faTrash;
    faArrowCircleRight = faReply;
    faSave = faSave;
    faBan = faBan;
    faCloud = faCloud;
    faHdd = faHdd;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faSearch = faSearch;
    faCheck = faCheck;
    faCopy = faCopy;
    faTimes = faTimes;
    faDownload = faFileDownload;

    bundleRowNumber: number = -1;
    currentPage: number = 1;
    serverTotalPages: number = 0;
    localTotalPages: number = 0;
    size: number = 0;
    colspan: number = 8;

    savedBundleResults: string = '';
    activeTable: string = 'profile';
    path: string = '';
    sortKey: string = '';
    currentSelection: string = '';

    localPagination: any[] = [];

    isLoading: boolean = false;
    isSaving: boolean = false;
    nameCheck: boolean = true;

    unsortedLocalTable: any[] = [];
    sortedLocalTable: any[] = [];
    selectionOptions: any[] = [];

    searchType: 'name' | 'report' = 'name';
    searchText: string = '';
    isSearching = false;

    searchResultsProfile = [];
    searchResultsLocal = [];

    unsortedFilteredLocal = [];
    sortedFilteredLocal = [];

    totalProfileSearchBundles: number;
    totalLocalSearchBundles: number;
    currentSearchPage: number = 1;
    private searchDebounceTimer: any;

    currentSelectedBundle;
    currentSelectedBundleName = '';
    isFindingBundle = false;

    editingName = false;
    editingIndex: number;
    editingNameText: string;
    errorModal: NgbModalRef;

    newBundle: any = {
        name: '',
        reportNo: '',
        tlp: '',
        created: '',
        modified: '',
        submissionID: '',
        publicationServer: '',
        publicationRoot: '',
        publicationStatus: '',
        internal_status: 'TBD',
    };

    constructor(
        public stixService: StixService,
        private readonly router: Router,
        private readonly savedBundlesService: SavedBundlesService,
        public matDialog: MatDialog,
        public modalService: NgbModal,
        public announcementService: AnnouncementService,
        public envService: EnvService
    ) {}

    async ngOnInit(): Promise<void> {
        this.currentSelection = this.envService.getUsername();
        this.selectionOptions = [this.currentSelection];

        if (this.envService.taxiiUsers === undefined) {
            if (this.envService.env.environment !== 'dev') await this.envService.waitUser();
        }

        this.pushSelectionOptions();
        this.setColSpan();

        let urlArr = window.location.href.split('/');
        this.path = urlArr[urlArr.length - 1];
        this.size = 10;

        switch (this.path) {
            case 'bundle':
            case 'guided':
                this.size = 10;
                break;
        }

        if (this.stixService.imxServerConnectionError !== '' && !this.stixService.imxServerConnectionError.includes('No saved bundles for user')) {
            this.localPagination = [];

            for (let i = 0; i < this.stixService.localSavedBundles.length && i < this.size; i++) {
                this.localPagination.push(this.stixService.localSavedBundles[i]);
            }
        }

        if (this.stixService.reportName && this.mode == 'saving') {
            this.activeTable = 'profile';
            this.searchText = '';
            this.currentSelectedBundleName = this.stixService.reportName;
        }
        await this.nextPage(1);

        const serverTotal = this.stixService.totalServerBundles || 0;
        this.serverTotalPages = serverTotal > 0 ? Math.ceil(serverTotal / this.size) : 1;

        const localTotal = this.stixService.localSavedBundles?.length || 0;
        this.localTotalPages = localTotal > 0 ? Math.ceil(localTotal / this.size) : 1;
    }

    pushSelectionOptions(): void {
        for (let group in this.envService.groupInfo) {
            for (let user of this.envService.groupInfo?.[group]) {
                if (this.selectionOptions.includes(user.user)) continue;

                this.selectionOptions.push(user.user);
            }
        }

        for (let group in this.envService.groupInfo) {
            this.selectionOptions.push(`${group} (group)`);
        }
    }

    setColSpan(): void {
        switch (this.mode) {
            case 'saving':
            case 'loading':
                // Save mode = 7 col; local view = 6 col
                this.colspan = this.activeTable === 'profile' ? 7 : 6;
                break;
            default:
                // Default mode = 9 col; local view = 8 col
                this.colspan = this.activeTable === 'profile' ? 9 : 8;
        }
    }

    async onUserChange(event) {
        this.bundleRowNumber = -1;
        this.savedBundleResults = '';
        if (this.currentSelection.includes('group')) this.searchText = '';
        this.nextPage(1);
    }

    public async sortTable(col) {
        await this.envService.checkAuth('/my-profile');
        //Determine sort key
        if (this.sortKey === '') {
            this.sortKey = `${col}-desc`;
        } else {
            let splitKey = this.sortKey.split('-');

            if (splitKey[0] === col) {
                if (splitKey[1] === 'desc') {
                    this.sortKey = `${col}-asc`;
                } else {
                    this.sortKey = '';
                }
            } else {
                this.sortKey = `${col}-desc`;
            }
        }

        //Determine table
        switch (this.activeTable) {
            case 'profile':
                this.sortProfile(col);
                break;
            case 'local':
                this.sortLocal();
                break;
        }
    }

    private async sortProfile(col) {
        this.isLoading = true;
        let varType = 'string';

        if (col === 'reportNo') {
            varType = 'number';
        }

        const query =
            this.searchType === 'name'
                ? {
                      query_string: {
                          query: `*${this.searchText}*`,
                          fields: ['name'],
                      },
                  }
                : {
                      query_string: {
                          query: Number(this.searchText),
                          fields: ['reportNo'],
                      },
                  };

        const searchFilter = {
            sortKey: !this.sortKey ? 'na' : `${this.sortKey}-${varType}`,
            size: this.size,
        };

        let result: any =
            !this.isSearching || !this.searchText || (this.searchType === 'report' && !Number(this.searchText))
                ? await this.savedBundlesService.getSavedBundles(1, `${this.sortKey}-${varType}`, this.currentSelection)
                : await this.savedBundlesService.searchSavedBundles(this.currentSearchPage, query, this.currentSelection, searchFilter);

        if (!this.isSearching) {
            if (result.hits) {
                this.stixService.serverSavedBundles = result.hits;
            }
        } else if (result.data?.hits) {
            this.searchResultsProfile = result.data.hits;
            this.totalProfileSearchBundles = Math.ceil(result.data.total.value / this.size);
        }

        this.isLoading = false;
    }

    private sortLocal() {
        if (!this.isSearching) {
            this.notSearchingSortLocal();
        } else {
            this.searchingSortLocal();
        }
    }

    notSearchingSortLocal() {
        this.localPagination = [];
        this.unsortedLocalTable = [];
        for (let bundle of this.stixService.localSavedBundles) {
            this.unsortedLocalTable.push(bundle);
        }

        if (this.sortKey === '') {
            for (let i = 0; i < this.size && i < this.unsortedLocalTable.length; i++) {
                this.localPagination.push(this.unsortedLocalTable[i]);
            }
        } else {
            let splitKey = this.sortKey.split('-');

            switch (splitKey[1]) {
                case 'desc':
                    this.sortedLocalTable = this.sortDes(splitKey[0]);
                    break;
                case 'asc':
                    this.sortedLocalTable = this.sortAsc(splitKey[0]);
                    break;
            }

            this.localPagination = this.sortedLocalTable.slice((this.currentPage - 1) * this.size, this.currentPage * this.size);
        }
    }

    searchingSortLocal() {
        this.searchResultsLocal = [];
        const unsortedTable = this.unsortedFilteredLocal.slice();

        if (this.sortKey === '') {
            this.searchResultsLocal = unsortedTable.slice((this.currentSearchPage - 1) * this.size, this.currentSearchPage * this.size);
            this.sortedFilteredLocal = unsortedTable;
        } else {
            let splitKey = this.sortKey.split('-');
            const col = splitKey[0];

            switch (splitKey[1]) {
                case 'desc':
                    switch (col) {
                        case 'created':
                        case 'modified':
                            unsortedTable.sort((a, b) => this.sortDate(a[col], b[col], 'des'));
                            break;
                        default:
                            unsortedTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
                    }
                    break;
                case 'asc':
                    switch (col) {
                        case 'created':
                        case 'modified':
                            unsortedTable.sort((a, b) => this.sortDate(a[col], b[col], 'asc'));
                            break;
                        default:
                            unsortedTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
                    }
            }

            this.sortedFilteredLocal = unsortedTable;
            this.searchResultsLocal = unsortedTable.slice((this.currentSearchPage - 1) * this.size, this.currentSearchPage * this.size);
        }
    }

    sortDes(col): any[] {
        switch (col) {
            case 'created':
            case 'modified':
                return this.unsortedLocalTable.sort((a, b) => this.sortDate(a[col], b[col], 'des'));
            default:
                return this.unsortedLocalTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'des'));
        }
    }

    sortAsc(col): any[] {
        switch (col) {
            case 'created':
            case 'modified':
                return this.unsortedLocalTable.sort((a, b) => this.sortDate(a[col], b[col], 'asc'));
            default:
                return this.unsortedLocalTable.sort((a, b) => this.sortToLowercase(a[col], b[col], 'asc'));
        }
    }

    sortToLowercase(a, b, mode) {
        if (typeof a === 'string') a = a.toLowerCase();
        if (typeof b === 'string') b = b.toLowerCase();

        if (a < b) return mode === 'asc' ? 1 : -1;
        else if (a > b) return mode === 'asc' ? -1 : 1;
        else return 0;
    }

    private sortDate(a: any, b: any, type: string) {
        a = new Date(a);
        b = new Date(b);

        if (!this.isValidDate(a) && !this.isValidDate(b)) return 0;
        else if (!this.isValidDate(a)) return 1;
        else if (!this.isValidDate(b)) return -1;

        switch (type) {
            case 'asc':
                return this.sortDateAsc(a, b);
            case 'des':
                return this.sortDateDes(a, b);
            default:
                return 0;
        }
    }

    sortDateAsc(a, b) {
        if (a < b) return 1;
        else if (a > b) return -1;
        else return 0;
    }

    sortDateDes(a, b) {
        if (a < b) return -1;
        else if (a > b) return 1;
        else return 0;
    }

    isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    public changeActiveTable(table) {
        this.cancelBundleNameEdit();
        this.sortKey = '';
        if (table !== this.activeTable) {
            this.activeTable = table;
            this.currentPage = 1;
            this.currentSearchPage = 1;
            this.setColSpan();

            if (table === 'local') {
                this.localPagination = [];
                this.unsortedLocalTable = [];
                this.sortedFilteredLocal = [];
                this.searchResultsLocal = [];

                for (let i = 0; i < this.stixService.localSavedBundles.length && i < this.size; i++) {
                    this.localPagination.push(this.stixService.localSavedBundles[i]);
                }
            }
        }

        this.search();
    }

    public changeShowSavedBundles(i) {
        if (this.bundleRowNumber === i) {
            this.bundleRowNumber = -1;
            this.savedBundleResults = '';
        } else {
            this.bundleRowNumber = i;
            this.savedBundleResults = this.stixService.savedBundles[i].bundle;
            switch (this.activeTable) {
                case 'profile':
                    this.savedBundleResults = !this.isSearching
                        ? this.stixService.serverSavedBundles[i]._source.bundle
                        : this.searchResultsProfile[i]._source.bundle;
                    break;
                case 'local':
                    this.savedBundleResults = !this.isSearching ? this.stixService.localSavedBundles[i].bundle : this.searchResultsLocal[i].bundle;
                    break;
            }
        }
    }

    public selectCurrentBundle(obj) {
        this.currentSelectedBundleName = this.activeTable === 'profile' ? obj._source.name : obj.name;
        this.currentSelectedBundle = obj;
    }

    public trimBundleName() {
        this.currentSelectedBundleName = this.currentSelectedBundleName.trim();
    }

    public changeNewBundle(event) {
        this.newBundle.internal_status = event.target.value;
        if (event.target.value === '') {
            this.newBundle.internal_status = 'TBD';
        }
    }

    public async searchBundleName(modal: any) {
        try {
            this.isFindingBundle = true;
            let isNew = false;

            if (this.activeTable == 'profile') {
                const searchFilters = {
                    sortKey: 'na',
                    size: 10,
                };
                const query = {
                    term: {
                        'name.keyword': this.currentSelectedBundleName,
                    },
                };

                const result: any = await this.savedBundlesService.searchSavedBundles(1, query, this.currentSelection, searchFilters);

                if (result?.data?.hits.length >= 1) {
                    this.currentSelectedBundle = result.data.hits[0];
                    this.currentSelectedBundleName = result.data.hits[0]._source.name;
                } else {
                    isNew = true;
                    this.currentSelectedBundle = this.newBundle;
                    this.currentSelectedBundle.name = this.currentSelectedBundleName;
                }
            } else if (this.activeTable == 'local') {
                if (!this.currentSelectedBundle || this.currentSelectedBundle.name !== this.currentSelectedBundleName) {
                    const bundleIndex = this.stixService.localSavedBundles.findIndex((elem) => elem.name === this.currentSelectedBundleName);
                    if (bundleIndex === -1) {
                        isNew = true;
                        this.currentSelectedBundle = this.newBundle;
                        this.currentSelectedBundle.name = this.currentSelectedBundleName;
                    } else {
                        this.currentSelectedBundle = this.stixService.localSavedBundles[bundleIndex];
                    }
                }
            }

            this.saveBundle(this.currentSelectedBundle, isNew, modal);
        } catch (err) {
            console.error('Error while saving bundle', err);
        } finally {
            this.isFindingBundle = false;
        }
    }

    public editBundleName(event, i, bundleName) {
        this.editingIndex = i;
        this.editingName = true;
        this.editingNameText = bundleName;
        event.stopPropagation();
    }

    public cancelBundleNameEdit(event = null) {
        this.editingIndex = -1;
        this.editingName = false;
        this.editingNameText = '';
        if (event) event.stopPropagation();
    }

    public async renameBundle(event, bundle, modal: any) {
        try {
            event.stopPropagation();

            if (this.activeTable == 'local') {
                await this.renameLocalBundle(event, bundle, modal);
            } else if (this.activeTable == 'profile') {
                await this.renameProfileBundle(event, bundle, modal);
            }
        } catch (err) {
            console.error('Error occured while renaming', err);
            this.editingName = false;
            this.editingNameText = '';
            this.editingIndex = -1;
        }
    }

    private async renameLocalBundle(event, bundle, modal) {
        if (bundle.name === this.editingNameText) {
            this.cancelBundleNameEdit(event);
            return;
        }

        const foundIndex = this.stixService.localSavedBundles.findIndex((elem) => elem.name === this.editingNameText);
        if (foundIndex === -1) {
            let temp = {
                status: 'save',
                isNew: false,
                bundle: bundle,
                name: this.editingNameText,
                destination: this.activeTable,
                isChangingName: true,
            };

            if (this.mode === 'basic') {
                const tempBundle = {
                    reportNo: bundle.reportNo,
                    name: this.editingNameText,
                    owner: this.envService.getUsername(),
                    bundle: bundle.bundle,
                    created: bundle.created,
                    modified: bundle.modified,
                    tlp: bundle.tlp,
                    submissionID: bundle.submissionID,
                    publicationServer: bundle.publicationServer,
                    publicationRoot: bundle.publicationRoot,
                    publicationStatus: bundle.publicationStatus,
                    internal_status: bundle.internal_status,
                    new_version_objects: bundle.new_version_objects,
                };

                await this.stixService.db.savedBundles.where({ name: bundle.name, owner: this.envService.getUsername() }).modify(tempBundle);
                this.announcementService.show('Bundle Saved', 'The Bundle was successfully overwritten locally', 'success', false);
                bundle.name = this.editingNameText;
                this.editingName = false;
                this.editingNameText = '';
                this.editingIndex = -1;
            } else {
                this.bundleStatus.emit(temp);
            }
        } else {
            this.errorModal = this.modalService.open(modal, { centered: true });
        }
    }

    private async renameProfileBundle(event, bundle, modal) {
        if (bundle._source.name === this.editingNameText) {
            this.cancelBundleNameEdit(event);
            return;
        }

        const searchFilters = {
            sortKey: 'na',
            size: 10,
        };
        const query = {
            query_string: {
                query: this.editingNameText,
                fields: ['name.keyword'],
            },
        };

        const result: any = await this.savedBundlesService.searchSavedBundles(1, query, this.currentSelection, searchFilters);

        if (result?.data?.hits.length === 1) {
            this.errorModal = this.modalService.open(modal, { centered: true });
        } else {
            let temp = {
                status: 'save',
                isNew: false,
                bundle: bundle,
                name: this.editingNameText,
                destination: this.activeTable,
                isChangingName: true,
            };

            if (this.mode !== 'basic') {
                this.bundleStatus.emit(temp);
                return;
            }

            let tempBundle = {};
            const source = bundle['_source'];

            tempBundle['_source'] = {
                reportNo: source.reportNo,
                name: this.editingNameText,
                bundle: source.bundle,
                created: source.created,
                modified: source.modified,
                tlp: source.tlp,
                submissionID: source.submissionID,
                publicationServer: source.publicationServer,
                publicationRoot: source.publicationRoot,
                publicationStatus: source.publicationStatus,
                internal_status: source.internal_status,
                new_version_objects: source.new_version_objects,
            };

            let res: any = await this.savedBundlesService.updateSavedBundle(tempBundle);

            if (!res.data && !res.data.result && res.data.result !== 'updated') {
                this.announcementService.show(
                    'Error in Saving Bundle',
                    'Error saving Bundle to IMX Server, please try again or report the error',
                    'error',
                    false
                );
            } else {
                this.announcementService.show('Bundle Saved', 'The Bundle was successfully renamed', 'success', false);
                bundle._source.name = this.editingNameText;
            }
            this.editingName = false;
            this.editingNameText = '';
            this.editingIndex = -1;
        }
    }

    public saveBundle(newBundle, isNew, modal = null) {
        let temp = {
            status: 'save',
            isNew: isNew,
            bundle: newBundle,
            name: '',
            destination: this.activeTable,
        };

        if (isNew === true) temp.bundle = this.newBundle;

        if (this.activeTable === 'profile' && isNew === false) {
            temp.name = newBundle._source.name;
        } else {
            temp.name = newBundle.name;
        }

        if (!isNew) {
            this.errorModal = this.modalService.open(modal, { centered: true });
            this.errorModal.result.then((res) => {
                if (res === 'confirm') {
                    this.bundleStatus.emit(temp);
                }
            });
        } else {
            this.bundleStatus.emit(temp);
        }
    }

    public continueOverwrite(bool) {
        if (bool) {
            this.errorModal.close('confirm');
        } else {
            this.errorModal.close('cancel');
        }
    }

    public activateSave(state) {
        switch (state) {
            case 'show':
                this.isSaving = true;
                break;
            case 'hide':
                this.isSaving = false;
                break;
        }
    }

    public newBundleNameChange(event) {
        if (event.target.value === '') {
            this.nameCheck = true;
            return;
        }

        for (let bundle of this.stixService.savedBundles) {
            if (bundle.name === event.target.value) {
                this.nameCheck = true;
                return;
            }
        }

        this.nameCheck = false;
    }

    public async editBundle(obj) {
        await this.envService.checkAuth('/my-profile');
        if (this.path === 'bundle' || this.path === 'guided') {
            let temp = {
                status: 'load',
                bundle: obj,
                name: '',
                destination: this.activeTable,
            };

            if (this.activeTable === 'profile') {
                temp.name = obj._source.name;
            } else {
                temp.name = obj.name;
            }

            this.bundleStatus.emit(temp);
        } else {
            const dialogRef = this.matDialog.open(SavedBundlesDialogComponent, {
                data: { mode: 'Edit', table: this.activeTable, bundle: obj },
                minHeight: '150px',
                maxHeight: '750px',
                width: `${window.innerWidth / 1.5}px`,
                position: {
                    top: '150px',
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result.result && result.result === 'send') {
                    this.router.navigateByUrl('/bundle', { state: result });
                }
            });
        }
    }

    public async deleteBundle(obj) {
        this.modalService.dismissAll();
        await this.envService.checkAuth('/my-profile');
        const dialogRef = this.matDialog.open(SavedBundlesDialogComponent, {
            data: { mode: 'Delete', table: this.activeTable, bundle: obj },
            minHeight: '150px',
            maxHeight: '750px',
            width: `${window.innerWidth / 1.5}px`,
            position: {
                top: '150px',
            },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result.delete && result.delete === true) {
                this.isLoading = true;
                switch (result.table) {
                    case 'profile':
                        await this.savedBundlesService.deleteSavedBundle(result.bundle._id);
                        break;
                    case 'local':
                        await this.stixService.db.savedBundles.where({ name: result.bundle.name, owner: this.envService.getUsername() }).delete();
                        break;
                }
                await this.stixService.getSavedBundles(this.currentPage, this.sortKey, this.currentSelection);

                this.localPagination = [];
                for (let i = 0; i < this.stixService.localSavedBundles.length && i < this.size; i++) {
                    this.localPagination.push(this.stixService.localSavedBundles[i]);
                }

                this.isLoading = false;
            }
        });
    }

    public async copyBundle(obj) {
        await this.envService.checkAuth('/my-profile');

        let currentUser = this.envService.keycloakUser.preferred_username;

        let newObj = {};

        for (let field in obj._source) {
            switch (field) {
                case 'user':
                    newObj[field] = currentUser;
                    break;
                case '@created_timestamp':
                    newObj[field] = new Date().toISOString();
                    break;
                case 'name':
                    newObj[field] = `${obj._source[field]} COPY`;
                    break;
                default:
                    newObj[field] = obj._source[field];
            }
        }

        let copyRes: any = await this.savedBundlesService.postSavedBundle(newObj);

        if (copyRes.status && copyRes.status === 201) {
            this.announcementService.show(
                'Bundle Copied',
                "The Bundle was successfully copied to the current User's saved bundles",
                'success',
                false
            );
        }
    }

    public async loadBundle(obj) {
        if (obj._source?.bundle) {
            this.stixService.hasObjectsToLoad = true;
            this.stixService.objectsToLoad = [...obj._source.bundle];
            this.stixService.importReportName = obj._source.name;

            let urlArr = window.location.href.split('/');
            if (urlArr[urlArr.length - 1] === 'guided') {
                this.router.navigate(['/', 'guided']);
            } else {
                this.router.navigate(['/', 'bundle']);
            }
        }
    }

    public async transferBundle(obj) {
        await this.envService.checkAuth('/my-profile');

        const dialogRef = this.matDialog.open(SavedBundlesDialogComponent, {
            data: { mode: 'Transfer', table: this.activeTable, bundle: obj },
            minHeight: '150px',
            maxHeight: '750px',
            width: `${window.innerWidth / 1.5}px`,
            position: {
                top: '150px',
            },
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result.transfer && result.transfer === true) {
                this.isLoading = true;
                let response: any;
                switch (result.table) {
                    case 'profile':
                        response = await this.stixService.db.savedBundles.put(result.bundle._source);
                        if (response) {
                            await this.savedBundlesService.deleteSavedBundle(result.bundle._id);
                        }
                        break;
                    case 'local':
                        response = await this.savedBundlesService.postSavedBundle(result.bundle);
                        if (response.status && response.status === 201) {
                            await this.stixService.db.savedBundles.where({ name: result.bundle.name, owner: this.envService.getUsername() }).delete();
                        }
                        break;
                }
                await this.stixService.getSavedBundles(this.currentPage, this.sortKey, this.currentSelection);

                this.localPagination = [];
                for (let i = 0; i < this.stixService.localSavedBundles.length && i < this.size; i++) {
                    this.localPagination.push(this.stixService.localSavedBundles[i]);
                }

                this.isLoading = false;
            }
        });
    }

    public async internalStatusChange(event, obj) {
        let timestamp = new Date().toString();
        let timeArr = timestamp.split('(');
        let timezone = timeArr[1];
        let zoneArr = timezone.split(' ');
        let zoneString = '';
        for (let word of zoneArr) {
            zoneString += word.substring(0, 1);
        }
        let timeString = `${timestamp.substring(0, 24)} ${zoneString}`;
        this.isLoading = true;

        switch (this.activeTable) {
            case 'profile':
                obj._source['internal_status'] = event.target.value;
                obj._source['modified'] = timeString;
                this.savedBundlesService.updateSavedBundle(obj);
                break;
            case 'local':
                obj['internal_status'] = event.target.value;
                obj['modified'] = timeString;
                await this.stixService.db.savedBundles.where({ name: obj.name, owner: this.envService.getUsername() }).modify(obj);
                break;
        }

        this.isLoading = false;
    }

    public async nextPage(direction) {
        await this.envService.checkAuth('/my-profile');

        this.cancelBundleNameEdit();
        this.updatePageNumber(direction);

        if (!this.isSearching) {
            await this.notSearchingNextPage();
        } else {
            await this.searchingNextPage();
        }
    }

    updatePageNumber(direction) {
        switch (direction) {
            case 'right':
                if (!this.isSearching) this.currentPage++;
                else this.currentSearchPage++;
                break;
            case 'left':
                if (!this.isSearching) this.currentPage--;
                else this.currentSearchPage--;
                break;
        }
    }

    async notSearchingNextPage() {
        if (this.activeTable === 'local') {
            this.localPagination = [];
            if (!this.sortKey) {
                for (
                    let i = (this.currentPage - 1) * this.size;
                    i < this.stixService.localSavedBundles.length && i < this.size * this.currentPage;
                    i++
                ) {
                    this.localPagination.push(this.stixService.localSavedBundles[i]);
                }
            } else {
                this.localPagination = this.sortedLocalTable.slice((this.currentPage - 1) * this.size, this.currentPage * this.size);
            }
        } else if (this.activeTable === 'profile') {
            this.isLoading = true;
            await this.stixService.getSavedBundles(this.currentPage, this.sortKey, this.currentSelection);
            this.isLoading = false;
        }
    }

    async searchingNextPage() {
        if (this.activeTable === 'local') {
            if (this.sortKey) {
                this.searchResultsLocal = this.sortedFilteredLocal.slice(
                    (this.currentSearchPage - 1) * this.size,
                    this.currentSearchPage * this.size
                );
            } else {
                this.searchResultsLocal = this.unsortedFilteredLocal.slice(
                    (this.currentSearchPage - 1) * this.size,
                    this.currentSearchPage * this.size
                );
            }
        } else if (this.activeTable === 'profile') {
            if (this.sortKey) {
                this.isLoading = true;
                await this.sortProfile(this.sortKey.split('-')[0]);
                this.isLoading = false;
            } else {
                this.search();
            }
        }
    }

    onSearchInput(): void {
        clearTimeout(this.searchDebounceTimer);
        if (!this.searchText) {
            this.clearSearchCompletely();
            return;
        }
        this.searchDebounceTimer = setTimeout(() => {
            this.setSearchPage();
            this.search();
        }, 300);
    }

    setSearchType(event) {
        this.searchType = event.target.value;
        if (this.searchText) {
            this.search();
        }
    }

    //Specifically used for when searching for bundles
    search() {
        this.cancelBundleNameEdit();
        this.bundleRowNumber = -1;
        this.savedBundleResults = '';
        this.sortKey = '';

        if (!this.searchText) {
            this.isSearching = false;
            this.searchResultsLocal = this.stixService.localSavedBundles.slice(0, this.size);
            return;
        }

        this.isLoading = true;
        const searchFilters = {
            sortKey: 'na',
            size: this.size,
        };

        if (this.searchType === 'name') {
            if (this.activeTable === 'profile') {
                const query = {
                    query_string: {
                        query: `*${this.searchText}*`,
                        fields: ['name'],
                        default_operator: 'AND',
                    },
                };
                this.savedBundlesService
                    .searchSavedBundles(this.currentSearchPage, query, this.currentSelection, searchFilters)
                    .then((res: any) => {
                        if (res.data.hits && Array.isArray(res.data.hits)) {
                            this.searchResultsProfile = res.data.hits;
                            this.totalProfileSearchBundles = Math.ceil(res.data.total.value / this.size);
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                    })
                    .finally(() => {
                        this.isLoading = false;
                        this.isSearching = true;
                    });
            } else if (this.activeTable === 'local') {
                this.unsortedFilteredLocal = this.stixService.localSavedBundles.filter((elem) => {
                    const bundleName: string = elem?.name;
                    return this.filter(bundleName);
                });

                this.searchResultsLocal = this.unsortedFilteredLocal.slice(
                    (this.currentSearchPage - 1) * this.size,
                    this.currentSearchPage * this.size
                );
                this.totalLocalSearchBundles = Math.ceil(this.unsortedFilteredLocal.length / this.size);
                this.isLoading = false;
                this.isSearching = true;
            }
        } else if (this.searchType === 'report') {
            if (!Number(this.searchText)) {
                this.isLoading = false;
                this.isSearching = false;
                return;
            }

            const reportNo = Number(this.searchText);

            if (this.activeTable === 'profile') {
                const query = {
                    query_string: {
                        query: reportNo,
                        fields: ['reportNo'],
                    },
                };

                this.savedBundlesService
                    .searchSavedBundles(this.currentSearchPage, query, this.currentSelection, searchFilters)
                    .then((res: any) => {
                        if (res.data.hits && Array.isArray(res.data.hits)) {
                            this.searchResultsProfile = res.data.hits;
                            this.totalProfileSearchBundles = Math.ceil(res.data.total.value / this.size);
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                    })
                    .finally(() => {
                        this.isLoading = false;
                        this.isSearching = true;
                    });
            } else if (this.activeTable === 'local') {
                this.unsortedFilteredLocal = this.stixService.localSavedBundles.filter((elem) => elem.reportNo === reportNo);

                this.searchResultsLocal = this.unsortedFilteredLocal.slice(
                    (this.currentSearchPage - 1) * this.size,
                    this.currentSearchPage * this.size
                );
                this.totalLocalSearchBundles = Math.ceil(this.unsortedFilteredLocal.length / this.size);
                this.isLoading = false;
                this.isSearching = true;
            }
        }
    }

    filter(bundleName: string): boolean {
        if (!bundleName) return false;

        return bundleName.toLowerCase().includes(this.searchText.toLowerCase());
    }

    setSearchPage(): void {
        this.currentSearchPage = 1;
    }

    clearSearch(): void {
        if (this.searchText === '') {
            this.currentSearchPage = 1;
            this.search();
        } else {
            this.searchText = this.searchText.trim();
        }
    }

    async clearSearchCompletely(): Promise<void> {
        this.searchText = '';
        this.isSearching = false;
        this.currentSearchPage = 1;
        this.searchResultsProfile = [];
        this.searchResultsLocal = [];
        this.sortKey = '';
        this.bundleRowNumber = -1;
        this.savedBundleResults = '';

        this.currentPage = 1;

        if (this.activeTable === 'profile') {
            this.isLoading = true;
            await this.stixService.getSavedBundles(this.currentPage, this.sortKey, this.currentSelection);
            this.isLoading = false;
        } else if (this.activeTable === 'local') {
            this.localPagination = [];
            for (let i = 0; i < this.stixService.localSavedBundles.length && i < this.size; i++) {
                this.localPagination.push(this.stixService.localSavedBundles[i]);
            }
        }
    }
}
