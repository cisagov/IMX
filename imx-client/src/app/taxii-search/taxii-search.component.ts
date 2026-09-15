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

    constructor(
        public stixService: StixService,
        private envService: EnvService,
        private announcementService: AnnouncementService
    ) {}

    ngOnInit() {}
}
