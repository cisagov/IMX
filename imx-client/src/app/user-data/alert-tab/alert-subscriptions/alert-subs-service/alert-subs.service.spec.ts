import { TestBed } from '@angular/core/testing';

import { AlertSubsService } from './alert-subs.service';

describe('AlertSubsService', () => {
    let service: AlertSubsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AlertSubsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
