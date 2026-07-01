import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GranularMarkingsComponent } from './granular-markings.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GranularMarkingsComponent', () => {
    let component: GranularMarkingsComponent;
    let fixture: ComponentFixture<GranularMarkingsComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GranularMarkingsComponent],
            imports: [MatDialogModule, FormsModule, FontAwesomeModule],
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
        fixture = TestBed.createComponent(GranularMarkingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
