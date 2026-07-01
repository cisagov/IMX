import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormQuestionComponent } from './app-question.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from 'src/app/stix-service.service';
import { MockActivatedRoute, MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { ActivatedRoute } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuestionBase } from '../question-base';
import { TextboxQuestion } from '../question-types/question-textbox';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DynamicFormQuestionComponent', () => {
    let component: DynamicFormQuestionComponent;
    let fixture: ComponentFixture<DynamicFormQuestionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DynamicFormQuestionComponent],
            imports: [NgbModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
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
                    provide: ActivatedRoute,
                    useClass: MockActivatedRoute,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DynamicFormQuestionComponent);
        component = fixture.componentInstance;
        component.form = new UntypedFormGroup({});
        component.question = new QuestionBase();
        window.history.pushState({ data: { new_version: true } }, '', '');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
