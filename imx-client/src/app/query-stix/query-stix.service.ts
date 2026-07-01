import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { EnvService } from '../env-service/env.service';

import { MessageService } from './message.service';

@Injectable({ providedIn: 'root' })
export class TAXIIClientService {
    taxiiServer: string = `${this.envService.env.taxiiServer.url}taxii/${this.envService.env.taxiiServer.apiVersion}/`;

    httpHeaders = new HttpHeaders()
        .set('Accept', 'application/taxii+json;version=2.1')
        .set('Authorization', `Basic ${btoa(this.envService.env.taxiiServer.username + ':' + this.envService.env.taxiiServer.password)}`);

    constructor(
        private http: HttpClient,
        public messageService: MessageService,
        private envService: EnvService
    ) {}

    /** DELETE: delete the STIX Object from the TAXII server */
    deleteObject(taxiiServer: string, apiRoot: string, collectionId: string, id: number, modified: number): Observable<unknown> {
        let url: string;
        if (modified) {
            url = taxiiServer + apiRoot + '/collections/' + collectionId + '/objects/' + id + '/?match[version]=' + modified;
        } else {
            url = taxiiServer + apiRoot + '/collections/' + collectionId + '/objects/' + id + '/';
        }

        return this.http.delete<unknown>(url, { headers: this.httpHeaders }).pipe(
            tap((_) => this.log(`Deleted STIX Object id=${id}`)),
            catchError(this.handleError<unknown>('deleteObject'))
        );
    }

    /**
     * Handle Http operation that failed.
     * Let the app continue.
     *
     * @param operation - name of the operation that failed
     * @param result - optional value to return as the observable result
     */
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead

            // TODO: better job of transforming error for user consumption
            this.log(`${operation} failed: ${error.message}`);

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

    /** Log a message with the MessageService */
    private log(message: string) {
        this.messageService.add(`${message}`);
    }
}
