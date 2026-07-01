import { TestBed } from '@angular/core/testing';

import { MispStixService } from './misp-stix.service';

describe('MispStixService', () => {
    let service: MispStixService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MispStixService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
