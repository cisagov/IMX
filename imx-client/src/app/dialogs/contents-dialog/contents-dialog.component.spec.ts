import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentsDialogComponent } from './contents-dialog.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from 'src/app/stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, FormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ContentsDialogComponent', () => {
    let component: ContentsDialogComponent;
    let fixture: ComponentFixture<ContentsDialogComponent>;
    const formBuild: UntypedFormBuilder = new UntypedFormBuilder();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ContentsDialogComponent],
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
        fixture = TestBed.createComponent(ContentsDialogComponent);
        component = fixture.componentInstance;
        component.form = new UntypedFormGroup({ object_ref: new UntypedFormControl('Test--', Validators.required) });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
