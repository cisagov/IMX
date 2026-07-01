import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Analyst1DialogComponent } from './analyst1-dialog.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from 'src/app/stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('Analyst1DialogComponent', () => {
    let component: Analyst1DialogComponent;
    let fixture: ComponentFixture<Analyst1DialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [Analyst1DialogComponent],
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
        fixture = TestBed.createComponent(Analyst1DialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
