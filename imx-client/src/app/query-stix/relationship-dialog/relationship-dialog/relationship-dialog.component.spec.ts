import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationshipDialogComponent } from './relationship-dialog.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from 'src/app/stix-service.service';
import { MockKeycloakService, MockMatDialogData, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RelationshipDialogComponent', () => {
    let component: RelationshipDialogComponent;
    let fixture: ComponentFixture<RelationshipDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RelationshipDialogComponent],
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
                    useValue: { source: { id: 'TestSource' }, target: { id: 'TestTarget' }, options: [] },
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RelationshipDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
