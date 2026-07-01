import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { StixService } from './stix-service.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MockKeycloakService } from './mockServices';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('StixService', () => {
    let service: StixService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FontAwesomeModule, FormsModule],
            providers: [
                {
                    provide: KeycloakService,
                    useValue: MockKeycloakService,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(StixService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Taxii server should be default', () => {
        expect(service.taxiiServerType).toBe('default');
    });
});
