import { Component, OnInit } from '@angular/core';
import { faArrowRight, faArrowLeft, faCog, faAngleUp, faAngleDown, faBell } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-alert-tab',
    templateUrl: './alert-tab.component.html',
    styleUrls: ['./alert-tab.component.css'],
    standalone: false,
})
export class AlertTabComponent implements OnInit {
    faArrowRight = faArrowRight;
    faArrowLeft = faArrowLeft;
    faCog = faCog;
    faAngleUp = faAngleUp;
    faAngleDown = faAngleDown;
    faBell = faBell;

    isLoading: boolean = true;

    currentSearchPage: number = 1;
    totalSearchPages: number = 0;
    rowNumber: number = -1;

    alertResults: any = {};

    sortKey: string = '';
    activeTable: string = 'history';

    constructor(public stixService: StixService) {}

    ngOnInit(): void {
        this.isLoading = false;
    }

    setTable(target) {
        this.activeTable = target;
    }
}
