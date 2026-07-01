import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionsComponent } from './extensions.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialogModule } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ExtensionsComponent', () => {
    let component: ExtensionsComponent;
    let fixture: ComponentFixture<ExtensionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ExtensionsComponent],
            imports: [NgbModule, MatDialogModule, FormsModule, FontAwesomeModule],
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
        fixture = TestBed.createComponent(ExtensionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
