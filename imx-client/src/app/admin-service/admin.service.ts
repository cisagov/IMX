import { Injectable } from '@angular/core';
import { EnvService } from '../env-service/env.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { StixService } from '../stix-service.service';

type User = {
    user: string;
    authType: string;
    password?: string;
    roles: string[];
};

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    currentUser = null;

    constructor(
        private readonly httpClient: HttpClient,
        private announcementService: AnnouncementService,
        private stixService: StixService,
        private envService: EnvService
    ) {}

    getTaxiiUsers(): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const imxHttpHeaders = new HttpHeaders()
                    .set('Accept', 'application/json')
                    .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`)
                    .set('Content-Type', `application/json`);

                const taxiiHttpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
                    .set('Content-Type', `application/taxii+json;version=2.1`);

                await this.envService.checkAuth('/admin');

                const url = `${this.stixService.getBaseURLs().baseAdminURL}users`;

                this.httpClient.get(url, { headers: taxiiHttpHeaders }).subscribe({
                    next: async (result: User[]) => {
                        try {
                            let users;

                            if (Array.isArray(result)) {
                                users = result;

                                users.forEach((usr) => {
                                    if (usr.user?.startsWith('CN=')) usr.authType = 'Cert';
                                    else usr.authType = 'Basic';
                                });
                            } else users = [];

                            return resolve(users);
                        } catch (e) {
                            return reject(e);
                        }
                    },
                    error: (err) => {
                        return reject(err);
                    },
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

    getKeycloakUsers(): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.envService.checkAuth('/admin');

                const imxHttpHeaders = new HttpHeaders()
                    .set('Accept', 'application/json')
                    .set('Authorization', `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`)
                    .set('Content-Type', `application/json`);

                const taxiiHttpHeaders = new HttpHeaders()
                    .set('Accept', 'application/taxii+json;version=2.1')
                    .set('Authorization', `Basic ${btoa(this.envService.env.adminServer.username + ':' + this.envService.env.adminServer.password)}`)
                    .set('Content-Type', `application/taxii+json;version=2.1`);

                const url = `${this.envService.env.imxServer.url}/sso-users`;

                this.httpClient.get(url, { headers: imxHttpHeaders }).subscribe({
                    next: (result: any) => {
                        if (!result.data) return resolve([]);

                        result.data.forEach((user) => {
                            user.authType = 'SSO';
                        });

                        return resolve(result.data);
                    },
                    error: (err) => {
                        return resolve([]);
                    },
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

    getAllUsers(): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const taxiiUsers = await this.getTaxiiUsers();
                const keycloakUsers = await this.getKeycloakUsers();

                return resolve([...taxiiUsers, ...keycloakUsers]);
            } catch (e) {
                return reject(e);
            }
        });
    }

    addUser() {
        this.currentUser = {};
    }

    editUser(user) {
        this.currentUser = user;
    }
}
