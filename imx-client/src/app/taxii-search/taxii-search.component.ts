import { Component, OnInit, signal } from '@angular/core';
import { faServer, faUserFriends, faList } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { EnvService } from '../env-service/env.service';
import { StixService } from '../stix-service.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';

@Component({
    selector: 'app-taxii-search',
    standalone: false,
    templateUrl: './taxii-search.component.html',
    styleUrls: ['./taxii-search.component.css', '../bundle/bundle.component.css'],
})
export class TaxiiSearchComponent implements OnInit {
    faServer = faServer;
    faUserFriends = faUserFriends;
    faList = faList;

    faRight = faAngleDoubleRight;

    selectedRoot = '';
    selectedCollection = null;

    roots = [];
    collections = {};

    serverInfo = null;

    globalSearch = false;

    constructor(public stixService: StixService) {}

    ngOnInit() {}

    getAvailableAPIRoots() {
        if (this.stixService.taxiiServerType == 'ais') {
            this.roots = this.stixService.apiRootDetails.filter((a) => a['api-root'] != 'ingest');
            return;
        }

        this.roots = [];
        this.stixService.apiRootDetails?.forEach((root) => {
            this.roots.push(root);
        });
    }

    getAvailableCollections() {
        this.collections = {};
        this.stixService.apiRoots2.forEach((root) => {
            root.collections.forEach((collection) => {
                if (!this.collections[root['apiPath']]) this.collections[root['apiPath']] = [];

                this.collections[root['apiPath']].push(collection);
            });
        });
    }

    setServerInfo(data) {
        this.serverInfo = data;
    }

    selectRoot(root) {
        this.selectedRoot = root;
    }

    selectCollection(collection) {
        console.log(collection);
        this.selectedCollection = collection;
    }

    selectGlobalSearch(bool) {
        this.globalSearch = bool;
    }
}
