import { Injectable } from '@angular/core';
import { EnvService } from 'src/app/env-service/env.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class VtSearchService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    getHashPath = '/get-hash';
    getHashTtpPath = '/get-hash-ttp';
    getIpPath = '/get-ip';
    getIpResolutionsPath = '/get-ip-resolutions';
    getIpCommunicatingFilesPath = '/get-ip-communicating-files';
    getIpReferrerFilesPath = '/get-ip-referrer-files';
    getIpHistoricalWhoisPath = '/get-ip-historical-whois';
    getIpHistoricalSslCertsPath = '/get-ip-historical-ssl-certs';
    getSigmaRulePath = '/get-sigma-rule';
    getDomainPath = '/get-domain';
    getDomainResolutionsPath = '/get-domain-resolutions';
    getDomainCommunicatingFilesPath = '/get-domain-communicating-files';
    getDomainReferrerFilesPath = '/get-domain-referrer-files';
    getDomainSubdomainsPath = '/get-domain-subdomains';
    getDomainHistoricalWhoisPath = '/get-domain-historical-whois';
    getDomainHistoricalSslCertsPath = '/get-domain-historical-ssl-certs';

    constructor(
        private httpClient: HttpClient,
        private envService: EnvService
    ) {}

    async postVtHashSearch(text) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            hash: text,
        };

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getHashPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    // Check if this is a 404 (hash not found) or other error
                    if (error.status === 404) {
                        // Resolve with a structured error response instead of rejecting
                        resolve({
                            message: 'Hash not found in VirusTotal',
                            status: 404,
                            data: null,
                        });
                    } else {
                        // For other errors, reject so it gets caught properly
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtHashTtpSearch(text) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            hash: text,
        };

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getHashTtpPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    // Check if this is a 404 (hash not found) or other error
                    if (error.status === 404) {
                        // Resolve with a structured error response
                        resolve({
                            message: 'TTP data not found in VirusTotal',
                            status: 404,
                            data: null,
                        });
                    } else {
                        // For other errors, reject
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpSearch(ip: string) {
        this.headers['Content-Type'] = 'application/json';
        let body = {
            ip: ip,
        };

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'IP not found in VirusTotal',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpResolutions(ip: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = {
            ip: ip,
            limit: limit,
        };

        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpResolutionsPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'No resolutions found for this IP',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpCommunicatingFiles(ip: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = {
            ip: ip,
            limit: limit,
        };

        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpCommunicatingFilesPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'No communicating files found for this IP',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpHistoricalSslCerts(ip: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = {
            ip: ip,
            limit: limit,
        };

        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpHistoricalSslCertsPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'No historical SSL certificates found for this IP',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpHistoricalWhois(ip: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = {
            ip: ip,
            limit: limit,
        };

        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpHistoricalWhoisPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'No historical WHOIS data found for this IP',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postGetSigmaRule(ruleId: string) {
        this.headers['Content-Type'] = 'application/json';
        let body = { ruleId: ruleId };

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getSigmaRulePath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'Sigma rule not found', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtIpReferrerFiles(ip: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = {
            ip: ip,
            limit: limit,
        };

        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getIpReferrerFilesPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({
                            message: 'No referrer files found for this IP',
                            status: 404,
                            data: null,
                        });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainSearch(domain: string) {
        this.headers['Content-Type'] = 'application/json';
        let body = { domain: domain };

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'Domain not found in VirusTotal', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainResolutions(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainResolutionsPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No resolutions found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainCommunicatingFiles(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainCommunicatingFilesPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No communicating files found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainReferrerFiles(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainReferrerFilesPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No referrer files found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainSubdomains(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainSubdomainsPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No subdomains found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainHistoricalWhois(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainHistoricalWhoisPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No historical WHOIS data found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }

    async postVtDomainHistoricalSslCerts(domain: string, limit: number = 40, cursor: string | null = null) {
        this.headers['Content-Type'] = 'application/json';
        let body: any = { domain: domain, limit: limit };
        if (cursor) {
            body.cursor = cursor;
        }

        return new Promise((resolve, reject) => {
            this.httpClient.post(`${this.imxServerUrl}${this.getDomainHistoricalSslCertsPath}`, body, { headers: this.headers }).subscribe({
                next: (data) => resolve(data),
                error: (error) => {
                    if (error.status === 404) {
                        resolve({ message: 'No historical SSL certificates found for this domain', status: 404, data: null });
                    } else {
                        reject(error);
                    }
                },
            });
        });
    }
}
