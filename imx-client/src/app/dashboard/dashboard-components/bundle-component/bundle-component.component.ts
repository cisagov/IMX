import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { faUndo, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from 'src/app/env-service/env.service';
import { SavedBundlesService } from 'src/app/saved-bundles/saved-bundles-service/saved-bundles.service';
import { StixService } from 'src/app/stix-service.service';
import { Router } from '@angular/router';
import { v4 as uuid } from 'uuid';

@Component({
    selector: 'app-bundle-component',
    templateUrl: './bundle-component.component.html',
    styleUrls: ['./bundle-component.component.css', '../../dashboard.component.css', '../../../app.component.css'],
    standalone: false,
})
export class BundleComponentComponent {
    @Input() currentSelection: String;
    @Input() bundleLoading: boolean;
    @Output() loadingChange = new EventEmitter<boolean>();

    //fa icons
    faUndo = faUndo;
    faSearch = faSearch;
    faTimes = faTimes;

    //saved bundles
    path: String = '';
    size: number = 0;
    serverTotalPages: number = 0;
    currentPage: number = 1;

    savedBundles = [];
    filteredBundles = [];
    searchText: string = '';
    isSearching: boolean = false;
    searchDebounceTimer: any = null;

    constructor(
        public stixService: StixService,
        public savedBundlesService: SavedBundlesService,
        private envService: EnvService,
        private router: Router
    ) {}

    async ngOnInit() {
        let urlArr = window.location.href.split('/');
        this.path = urlArr[urlArr.length - 1];
        this.size = 10;

        await this.getBundles();
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['currentSelection']) {
            this.currentPage = 1;
            await this.getBundles();
        }
    }

    public async getBundles() {
        if (this.bundleLoading) return;
        if (!this.currentSelection) {
            this.currentSelection = this.envService.getUsername();
        }

        this.bundleLoading = true;
        this.loadingChange.emit(this.bundleLoading);

        try {
            await this.stixService.getSavedBundles(this.currentPage, 'na', this.currentSelection);

            this.bundleLoading = false;
            this.loadingChange.emit(this.bundleLoading);
        } catch (err) {
            this.bundleLoading = false;
            this.loadingChange.emit(this.bundleLoading);
        }

        this.savedBundles = [...this.stixService.serverSavedBundles];
        this.filteredBundles = [...this.savedBundles];
        this.serverTotalPages = Math.ceil(this.stixService.totalServerBundles / this.size);
    }

    downloadBundle(obj) {
        if (this.bundleLoading) return;

        let data = obj?._source?.bundle;

        if (!data) return;

        const bundle = {
            type: 'bundle',
            id: `bundle--${uuid()}`,
            objects: data,
        };

        let file = new Blob([JSON.stringify(bundle)], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = obj?._source?.name ? (obj._source.name.endsWith('.json') ? obj._source.name : `${obj._source.name}.json`) : 'bundle.json';
        a.click();
        a.remove();
    }

    previewBundle(obj) {
        if (this.bundleLoading) return;

        let data = obj?._source?.bundle;

        if (!data) return;

        const bundle = {
            type: 'bundle',
            id: `bundle--${uuid()}`,
            objects: data,
        };

        let file = new Blob([JSON.stringify(bundle)], { type: 'text/plain' });
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        const newTab = window.open(url);

        newTab?.document.write('<pre>', JSON.stringify(bundle, null, 2), '</pre>');
        newTab?.document.close();
    }

    importBundle(obj) {
        if (this.bundleLoading) return;

        if (obj._source?.bundle) {
            this.stixService.hasObjectsToLoad = true;
            this.stixService.objectsToLoad = [...obj._source.bundle];
            this.stixService.importReportName = obj._source.name;
            // localStorage.setItem("objects-to-load", JSON.stringify(obj._source.bundle));
            this.router.navigate(['/', 'bundle']);
        }
    }

    public async nextPage(direction) {
        if (this.bundleLoading) return;

        switch (direction) {
            case 'right':
                if (this.currentPage === this.serverTotalPages) return;
                this.currentPage++;
                break;
            case 'left':
                if (this.currentPage === 1) return;

                this.currentPage--;
                break;
        }

        await this.getBundles();
    }

    public async selectPage(pageNum) {
        if (this.bundleLoading) return;

        this.currentPage = pageNum;
        await this.getBundles();
    }

    onBundleSearchInput() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        if (!this.searchText.trim()) {
            this.clearSearch();
            return;
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.searchBundles();
        }, 300);
    }

    async searchBundles() {
        if (this.bundleLoading) return;

        if (!this.currentSelection) {
            this.currentSelection = this.envService.getUsername();
        }

        const query = {
            query_string: {
                query: `*${this.searchText}*`,
                fields: ['name'],
                default_operator: 'AND',
            },
        };

        this.bundleLoading = true;
        this.loadingChange.emit(this.bundleLoading);

        try {
            const result: any = await this.savedBundlesService.searchSavedBundles(this.currentPage, query, this.currentSelection, {
                sortKey: 'na',
                size: this.size,
            });

            if (result?.data?.hits) {
                this.filteredBundles = result.data.hits;
                this.serverTotalPages = Math.ceil((result.data.total?.value || result.data.hits.length) / this.size);
                this.isSearching = true;
            }
        } catch (err) {
            console.error('Search bundles error:', err);
        }

        this.bundleLoading = false;
        this.loadingChange.emit(this.bundleLoading);
    }

    clearSearch() {
        this.searchText = '';
        if (this.isSearching) {
            this.isSearching = false;
            this.currentPage = 1;
            this.getBundles();
        } else {
            this.filteredBundles = [...this.savedBundles];
        }
    }

    createArray(i: number) {
        return Array.from({ length: i }, (_, i) => i);
    }
}
