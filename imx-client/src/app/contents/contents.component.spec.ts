import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentsComponent } from './contents.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { UntypedFormControl, UntypedFormGroup, FormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ContentsComponent', () => {
    let component: ContentsComponent;
    let fixture: ComponentFixture<ContentsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ContentsComponent],
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
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ContentsComponent);
        component = fixture.componentInstance;
        component.form = new UntypedFormGroup({ object_ref: new UntypedFormControl('Test--', Validators.required) });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
