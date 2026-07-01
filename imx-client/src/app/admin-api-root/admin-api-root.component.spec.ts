import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminApiRootComponent } from './admin-api-root.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminApiRootComponent', () => {
    let component: AdminApiRootComponent;
    let fixture: ComponentFixture<AdminApiRootComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminApiRootComponent],
            imports: [NgbModule, FontAwesomeModule, FormsModule],
            providers: [
                {
                    provide: StixService,
                    useClass: MockStixService,
                },
                {
                    provide: KeycloakService,
                    useClass: MockKeycloakService,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminApiRootComponent);
        component = fixture.componentInstance;
        component.apiRootInput = {};
        component.apiRootCollectionsInput = {};
        component.collectionsForAllApiRoots = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
