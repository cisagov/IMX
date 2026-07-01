import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class IdentifyStixService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    postPath = '/identify-stix';
    postPathVt = '/identify-stix-vt';
    postFilePath = '/identify-stix-file';

    constructor(
        private httpClient: HttpClient,
        private envService: EnvService
    ) {}

    async postIdentifyStix(text) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            text: text,
        };

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.postPath}`, body, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    async postIdentifyStixFile(formData, fileName) {
        if (this.headers['Content-Type']) delete this.headers['Content-Type'];

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.put(`${this.imxServerUrl}${this.postFilePath}/${fileName}`, formData, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    async postIdentifyStixVirusTotal(text) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            text: text,
        };

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.postPathVt}`, body, { headers: this.headers }).subscribe(
                    (data) => resolve(data),
                    (error) => resolve(error)
                );
            } catch (e) {
                reject(e);
            }
        });
    }
}
