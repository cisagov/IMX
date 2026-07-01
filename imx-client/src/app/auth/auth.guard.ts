import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthKeycloak } from './auth.keycloak';
import { AuthOidc } from './auth.oidc';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})

//Cognito
export class AuthGuard {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly envService: EnvService,
        private readonly authKeycloak: AuthKeycloak,
        private readonly authOidc: AuthOidc
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
        return new Promise((resolve, reject) => {
            this.envService
                .waitInit()
                .then(async () => {
                    if (this.envService.env.keycloak.enabled === true) {
                        let keycloakRes = await this.authKeycloak.isAccessAllowed(route, state);
                        if (!keycloakRes) {
                            this.router.navigate(['home']);
                        }

                        resolve(keycloakRes);
                    }

                    if (this.envService.env.oidc.enabled === true) {
                        let oidcRes = await this.authOidc.isAccessAllowed(route, state);
                        if (!oidcRes) {
                            this.router.navigate(['home']);
                        }

                        resolve(oidcRes);
                    }

                    if (!this.authService.isAuthenticated) this.router.navigate(['login']);

                    resolve(this.authService.isAuthenticated);
                })
                .catch((err) => {
                    console.error(err);
                    reject(new Error('EnvService not started properly. Stopping canActivate()'));
                });
        });
    }
}
