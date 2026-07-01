import { TestBed } from '@angular/core/testing';

import { CognitoGuard } from './cognito.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth.service';
import { MockAuthService } from 'src/app/mockServices';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('CognitoGuard', () => {
    let guard: CognitoGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule, FormsModule, FontAwesomeModule],
            providers: [
                {
                    provide: AuthService,
                    useClass: MockAuthService,
                },
            ],
        });
        guard = TestBed.inject(CognitoGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
