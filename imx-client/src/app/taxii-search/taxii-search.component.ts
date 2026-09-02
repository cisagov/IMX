import { Component, OnInit, signal } from '@angular/core';
import { faServer, faUserFriends, faList } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';

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

    expandSidebar = false;

    currentTab = signal<'info' | 'query' | 'submission'>('info');

    constructor() {}

    ngOnInit() {}

    enableSidebar() {
        this.expandSidebar = true;
    }

    disableSidebar() {
        this.expandSidebar = false;
    }

    setTab(tab: 'info' | 'query' | 'submission') {
        this.currentTab.set(tab);
    }
}
