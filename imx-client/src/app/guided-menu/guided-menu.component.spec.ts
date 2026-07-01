import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuidedMenuComponent } from './guided-menu.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { StixService } from '../stix-service.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GuidedMenuComponent', () => {
    let component: GuidedMenuComponent;
    let fixture: ComponentFixture<GuidedMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuidedMenuComponent],
            imports: [FormsModule, FontAwesomeModule],
            providers: [
                {
                    provide: KeycloakService,
                    useClass: MockKeycloakService,
                },
                {
                    provide: StixService,
                    useClass: MockStixService,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuidedMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
