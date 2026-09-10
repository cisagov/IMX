import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { EnvService } from '../env-service/env.service';
import { OidcService } from './oidc-service/oidc.service';

@Injectable({
    providedIn: 'root',
})
export class AuthOidc {
    constructor(
        protected readonly router: Router,
        protected readonly oidc: OidcService,
        private readonly envService: EnvService
    ) {}

    public async isAccessAllowed(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let loggedIn = await this.oidc.isLoggedIn();

        // try {
        //     if (!loggedIn) {
        //         await this.oidc.logout();
        //         return false;
        //     }
        // } catch (err) {
        //     console.error(err);
        // }

        // Force the user to log in if currently unauthenticated.
        if (!loggedIn) {
            await this.oidc.login();
        }

        let roles = this.oidc.getRoles();

        // Get the roles required from the route.
        if (!this.envService.env.taxiiServer) {
            await this.envService.wait('taxiiServer');
        }

        try {
            if (this.envService.taxiiUsers === undefined) await this.envService.getTaxiiUsers();
            else this.envService.getTaxiiUsers();
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
