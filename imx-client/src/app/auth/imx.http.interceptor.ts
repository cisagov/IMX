import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { tap } from 'rxjs';
import { EnvService } from 'src/app/env-service/env.service';
import { LoggingService } from 'src/app/logging-service/logging.service';
import { KeycloakService } from './keycloak-service/keycloak.service';
import { OidcService } from './oidc-service/oidc.service';

@Injectable()
export class ImxHttpInterceptor implements HttpInterceptor {
    constructor(
        private readonly envService: EnvService,
        private readonly loggingService: LoggingService,
        private readonly keycloakService: KeycloakService,
        private readonly oidcService: OidcService
    ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.envService.init === false) return next.handle(req);

        this.envService.checkAuth(window.location.pathname);

        let log = {
            reqUrl: req.url,
            reqBody: JSON.stringify(req.body),
            reqMethod: req.method,
            reqHeaders: JSON.stringify(req.headers),
            origin: `${window.location.origin}${window.location.pathname}`,
            authType: 'Basic',
            user: undefined,
            resStatus: undefined,
            resTime: undefined,
            resBody: undefined,
            resMessage: undefined,
        };

        if (this.envService.env.keycloak.enabled) {
            let found = false;
            for (let url of this.envService.env.keycloak.bearerTokenURLs) {
                if (req.url?.includes(url)) {
                    found = true;
                    break;
                }
            }

            const token = this.envService.getKeycloakToken();
            log.user = this.keycloakService.getUsername();
            if (found && token) {
                const newReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                log.authType = 'Bearer';

                return this.nextReturn(newReq, next, log);
            }
        } else if (this.envService.env.oidc.enabled) {
            let found = false;
            for (let url of this.envService.env.oidc.bearerTokenURLs) {
                if (req.url?.includes(url)) {
                    found = true;
                    break;
                }
            }

            const token = this.oidcService.getToken();
            log.user = this.oidcService.getUsername();
            if (found && token) {
                const newReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                log.authType = 'Bearer';

                return this.nextReturn(newReq, next, log);
            }
        }

        return this.nextReturn(req, next, log);
    }

    private nextReturn(req, next, log) {
        const startTime = performance.now();

        return next.handle(req).pipe(
            tap((event) => {
                if (event instanceof HttpResponse) {
                    const elapsed = performance.now() - startTime;

                    log.resTime = `${elapsed} ms`;
                    log.resStatus = event.status;
                    log.resBody = JSON.stringify(event.body);

                    if (log.resStatus === 403 && log.resBody.includes('CISA')) delete log.reqBody;

                    this.logIntercept(req, log);
                }
            }),
            catchError((error) => {
                console.error(error);
                const elapsed = performance.now() - startTime;

                log.resTime = `${elapsed} ms`;
                log.resStatus = error.status || 500;
                log.resMessage = error.message || error.statusText || 'No Error Message';

                if (log.resStatus === 403 && log.resBody.includes('CISA')) delete log.reqBody;

                this.logIntercept(req, log);

                throw error;
            })
        );
    }

    private logIntercept(req, log) {
        let loggingURL = `${this.envService.env.imxServer.url}/logging/imx.client`;

        if (!req.url.includes(`${this.envService.env.imxServer.url}/logging`)) {
            this.loggingService.sendLog(loggingURL, log);
        }
    }
}
