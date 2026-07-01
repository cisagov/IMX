import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class AlertSubsService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    getPath = '/get-alert-subs';
    addPath = '/add-alert-sub';
    removePath = '/remove-alert-sub';

    constructor(
        private readonly httpClient: HttpClient,
        private readonly envService: EnvService
    ) {}

    async getAlertSubs(page, sortKey) {
        let size = 15;
        let from = (page - 1) * size;

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getPath}/${sortKey}/${from}/${size}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async addAlertSub(sub) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.addPath}`, sub, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

    async removeAlertSub(docID) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.removePath}/${docID}`, {}, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }
}
