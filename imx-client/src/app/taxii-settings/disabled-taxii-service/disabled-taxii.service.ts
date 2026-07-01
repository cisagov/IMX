import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class DisabledTaxiiService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    getPath = 'get-disabled-taxii';
    postPath = 'add-disabled-taxii';
    deletePath = 'delete-disabled-taxii';

    constructor(
        private readonly httpClient: HttpClient,
        private readonly envService: EnvService
    ) {}

    async getDisabledTaxiiServers(page) {
        let from = (page - 1) * 15;

        return new Promise((resolve, reject) => {
            this.httpClient.get(`${this.imxServerUrl}/${this.getPath}/na/${from}/15`, { headers: this.headers }).subscribe({
                next: (data) => {
                    let temp: any = data;

                    if (temp.status === 200) {
                        resolve(data);
                    } else if (temp.status === 404) {
                        temp = {
                            status: 404,
                            data: {
                                hits: {
                                    hits: [],
                                },
                            },
                        };
                        resolve(temp);
                    } else {
                        reject(new Error('Response status not as expected'));
                    }
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }

    async addDisabledTaxiiServer(taxiiServer) {
        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}/${this.postPath}/`, taxiiServer, { headers: this.headers }).subscribe({
                next: (data) => {
                    let temp: any = data;

                    if (temp.status === 201) {
                        resolve(data);
                    } else {
                        reject(new Error('Response status not as expected'));
                    }
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }

    async deleteDisabledTaxiiServer(id) {
        return new Promise((resolve, reject) => {
            this.httpClient.delete(`${this.imxServerUrl}/${this.deletePath}/${id}`, { headers: this.headers }).subscribe({
                next: (data) => {
                    resolve(data);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }
}
