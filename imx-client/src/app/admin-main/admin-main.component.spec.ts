import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMainComponent } from './admin-main.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminMainComponent', () => {
    let component: AdminMainComponent;
    let fixture: ComponentFixture<AdminMainComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminMainComponent],
            imports: [FormsModule, FontAwesomeModule],
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
        fixture = TestBed.createComponent(AdminMainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
