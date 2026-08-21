import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { OidcService } from '../auth/oidc-service/oidc.service';
import { environment } from 'src/environments/environment';
import { Buffer } from 'buffer';

export const initializeApp = (env: EnvService): (() => Promise<boolean>) => {
    return () => env.loadEnv();
};

@Injectable({
    providedIn: 'root',
})
export class EnvService {
    env: any = {};
    init: boolean = false;
    apiInit: boolean = false;
    authenticated: boolean = false;
    apiError: boolean = false;

    keycloakUser: any = {};
    taxiiUser: any = {};
    taxiiUsers: any[] = undefined;
    groupInfo: any = {};

    cert: string;
    certFound: boolean;

    constructor(
        private readonly keycloak: KeycloakService,
        private readonly oidc: OidcService,
        private readonly httpClient: HttpClient
    ) {
        console.info('CONSTRUCTOR ENV SERVICE');
        this.init = false;
    }

    async loadApiEnv() {
        return new Promise((resolve, reject) => {
            this.httpClient.get(`${this.env.imxServer.url}/get-env`, {}).subscribe(
                (data: any) => {
                    if (data.result) {
                        let res = JSON.parse(Buffer.from(data.result, 'base64').toString());

                        for (let field in res) {
                            this.env[field] = res[field];
                        }

                        this.apiInit = true;
                        resolve(true);
                    }
                },
                (error) => {
                    console.error(error);
                    if (this.apiInit) this.apiError = true;
                    resolve(error);
                }
            );
        });
    }

    async loadEnv(): Promise<boolean> {
        this.init = false;
        this.apiInit = false;
        this.authenticated = false;

        return new Promise(async (resolve, reject) => {
            let envJSRes: any = await this.loadEnvAssets();

            for (let field in environment) {
                this.env[field] = environment[field];
            }
            for (let field in envJSRes) {
                this.env[field] = envJSRes[field];
            }

            if (this.env.keycloak?.enabled) {
                console.info('USING KEYCLOAK');
                this.keycloak
                    .init({
                        url: this.env.keycloak.url,
                        realm: this.env.keycloak.realm,
                        clientId: this.env.keycloak.clientId,
                    })
                    .then(async (authenticated) => {
                        console.info('Keycloak authenticated: ', authenticated);
                        this.authenticated = authenticated;

                        this.init = true;
                    })
                    .catch((error) => {
                        console.error('Keycloak initialization failed', error);
                        this.apiError = true;
                    });
            } else if (this.env.oidc?.enabled) {
                console.info('USING OIDC');
                this.oidc
                    .init({
                        apiRoot: this.env.oidc.apiRoot,
                        clientId: this.env.oidc.clientId,
                        clientRoot: `${window.location.origin}/`,
                        clientScope: this.env.oidc.clientScope,
                        stsAuthority: this.env.oidc.stsAuthority,
                        usernameField: this.env.oidc.usernameField,
                    })
                    .then(async () => {
                        this.init = true;
                    })
                    .catch((error) => {
                        console.error('OIDC initialization failed', error);
                        this.apiError = true;
                    });
            } else {
                console.info('USING NO AUTH');
                this.init = true;
            }

            resolve(true);
        });
    }

    async loadEnvAssets() {
        return new Promise((resolve, reject) => {
            this.httpClient.get('/assets/env.json', {}).subscribe(
                (data) => resolve(data),
                (error) => {
                    reject(error);
                }
            );
        });
    }

    async wait(field) {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (this.env[field]) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 100);
        });
    }

    async waitInit() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (this.init) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 100);
        });
    }

    async waitUser() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (this.taxiiUsers !== undefined) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 100);
        });
    }

    async checkAuth(path) {
        return new Promise(async (resolve, reject) => {
            if (this.env.keycloak.enabled === true) {
                try {
                    this.getKeycloakUser()
                        .then((reauth) => {
                            resolve(reauth);
                        })
                        .catch(async (error) => {
                            if (error.status === 0) {
                                await this.logSessionTimeout();
                                await this.keycloak.login({
                                    redirectUri: window.location.origin + path,
                                });
                                resolve(true);
                            } else {
                                console.error(error);
                                reject(error);
                            }
                        });
                } catch (err) {
                    console.error(err);
                    await this.keycloak.login({
                        redirectUri: window.location.origin + path,
                    });
                }
            } else if (this.env.oidc.enabled === true) {
                try {
                    this.getOidcUser()
                        .then((reauth) => {
                            resolve(reauth);
                        })
                        .catch(async (error) => {
                            if (error.status === 0) {
                                await this.logSessionTimeout();
                                // await this.oidc.login();
                                resolve(true);
                            } else {
                                console.error(error);
                                // await this.oidc.login();
                                reject(error);
                            }
                        });
                } catch (err) {
                    console.error(err);
                    // await this.oidc.login();
                }
            } else {
                this.keycloakUser = {
                    preferred_username: 'dev-user',
                };
                resolve(true);
            }
        });
    }

    async getOidcUser(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.oidc.isTokenExpired()) {
                reject(new Error('TOKEN EXPIRED'));
                return;
            }

            this.oidc
                .getUser()
                .then((data) => {
                    if (data?.profile) {
                        let reauth = this.didRolesChange(this.keycloakUser, data.profile);

                        this.keycloakUser = data.profile;
                        localStorage.setItem('keycloakUser', JSON.stringify(data.profile));

                        resolve(reauth);
                        return;
                    }

                    reject(new Error('No profile in user data'));
                })
                .catch((err) => {
                    console.error(err);
                    reject(err);
                });
        });
    }

    async getKeycloakUser(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.keycloak
                .isTokenExpired()
                .then(async (isExpired) => {
                    if (isExpired) {
                        reject(new Error('TOKEN EXPIRED'));
                        return;
                    }

                    this.keycloak
                        .getUserProfile()
                        .then((data) => {
                            data['roles'] = this.keycloak.getUserRoles();
                            let reauth = this.didRolesChange(this.keycloakUser, data);

                            this.keycloakUser = data;
                            this.keycloakUser.preferred_username = data.username;
                            localStorage.setItem('keycloakUser', JSON.stringify(data));

                            resolve(reauth);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    getKeycloakToken(): String | undefined {
        if (this.env.keycloak.enabled) {
            return this.keycloak.getToken();
        }

        return undefined;
    }

    didRolesChange(oldUser, currentUser) {
        if (oldUser.roles === undefined) {
            oldUser = JSON.parse(localStorage.getItem('keycloakUser'));
            if (oldUser === null) return false;
        }

        for (let i in oldUser.roles) {
            if (oldUser.roles[i] !== currentUser.roles[i]) return true;
        }

        return false;
    }

    getUsername(): string {
        if (this.env.keycloak.enabled || this.env.oidc.enabled) {
            return this.keycloakUser.preferred_username;
        }

        return 'dev-user';
    }

    getTaxiiUsers() {
        return new Promise((resolve, reject) => {
            let httpHeaders = new HttpHeaders()
                .set('Accept', 'application/taxii+json;version=2.1')
                .set('Authorization', `Basic ${btoa(this.env.adminServer.username + ':' + this.env.adminServer.password)}`)
                .set('Content-Type', `application/taxii+json;version=2.1`);

            this.getCert(httpHeaders, (header: HttpHeaders) => {
                this.httpClient
                    .get<any>(`${this.env.adminServer.url}admin/${this.env.adminServer.apiVersion}/users`, { headers: header, observe: 'response' })
                    .subscribe(
                        (resp) => {
                            this.taxiiUsers = resp.body;

                            for (let user of this.taxiiUsers) {
                                delete user.password;

                                if (this.keycloakUser.preferred_username === user.user) {
                                    if (this.taxiiUser.roles) {
                                        if (this.taxiiUser.roles.length !== user.roles.length) {
                                            location.reload();
                                        }

                                        for (let i in this.taxiiUser.roles) {
                                            if (this.taxiiUser.roles[i] !== user.roles[i]) {
                                                location.reload();
                                            }
                                        }
                                    }

                                    this.taxiiUser = user;
                                    break;
                                }
                            }

                            if (this.taxiiUser === undefined || this.taxiiUser.roles === undefined) {
                                return resolve(false);
                            }

                            if (!this.taxiiUser.roles.includes('imx-admin')) {
                                for (let group of this.taxiiUser.roles) {
                                    switch (group) {
                                        case 'imx-user':
                                        case 'imx-relay':
                                        case 'imx-admin':
                                            break;
                                        default:
                                            this.groupInfo[group] = [];
                                            for (let user of this.taxiiUsers) {
                                                if (user.roles.includes(group)) {
                                                    this.groupInfo[group].push(user);
                                                }
                                            }
                                    }
                                }
                            } else {
                                let allGroups = this.getAllGroups(this.taxiiUsers);
                                console.debug(`allGroups: ${allGroups}`);

                                for (let group of allGroups) {
                                    this.groupInfo[group] = [];

                                    for (let user of this.taxiiUsers) {
                                        if (!user.roles) continue;

                                        if (user.roles.includes(group)) {
                                            this.groupInfo[group].push(user);
                                        }
                                    }
                                }
                            }
                            resolve(true);
                        },
                        (error) => {
                            reject(error);
                        }
                    );
            });
        });
    }

    getAllGroups(taxiiUsers) {
        let result = [];

        for (let user of taxiiUsers) {
            if (!user.roles) continue;

            for (let role of user.roles) {
                if (result.includes(role)) {
                    continue;
                }

                result.push(role);
            }
        }

        return result;
    }

    getCert(header: HttpHeaders, cb: any) {
        if (this.certFound === true) {
            const newHeader = header.set('Authorization', this.cert);
            cb(newHeader);
            return;
        } else if (this.certFound === false) {
            cb(header);
            return;
        }

        let httpHeaders = new HttpHeaders().set('Authorization', `Basic ${btoa(this.env.imxServer.user + ':' + this.env.imxServer.pass)}`);

        this.httpClient.get<any>(this.env.imxServer.url + '/cert', { headers: httpHeaders }).subscribe(
            (res) => {
                if (res.data) {
                    const newHeader = header.set('Authorization', res.data.pkcs10);
                    this.cert = res.data.pkcs10;
                    this.certFound = true;
                    cb(newHeader);
                } else {
                    console.error('Certification not found, resorting to basic authentication');
                    this.certFound = false;
                    cb(header);
                }
            },
            (err) => {
                console.error('Certification not found, resorting to basic authentication');
                this.certFound = false;
                cb(header);
            }
        );
    }

    async logSessionTimeout() {
        let event = {
            action: 'session_expired_reauth',
            description: 'User is required to reauthenticate',
            url: `${this.env.keycloak.url}`,
        };
        let resp = {
            status: 200,
        };

        if (this.env.keycloak.enabled === true && this.env.logging.enabled === true) {
            this.keycloak.getUserProfile().then(async (user) => {
                let log = this.constructLog(event, resp, user.username);
                let url = this.contructUrl();

                await this.sendLog(url, log);
            });
        } else if (this.env.logging.enabled === true) {
            let log = this.constructLog(event, resp, 'dev-user');
            let url = this.contructUrl();

            await this.sendLog(url, log);
        } else {
            console.warn('Logging disabled');
        }
    }

    private async sendLog(url, log) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(url, log, {}).subscribe((res) => {
                    resolve(res);
                });
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

    private contructUrl() {
        let url = `${this.env.imxServer.url}/logging/imx.`;
        switch (this.env.environment) {
            case 'local': {
                url += 'local';
                break;
            }
            case 'dev':
            case 'ten-dev': {
                url += 'dev';
                break;
            }
            case 'beta': {
                url += 'beta';
                break;
            }
            case 'guided': {
                url += 'guided';
                break;
            }
            case 'staging': {
                url += 'staging';
                break;
            }
            case 'prod': {
                url += 'prod';
                break;
            }
            default: {
                console.warn(`LOGGING ERROR - Cannot match environment to logging profile: ${this.env.environment}`);
            }
        }

        return url;
    }

    private constructLog(event, resp, username) {
        let log = {
            user: username,
            event: event,
            resp: {},
            log_level: '',
        };

        for (let field in resp) {
            if (field === 'status') {
                switch (resp[field]) {
                    case 'pending':
                    case 'completed':
                    case 200:
                        log.log_level = 'SUCCESS';
                        break;
                    case 0:
                    case 400:
                    case 401:
                    case 403:
                    case 404:
                        log.log_level = 'ERROR';
                        break;
                    default:
                        log.log_level = 'UNKNOWN';
                }

                if (isNaN(resp[field])) {
                    log.resp[field] = resp[field];
                } else {
                    log.resp[`http_${field}`] = resp[field];
                }
            } else {
                if (event.action !== 'query') {
                    log.resp[field] = resp[field];
                }
            }
        }

        return log;
    }
}
