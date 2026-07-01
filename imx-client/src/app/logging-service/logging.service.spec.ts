import { TestBed } from '@angular/core/testing';

import { LoggingService } from './logging.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { MockKeycloakService } from '../mockServices';

describe('LoggingService', () => {
    let service: LoggingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: KeycloakService,
                    useClass: MockKeycloakService,
                },
            ],
        });
        service = TestBed.inject(LoggingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
