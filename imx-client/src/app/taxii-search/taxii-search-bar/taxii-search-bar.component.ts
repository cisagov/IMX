import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';

@Component({
    selector: 'app-taxii-search-bar',
    standalone: false,
    templateUrl: './taxii-search-bar.component.html',
    styleUrl: './taxii-search-bar.component.css',
})
export class TaxiiSearchBarComponent implements OnInit {
    @Input() currentTab: 'info' | 'query' | 'submission';

    constructor() {}

    ngOnInit() {}
}
