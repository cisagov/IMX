import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormComponent } from './dynamic-form.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockActivatedRoute, MockKeycloakService, MockQuestionControlService, MockStixService } from 'src/app/mockServices';
import { StixService } from 'src/app/stix-service.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { QuestionControlService } from '../question-control.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DynamicFormComponent', () => {
    let component: DynamicFormComponent;
    let fixture: ComponentFixture<DynamicFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DynamicFormComponent],
            imports: [RouterTestingModule, FormsModule, FontAwesomeModule, ReactiveFormsModule],
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
                    provide: QuestionControlService,
                    useClass: MockQuestionControlService,
                },
                {
                    provide: ActivatedRoute,
                    useClass: MockActivatedRoute,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DynamicFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
