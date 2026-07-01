import { TestBed } from '@angular/core/testing';

import { OidcService } from './oidc.service';

describe('OidcService', () => {
    let service: OidcService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(OidcService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
