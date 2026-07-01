import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionsDialogComponent } from './extensions-dialog.component';
import { NgModule } from '@angular/core';
import { StixService } from 'src/app/stix-service.service';
import { MockMatDialogData, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ExtensionsDialogComponent', () => {
    let component: ExtensionsDialogComponent;
    let fixture: ComponentFixture<ExtensionsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ExtensionsDialogComponent],
            imports: [NgbModule, MatDialogModule, FormsModule, FontAwesomeModule],
            providers: [
                {
                    provide: StixService,
                    useClass: MockStixService,
                },
                {
                    provide: KeycloakService,
                    useClass: KeycloakService,
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
        fixture = TestBed.createComponent(ExtensionsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
