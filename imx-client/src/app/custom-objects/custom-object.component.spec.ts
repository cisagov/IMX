import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomObjectComponent } from './custom-object.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterTestingModule } from '@angular/router/testing';
import { StixService } from '../stix-service.service';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CustomObjectComponent', () => {
    let component: CustomObjectComponent;
    let fixture: ComponentFixture<CustomObjectComponent>;
    let localStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomObjectComponent],
            imports: [NgbModule, RouterTestingModule, FormsModule, FontAwesomeModule],
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
        const mockStorage = {
            'item-to-edit': JSON.stringify({
                id: 'domains--4abacc22-0ed0-4fa8-8685-7789f1bcf423',
                extensions: 'extensions',
                type: 'domains',
            }),
            customObjects: JSON.stringify({
                arr: [],
            }),
            identities: JSON.stringify({
                arr: [
                    {
                        confidence: 100,
                        created: '2022-09-06T22:54:13.599Z',
                        description: 'Cybersecurity and Infrastructure Security Agency Dev Identity.',
                        id: 'identity--b1160532-b8f3-4cfa-9b7d-423e253fbc59',
                        identity_class: 'organization',
                        lang: 'en',
                        modified: '2022-09-06T22:54:13.599Z',
                        name: 'CISA Dev',
                        object_marking_refs: ['marking-definition--94868c89-83c2-464b-929b-a1a8aa3c8487'],
                        spec_version: '2.1',
                        type: 'identity',
                    },
                ],
            }),
        };
        const mockLocalStorage = {
            getItem: function (key: string) {
                return key in mockStorage ? mockStorage[key] : null;
            },
            setItem: function (key: string, value: string) {
                mockStorage[key] = value;
            },
            removeItem: function (key: string) {
                delete mockStorage[key];
            },
        };
        fixture = TestBed.createComponent(CustomObjectComponent);
        component = fixture.componentInstance;
        component.queryParams = { revocation: true };
        component.objectPropertyTypeSelectionInput = 'required';
        component.customObjType = 'new-sco';
        spyOn(window.localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
        spyOn(window.localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
        spyOn(window.localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
