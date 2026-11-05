import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import type { KeycloakConfig, KeycloakInitOptions, KeycloakProfile } from 'keycloak-js';

export interface KeycloakBootstrapConfig extends KeycloakInitOptions {
    url: string;
    realm: string;
    clientId: string;
    enableLogging?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class KeycloakService {
    private kc = undefined;
    private config = undefined;
    private initialized: boolean = false;
    private kcUser = undefined;

    async init(config: KeycloakBootstrapConfig): Promise<boolean> {
        if (this.initialized) {
            return this.kc.authenticated;
        }
        const kcConfig: KeycloakConfig = {
            url: config.url,
            realm: config.realm,
            clientId: config.clientId,
        };

        this.config = kcConfig;
        this.kc = new Keycloak(kcConfig);

        await this.kc.init({
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
            flow: 'standard',
            checkLoginIframe: false,
            scope: 'openid',
        });

        this.initialized = this.kc.didInitialize;

        if (!this.isLoggedIn()) {
            this.kc.login();
        }
        this.setUser();

        return this.kc.authenticated;
    }

    async setUser() {
        this.kcUser = await this.getUserProfile();
    }

    getUsername() {
        return this.kcUser?.username || undefined;
    }

    isLoggedIn(): boolean {
        return !!this.kc?.authenticated;
    }

    async login(options?) {
        return this.kc.login(options);
    }

    async logout(redirectUri?: string) {
        return this.kc.logout({ redirectUri });
    }

    async resetPassword() {
        window.open(`${this.config.url}/realms/${this.config.realm}/account`, '_blank');
    }

    getToken(): String | undefined {
        return this.kc?.token ?? undefined;
    }

    async refreshToken() {
        try {
            this.kc?.updateToken(-1);
        } catch (err) {
            console.error('Failed to refresh token:', err);
        }
    }

    async isTokenExpired(): Promise<boolean> {
        await this.refreshToken();
        return await this.kc?.isTokenExpired();
    }

    async getUserProfile(): Promise<KeycloakProfile | undefined> {
        if (!this.kc || !this.kc.authenticated) return undefined;
        return this.kc.loadUserProfile();
    }

    getUserRoles(includeClientRoles = true): string[] {
        if (!this.kc) {
            console.debug('kc is undefined');
            return [];
        }

        const realmRoles = this.kc.realmAccess?.roles ?? [];
        const clientRoles = includeClientRoles ? Object.values(this.kc.resourceAccess ?? {}).flatMap((r: any) => r.roles ?? []) : [];

        return [...realmRoles, ...clientRoles];
    }
}
