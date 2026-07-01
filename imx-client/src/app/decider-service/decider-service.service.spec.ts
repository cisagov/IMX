import { TestBed } from '@angular/core/testing';

import { DeciderServiceService } from './decider-service.service';

describe('DeciderServiceService', () => {
    let service: DeciderServiceService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DeciderServiceService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
