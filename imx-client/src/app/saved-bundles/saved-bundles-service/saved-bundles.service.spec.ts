import { TestBed } from '@angular/core/testing';

import { SavedBundlesService } from './saved-bundles.service';

describe('SavedBundlesService', () => {
    let service: SavedBundlesService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SavedBundlesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
