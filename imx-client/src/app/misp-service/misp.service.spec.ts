import { TestBed } from '@angular/core/testing';

import { MispService } from './misp.service';

describe('MispService', () => {
    let service: MispService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MispService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
