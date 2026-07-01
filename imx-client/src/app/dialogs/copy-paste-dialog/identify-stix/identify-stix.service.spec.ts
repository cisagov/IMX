import { TestBed } from '@angular/core/testing';

import { IdentifyStixService } from './identify-stix.service';

describe('IdentifyStixService', () => {
    let service: IdentifyStixService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IdentifyStixService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
