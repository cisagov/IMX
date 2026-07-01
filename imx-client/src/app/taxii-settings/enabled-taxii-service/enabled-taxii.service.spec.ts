import { TestBed } from '@angular/core/testing';

import { EnabledTaxiiService } from './enabled-taxii.service';

describe('EnabledTaxiiService', () => {
    let service: EnabledTaxiiService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EnabledTaxiiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
