import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    getPath: string = '/get-alerts';
    getUnreadPath: string = '/get-unread-alerts';
    getStatusPath: string = '/get-status';
    updatePath: string = '/update-alert';

    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    constructor(
        private readonly httpClient: HttpClient,
        private readonly envService: EnvService
    ) {}

    async getAlerts(page, sortKey) {
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

    async getUnreadAlerts() {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getUnreadPath}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getStatus(alertObj) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.getStatusPath}`, alertObj, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async updateAlert(alert) {
        let doc = alert._source;
        let docID = alert._id;

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.updatePath}/${docID}`, doc, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
