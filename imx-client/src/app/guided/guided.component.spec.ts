import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuidedComponent } from './guided.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockMatDialogData, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { StringArrayComponent } from '../string-array/string-array.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GuidedMenuComponent } from '../guided-menu/guided-menu.component';
import { BundleComponent } from '../bundle/bundle.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MessagesComponent } from '../query-stix/messages/messages.component';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgModule } from '@angular/core';
import { BundleTypeFilter } from '../bundle-type-filter.pipe';
import { NgxPaginationModule } from 'ngx-pagination';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GuidedComponent', () => {
    let component: GuidedComponent;
    let fixture: ComponentFixture<GuidedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuidedComponent, GuidedMenuComponent, BundleComponent, MessagesComponent, BundleTypeFilter, StringArrayComponent],
            imports: [NgbModule, FormsModule, FontAwesomeModule, RouterTestingModule, NgxPaginationModule],
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
                    provide: MatDialog,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: MockMatDialogData,
                },
                NgModule,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuidedComponent);
        component = fixture.componentInstance;
        component.objectMarking = jasmine.createSpyObj('StringArrayComponent', ['getTlpOptions']);
        component.objectMarking.tlp_options = [];
        component.guidedBundle = jasmine.createSpyObj('BundleComponent', ['refreshApiRootsCollections']);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
