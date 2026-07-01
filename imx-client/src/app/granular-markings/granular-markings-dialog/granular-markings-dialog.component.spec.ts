import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GranularMarkingsDialogComponent } from './granular-markings-dialog.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from 'src/app/stix-service.service';
import { MockKeycloakService, MockMatDialogData, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GranularMarkingsDialogComponent', () => {
    let component: GranularMarkingsDialogComponent;
    let fixture: ComponentFixture<GranularMarkingsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GranularMarkingsDialogComponent],
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
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: MockMatDialogData,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GranularMarkingsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
