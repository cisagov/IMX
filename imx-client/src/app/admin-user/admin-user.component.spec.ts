import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserComponent } from './admin-user.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminUserComponent', () => {
    let component: AdminUserComponent;
    let fixture: ComponentFixture<AdminUserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminUserComponent],
            imports: [FontAwesomeModule, FormsModule],
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
        fixture = TestBed.createComponent(AdminUserComponent);
        component = fixture.componentInstance;
        component.userInput = 'test';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
