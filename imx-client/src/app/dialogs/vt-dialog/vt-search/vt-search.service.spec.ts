import { TestBed } from '@angular/core/testing';

import { VtSearchService } from './vt-search.service';

describe('VtSearchService', () => {
    let service: VtSearchService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(VtSearchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
