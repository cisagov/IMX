import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class MispStixService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    postPath = '/misp-to-stix';

    constructor(
        private httpClient: HttpClient,
        private envService: EnvService
    ) {}

    async mispToStix(text) {
        this.headers['Content-Type'] = 'application/json';
        return new Promise((resolve, reject) => {
            try {
                let body = JSON.parse(text);
                this.httpClient.post(`${this.imxServerUrl}${this.postPath}`, body, { headers: this.headers }).subscribe(
                    (data: any) => {
                        return resolve(data.data);
                    },
                    (error) => {
                        return resolve(error);
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    stixToMisp(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const httpHeaders = new HttpHeaders({
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
                });

                const url = `${this.envService.env.imxServer.url}/stix-to-misp`;
                this.httpClient.post(url, data, { headers: httpHeaders }).subscribe({
                    next: (resp: any) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    },
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
