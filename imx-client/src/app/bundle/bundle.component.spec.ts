import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleComponent } from './bundle.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from 'src/app/mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BundleTypeFilter } from '../bundle-type-filter.pipe';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('BundleComponent', () => {
    let component: BundleComponent;
    let fixture: ComponentFixture<BundleComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BundleComponent, BundleTypeFilter],
            imports: [RouterTestingModule, MatDialogModule, FormsModule, FontAwesomeModule, NgxPaginationModule],
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
        fixture = TestBed.createComponent(BundleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
