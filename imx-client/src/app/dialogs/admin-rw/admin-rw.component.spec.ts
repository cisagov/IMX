import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRwComponent } from './admin-rw.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from 'src/app/stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminRwComponent', () => {
    let component: AdminRwComponent;
    let fixture: ComponentFixture<AdminRwComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminRwComponent],
            imports: [FontAwesomeModule, FormsModule],
            providers: [
                NgbActiveModal,
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
        fixture = TestBed.createComponent(AdminRwComponent);
        component = fixture.componentInstance;
        component.rw = {
            cId: 'Test',
        };
        component.newRW = true;
        component.collectionTitle = 'Test';
        component.collectionsForAllApiRoots = [];
        component.collectionsExisting = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
