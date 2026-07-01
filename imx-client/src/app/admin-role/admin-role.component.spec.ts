import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRoleComponent } from './admin-role.component';
import { StixService } from '../stix-service.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminRoleComponent', () => {
    let component: AdminRoleComponent;
    let fixture: ComponentFixture<AdminRoleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminRoleComponent],
            imports: [FormsModule, FontAwesomeModule],
            providers: [
                {
                    provide: StixService,
                    useClass: MockStixService,
                },
                {
                    provide: KeycloakService,
                    useClass: MockKeycloakService,
                },
                NgbActiveModal,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminRoleComponent);
        component = fixture.componentInstance;
        component.apiRootsCollections = [];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
