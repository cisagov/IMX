import { Injectable } from '@angular/core';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly poolData = {
        UserPoolId: this.envService.env.cognito.userPoolId,
        ClientId: this.envService.env.cognito.appClientId,
    };

    private sessionUserAttributes = null;

    constructor(private readonly envService: EnvService) {}

    get isAuthenticated(): boolean {
        if (this.envService.env.keycloak.enabled === true || this.envService.env.oidc.enabled === true) {
            return true;
        }

        if (this.envService.env.cognito.enabled === false) {
            return true;
        }

        switch (this.envService.env.cognito.userPoolId) {
            case '':
            case 'n/a':
            case 'Not Needed':
                return true;
        }

        let isAuth = false;

        return isAuth;
    }

    login(email: string, password: string) {
        console.info('login');
    }

    logout() {
        console.info('logout');
    }

    isAdmin() {
        return true;
    }

    handleNewPassword(newPassword: string): Promise<any> {
        return new Promise((resolve, reject) => {
            console.info('handleNewPassword');
            reject(new Error('Not in use'));
        });
    }
}
