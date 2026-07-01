import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddComponentComponent } from './add-component.component';
import { ActivatedRoute } from '@angular/router';
import { StixService } from '../stix-service.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockActivatedRoute, MockKeycloakService, MockMatDialogData, MockStixService } from 'src/app/mockServices';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormComponent } from '../dynamic-form-component/dynamic-form/dynamic-form.component';
import { GranularMarkingsComponent } from '../granular-markings/granular-markings.component';
import { ExtensionsComponent } from '../extensions/extensions.component';
import { StringArrayComponent } from '../string-array/string-array.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DynamicFormQuestionComponent } from '../dynamic-form-component/app-question/app-question.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AddComponentComponent', () => {
    let component: AddComponentComponent;
    let fixture: ComponentFixture<AddComponentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                AddComponentComponent,
                DynamicFormComponent,
                GranularMarkingsComponent,
                ExtensionsComponent,
                StringArrayComponent,
                DynamicFormQuestionComponent,
            ],
            imports: [RouterTestingModule, FontAwesomeModule, FormsModule, ReactiveFormsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useClass: MockActivatedRoute,
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
                    provide: MatDialog,
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
        fixture = TestBed.createComponent(AddComponentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
