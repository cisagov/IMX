import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvService } from '../env-service/env.service';

@Injectable({
    providedIn: 'root',
})
export class SubmissionsService {
    imxServerUrl = this.envService.env.imxServer.url;
    headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(this.envService.env.imxServer.user + ':' + this.envService.env.imxServer.pass)}`,
    });

    getPath = '/get-my-submissions';
    getDocPath = '/get-submission';
    postPath = '/post-my-submission';
    updatePath = '/update-my-submission';
    updateByStatusIDPath = '/update-by-status-id';
    searchPath = '/search-my-submissions';

    //For aggregating last 30 days submission counts for user
    submissionPath = '/get-my-submissions-all';

    //MISP Submissions
    getMispPath = '/submissions';

    constructor(
        private readonly httpClient: HttpClient,
        private readonly envService: EnvService
    ) {}

    //Gets docs in increments of ten
    public async getPage(page, currentSelection) {
        let users = currentSelection;
        if (currentSelection && currentSelection.includes('(group)')) {
            users = '';
            let splitStr = currentSelection.split(' (');
            let group = splitStr[0];
            for (let user of this.envService.groupInfo?.[group]) {
                users += `${user.user}+`;
            }
        }

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getPath}/${page}/${users}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    //Gets docs in increments of ten
    public async getSubmissionByID(docID) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getDocPath}/${docID}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    //Posts new submission
    public async postSubmission(submission) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.postPath}`, submission, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    //Update submission
    public async updateSubmission(submission) {
        let doc = submission._source;
        let docID = submission._id;

        return new Promise((resolve, reject) => {
            try {
                this.httpClient.post(`${this.imxServerUrl}${this.updatePath}/${docID}`, doc, { headers: this.headers }).subscribe((res) => {
                    resolve(res);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    //Update submission
    public async updateByStatusID(submission) {
        let statusID = submission.id;

        return new Promise((resolve, reject) => {
            try {
                this.httpClient
                    .post(`${this.imxServerUrl}${this.updateByStatusIDPath}/${statusID}`, submission, { headers: this.headers })
                    .subscribe({
                        next: (data) => resolve(data),
                        error: (err) => reject(err),
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    //Aggregates submission counts
    public async aggregateSubmissions(user) {
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.submissionPath}/${user}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    public async searchSubmissions(query) {
        let queryString = btoa(JSON.stringify(query));
        return new Promise((resolve, reject) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.searchPath}/${queryString}`, { headers: this.headers }).subscribe({
                    next: (data) => resolve(data),
                    error: (err) => reject(err),
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    //MISP

    //Get Submission
    public async getMispSubmission(page, currentSelection) {
        let users = currentSelection;

        if (currentSelection && currentSelection.includes('(group)')) {
            users = '';
            let splitStr = currentSelection.split(' (');
            let group = splitStr[0];
            for (let user of this.envService.groupInfo?.[group]) {
                users += `${user.user}+`;
            }
        }

        return new Promise((res, rej) => {
            try {
                this.httpClient.get(`${this.imxServerUrl}${this.getMispPath}/${page}/${users}`, { headers: this.headers }).subscribe({
                    next: (data) => res(data),
                    error: (err) => rej(err),
                });
            } catch (e) {
                rej(e);
            }
        });
    }
}
