import { Injectable } from '@angular/core';
import { EnvService } from '../env-service/env.service';
import { KeycloakService } from 'src/app/auth/keycloak-service/keycloak.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class LoggingService {
    private old_page: string = 'n/a';

    constructor(
        private keycloak: KeycloakService,
        private envService: EnvService,
        private http: HttpClient
    ) {}

    public async logEvent(event, resp) {
        if (this.envService.env.keycloak.enabled === true && this.envService.env.logging.enabled === true) {
            this.keycloak.getUserProfile().then(async (user) => {
                let log = this.constructLog(event, resp, user.username);
                let url = this.contructUrl();

                await this.sendLog(url, log);
            });
        } else if (this.envService.env.logging.enabled === true) {
            let log = this.constructLog(event, resp, 'dev-user');
            let url = this.contructUrl();

            await this.sendLog(url, log);
        } else {
            console.warn('Logging disabled');
        }
    }

    async sendLog(url, log) {
        return new Promise((resolve, reject) => {
            try {
                this.http.post(url, log, {}).subscribe((res) => {
                    resolve(res);
                });
            } catch (e) {
                reject(e);
                console.error(e);
            }
        });
    }

    private contructUrl() {
        let url = `${this.envService.env.imxServer.url}/logging/imx.`;
        switch (this.envService.env.environment) {
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
                console.warn(`LOGGING ERROR - Cannot match environment to logging profile: ${this.envService.env.environment}`);
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

        if (event.action === 'page') {
            event.old_page = this.old_page;
            this.old_page = event.new_page;
        }

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
