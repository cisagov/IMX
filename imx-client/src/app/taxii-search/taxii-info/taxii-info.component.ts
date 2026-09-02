import { Component } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-taxii-info',
    standalone: false,
    templateUrl: './taxii-info.component.html',
    styleUrls: ['./taxii-info.component.css', '../../dashboard/dashboard.component.css'],
})
export class TaxiiInfoComponent {
    faSearch = faSearch;

    roots = [
        { title: 'test1', versions: ['application/taxii+json;version=2.0', 'application/taxii+json;version=2.1'], description: 'api root test 1' },
        { title: 'test2', versions: ['application/taxii+json;version=2.0', 'application/taxii+json;version=2.1'], description: 'api root test 2' },
        { title: 'test3', versions: ['application/taxii+json;version=2.0', 'application/taxii+json;version=2.1'], description: 'api root test 3' },
    ];
    collections = {
        test1: [
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll1',
                can_read: true,
                can_write: true,
                description: 'Testing collection 1',
                alias: 'coll1',
                media_types: ['application/stix+json'],
            },
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll2',
                can_read: true,
                can_write: false,
                description: 'Testing collection 2',
                alias: 'coll2',
                media_types: ['application/stix+json'],
            },
        ],
        test2: [
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll3',
                can_read: true,
                can_write: true,
                description: 'Testing collection 3',
                alias: 'coll3',
                media_types: ['application/stix+json'],
            },
        ],
        test3: [
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll4',
                can_read: true,
                can_write: true,
                description: 'Testing collection 4',
                alias: 'coll4',
                media_types: ['application/stix+json'],
            },
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll5',
                can_read: false,
                can_write: true,
                description: 'Testing collection 5',
                alias: 'coll5',
                media_types: ['application/stix+json'],
            },
            {
                id: '1d184030-460e-4bbe-9dbb-c220c245483a',
                title: 'coll6',
                can_read: false,
                can_write: false,
                description: 'Testing collection 6',
                alias: 'coll6',
                media_types: ['application/stix+json'],
            },
        ],
    };

    selectedRoot = '';
    selectedColl = '';
    constructor() {}

    selectRoot(root: string) {
        this.selectedRoot = root;
    }
}
