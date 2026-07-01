import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryStixComponent } from './query-stix.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StixService } from '../stix-service.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MockKeycloakService, MockStixService } from '../mockServices';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MessagesComponent } from './messages/messages.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('QueryStixComponent', () => {
    let component: QueryStixComponent;
    let fixture: ComponentFixture<QueryStixComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QueryStixComponent, MessagesComponent],
            imports: [RouterTestingModule, ReactiveFormsModule, MatDialogModule, FontAwesomeModule, FormsModule],
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
                    provide: DateTimeAdapter,
                    useclass: DateTimeAdapter,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QueryStixComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
