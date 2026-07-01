import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringArrayComponent } from './string-array.component';
import { MatDialogModule } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { STRING_ARRAY_VALIDATORS } from '../dynamic-form-component/string-array-validators';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('StringArrayComponent', () => {
    let component: StringArrayComponent;
    let fixture: ComponentFixture<StringArrayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [StringArrayComponent],
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
        fixture = TestBed.createComponent(StringArrayComponent);
        component = fixture.componentInstance;
        component.key = 'labels';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
