import { TestBed } from '@angular/core/testing';

import { DisabledTaxiiService } from './disabled-taxii.service';

describe('DisabledTaxiiService', () => {
    let service: DisabledTaxiiService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DisabledTaxiiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
