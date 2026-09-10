import { Injectable } from '@angular/core';
import { User, UserManager } from 'oidc-client-ts';
import { Router } from '@angular/router';

export interface OidcBootstrapConfig {
    apiRoot: string;
    clientId: string;
    clientRoot: string;
    clientScope: string;
    stsAuthority: string;
    usernameField: string;
}

@Injectable({
    providedIn: 'root',
})
export class OidcService {
    userManager: UserManager;

    private oidcUser: User = undefined;
    private initialized: boolean = false;
    private apiRoot: string = '';
    private usernameField: string = '';

    constructor(private readonly router: Router) {}

    getRoles(): string[] {
        try {
            let userInfo = JSON.parse(this.parseToken());

            if (userInfo?.realm_access?.roles) {
                return userInfo.realm_access.roles;
            }

            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    getToken() {
        return this.oidcUser?.access_token || null;
    }

    async getUser(): Promise<User | null> {
        try {
            let user = await this.userManager.getUser();
            this.oidcUser = user;

            if (user === null) return null;

            if (user?.profile) user.profile['roles'] = this.getRoles();
            this.oidcUser = user;

            return user;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    getUsername() {
        try {
            if (this.oidcUser?.profile) return this.oidcUser.profile[`${this.usernameField}`];

            return null;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async init(config: OidcBootstrapConfig): Promise<boolean> {
        try {
            this.initialized = localStorage.getItem('oidc_init') === 'true';
        } catch (err) {
            console.error(err);
            this.initialized = false;
        }
        const settings = {
            authority: config.stsAuthority,
            client_id: config.clientId,
            redirect_uri: `${config.clientRoot}signin-callback`,
            silent_redirect_uri: `${config.clientRoot}silent-callback.html`,
            post_logout_redirect_uri: `${config.clientRoot}`,
            response_type: 'code',
            scope: config.clientScope,
        };
        this.apiRoot = config.apiRoot;
        this.usernameField = config.usernameField;

        this.userManager = new UserManager(settings);

        if (this.initialized === true && window.location.href.includes('signin-callback')) {
            await this.userManager.signinCallback();
            this.router.navigate(['']);
        }

        this.initialized = true;
        localStorage.setItem('oidc_init', 'true');
        let authenticated = await this.isLoggedIn();

        if (!authenticated && !window.location.href.includes('signin-callback')) {
            this.login();
        }

        return authenticated;
    }

    isLoggedIn(): Promise<boolean> {
        return new Promise((resolve) => {
            this.getUser()
                .then((user) => {
                    if (user?.access_token) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    resolve(true);
                });
        });
    }

    async isTokenExpired(): Promise<boolean> {
        try {
            const user = await this.renewToken();
            return user.expired;
        } catch (err) {
            console.error(err);
            return true;
        }
    }

    login(): Promise<void> {
        return this.userManager.signinRedirect();
    }

    logout(): Promise<void> {
        return this.userManager.signoutRedirect();
    }

    parseToken() {
        let token = this.getToken();

        if (token === null) return null;

        let base64 = token.split('.')[1];
        let payload = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));

        return payload;
    }

    renewToken(): Promise<User | null> {
        return this.userManager.signinSilent();
    }
}
