import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
//Keycloak
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { EnvService } from '../env-service/env.service';
import { LoggingService } from '../logging-service/logging.service';

@Injectable({
    providedIn: 'root',
})

//Keycloak
export class AuthKeycloak {
    constructor(
        protected readonly router: Router,
        protected readonly keycloak: KeycloakService,
        private readonly envService: EnvService,
        private readonly loggingService: LoggingService
    ) {}

    public async isAccessAllowed(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let loggedIn = this.keycloak.isLoggedIn();

        try {
            let logout = await this.envService.getKeycloakUser();

            if (logout) {
                this.keycloak.logout();
                return false;
            }
        } catch (err) {
            console.error(err);

            if (this.envService.env.keycloak.bearerTokenURLs.includes(this.envService.env.keycloak.url)) {
                loggedIn = false;
            } else if (this.envService.init === true) {
                this.envService.apiError = true;
            }
        }

        // Force the user to log in if currently unauthenticated.
        if (!loggedIn) {
            await this.keycloak.login({
                redirectUri: window.location.origin + state.url,
            });
        }

        let roles = this.keycloak.getUserRoles();

        // Get the roles required from the route.
        if (!this.envService.env.taxiiServer) {
            await this.envService.wait('taxiiServer');
        }

        try {
            if (this.envService.taxiiUsers === undefined) {
                await this.envService.getTaxiiUsers();
                await this.envService.getKeycloakGroups();
            } else {
                await this.envService.getTaxiiUsers();
                this.envService.getKeycloakGroups();
            }
        } catch (err) {
            console.error(err);
        }

        const requiredRoles = [`${this.envService.env.taxiiServer.adminRoleName}`];

        // Not a protected route
        if (!this.envService.env.protectedRoutes.includes(route.data.path)) {
            return true;
        }

        // Allow the user to proceed if all the required roles are present.
        return requiredRoles.every((role) => roles.includes(role));
    }
}
