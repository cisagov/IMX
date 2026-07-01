import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCollectionComponent } from './admin-collection.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AdminCollectionComponent', () => {
    let component: AdminCollectionComponent;
    let fixture: ComponentFixture<AdminCollectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminCollectionComponent],
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
        fixture = TestBed.createComponent(AdminCollectionComponent);
        component = fixture.componentInstance;
        component.collectionInput = {};
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
