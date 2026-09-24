import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from 'src/app/env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class SavedBundlesService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    getPath = '/get-saved-bundles';
    postPath = '/post-saved-bundle';
    deletePath = '/delete-saved-bundle';
    updatePath = '/update-saved-bundle';
    searchPath = '/search-saved-bundles';

    constructor(
        private readonly httpClient: HttpClient,
        private readonly envService: EnvService
    ) {}

    async getSavedBundles(page, sortKey, selection) {
        let urlArr = window.location.href.split('/');
        let path = urlArr[urlArr.length - 1];
        let size = 10;
        if (sortKey === '') sortKey = 'na';

        switch (path) {
            case 'bundle':
            case 'guided':
                size = 10;
                break;
        }

        let from = (page - 1) * size;

        let users = selection;
        if (selection?.includes('(group)')) {
            users = '';
            let splitStr = selection.split(' (');
            let group = splitStr[0];
            for (let user of this.envService.groupInfo?.[group]) {
                users += `${user.user}+`;
            }
        }

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getPath}/${sortKey}/${from}/${size}/${users}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async postSavedBundle(bundle) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.postPath}`, bundle, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

    async deleteSavedBundle(docID) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.delete(`${this.imxServerUrl}${this.deletePath}/${docID}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async updateSavedBundle(obj) {
        let docID = obj._id;
        let bundle = obj._source;

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.updatePath}/${docID}`, bundle, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async searchSavedBundles(page: number, query, selection, filters = undefined) {
        let users = selection;
        if (selection.includes('(group)')) {
            users = '';
            let splitStr = selection.split(' (');
            let group = splitStr[0];
            for (let user of this.envService.groupInfo?.[group]) {
                users += `${user.user}+`;
            }
        }

        let queryString = btoa(JSON.stringify(query));
        return new Promise((resolve, reject) => {
            try {
                if (!filters)
                    this.httpClient.get(`${this.imxServerUrl}${this.searchPath}/${queryString}`, { headers: this.headers }).subscribe({
                        next: (data) => resolve(data),
                        error: (err) => reject(err),
                    });
                else {
                    const { sortKey, size } = filters;
                    this.httpClient
                        .get(`${this.imxServerUrl}${this.searchPath}/${queryString}/${sortKey}/${(page - 1) * size}/${size}/${users}`, {
                            headers: this.headers,
                        })
                        .subscribe({
                            next: (data) => resolve(data),
                            error: (err) => reject(err),
                        });
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}
