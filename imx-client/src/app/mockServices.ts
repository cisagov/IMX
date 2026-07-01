import { KeycloakService } from 'keycloak-angular';
import { StixService } from './stix-service.service';
import { AuthService } from './auth/auth.service';
import { QuestionControlService } from './dynamic-form-component/question-control.service';
import { of } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { Injectable } from '@angular/core';
import { Bundle } from './models/bundle';

@Injectable({
    providedIn: 'root',
})
export class MockStixService extends StixService {
    bundle: Bundle = {
        type: 'bundle',
        id: '',
        objects: [
            {
                id: 'identity--b1160532-b8f3-4cfa-9b7d-423e253fbc59',
                type: 'identity',
            },
        ],
    };
}

@Injectable({
    providedIn: 'root',
})
export class MockKeycloakService extends KeycloakService {}

@Injectable({
    providedIn: 'root',
})
export class MockAuthService extends AuthService {}

@Injectable()
export class MockQuestionControlService extends QuestionControlService {}

export class MockActivatedRoute {
    public paramMap = of(
        convertToParamMap({
            testId: 'test',
            anotherId: 'd31e8b48-7309-4c83-9884-4142efdf7271',
        })
    );

    queryParams = of({ abc: 'testABC' });

    snapshot = { paramMap: convertToParamMap({ 'component-id': 'url' }) };
}

export const MockMatDialogData = {
    selectors: [],
    lang: '',
    marking_ref: '',
};
