import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringArrayDialogComponent } from './string-array-dialog.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MockKeycloakService, MockMatDialogData, MockStixService } from 'src/app/mockServices';
import { StixService } from 'src/app/stix-service.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('StringArrayDialogComponent', () => {
    let component: StringArrayDialogComponent;
    let fixture: ComponentFixture<StringArrayDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [StringArrayDialogComponent],
            imports: [FontAwesomeModule, FormsModule, ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: StixService,
                    useClass: MockStixService,
                },
                {
                    provide: KeycloakService,
                    useClass: MockKeycloakService,
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
        fixture = TestBed.createComponent(StringArrayDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
