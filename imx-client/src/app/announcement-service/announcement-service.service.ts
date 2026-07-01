import { Injectable, OnDestroy } from '@angular/core';
import { timer, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { StixService } from '../stix-service.service';
import { LoggingService } from '../logging-service/logging.service';

const INTERVAL = 3000;
@Injectable({
    providedIn: 'root',
})
export class AnnouncementService implements OnDestroy {
    toasts: any[] = [];
    status: any;
    closeTimer$ = new Subject<any>();
    startTime: any;
    pollingIndex = -1;

    constructor(
        private readonly stixService: StixService,
        private readonly loggingService: LoggingService
    ) {}

    downloadJson(data: any, filename: string, id: number): void {
        this.setDownloadingStatus(id, true);
        const sJson = JSON.stringify(data, null, 2);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/json;charset=UTF-8,' + encodeURIComponent(sJson));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click(); // simulate click
        document.body.removeChild(element);

        // Using timeout so that the loading icon shows - usually it downloads the file too fast
        setTimeout(() => {
            this.setDownloadingStatus(id, false);
        }, 500);
    }

    private setDownloadingStatus(id: number, isDownloading: boolean): void {
        for (let currToast of this.toasts) {
            if (currToast.id === id) {
                currToast.isJsonDownloading = isDownloading;
                break;
            }
        }
    }

    show(
        heading: string,
        body: string,
        type: string,
        isBodyJson: boolean,
        filename?: string,
        isGitLabIssue?: boolean,
        gitlabIssueUrl?: string,
        actionButton?: { label: string; callback: () => void },
        delay = 100000,
        autohide = true
    ) {
        if (isBodyJson) body = JSON.parse(body.replace(/\\n/g, ' ').replace(/\\t/g, ''));
        this.stixService.annoucementID++;
        this.toasts.push({
            id: this.stixService.annoucementID,
            type: type,
            heading: heading,
            body: body,
            isBodyJson: isBodyJson,
            isGitLabIssue: isGitLabIssue != null,
            isJsonBodyExpanded: false,
            isJsonDownloading: false,
            filename: filename || 'response.json',
            gitlabIssueUrl: gitlabIssueUrl || '',
            actionButton: actionButton || null,
            delay: delay,
            autohide: autohide,
        });

        return this.toasts.length - 1;
    }

    remove(toast?) {
        if (toast) {
            this.toasts = this.toasts.filter((t) => t !== toast);
        } else if (this.toasts.length > 0) {
            this.remove(this.toasts[this.toasts.length - 1]);
        }
    }

    stopPolling(pollStatus, server, res, pollDuration) {
        return (
            (pollStatus && pollStatus != 'pending') || (server == 'ais' && JSON.stringify(res).includes('Pending human review')) || pollDuration > 600
        );
    }

    removeDuplicatesFromRes(res) {
        if (res.failures && res.failures.length > 0) {
            const duplicates = res.failures.filter((f) => f.message === 'duplicate collection/object/version\n');

            if (duplicates && duplicates.length > 0) {
                res['successes'] = res.successes ? [...res.successes, ...duplicates] : [...duplicates];
                res.failures = res.failures.filter((f) => f.message !== 'duplicate collection/object/version\n');
                res.failure_count = res.failure_count - duplicates.length;
                res.success_count = res.success_count + duplicates.length;
                this.stixService.newVersionObjects = duplicates.map((dupe) => dupe.id);
            }
        }

        return res;
    }

    setIds(res) {
        let ids: any[] = [];

        if (res.success_count > 0) {
            for (let obj of res.successes) {
                ids.push(obj.id);
            }
        }

        if (res.failure_count > 0) {
            for (let obj of res.failures) {
                if (obj.message == 'duplicate collection/object/version') ids.push(obj.id);
            }
        }

        return ids;
    }

    ifPollStatusIsComplete(res, showAnnouncement) {
        let status = '';

        // Remove Duplicates from Error and add to Success
        res = this.removeDuplicatesFromRes(res);

        if (res.success_count > 0) {
            res.successes.forEach((success) => this.stixService.newVersionObjects.push(success.id));
        }

        if (res.success_count > 0 && res.failure_count === 0) status = 'success';
        else status = 'error';

        if (res.success_count > 0 && res.failure_count > 0) status = 'warn';

        if (showAnnouncement) {
            if (this.pollingIndex > -1 && this.toasts[this.pollingIndex]) {
                this.remove(this.toasts[this.toasts.length - 1]);
                this.pollingIndex = -1;
            }

            this.show('Publish status information', `${JSON.stringify(res)}`, status, true, '', null, null, null, 0, false);
        }

        this.stixService.sendData(res);

        let ids = this.setIds(res);

        this.stixService.db.bundles.put({ publish_time: Date.parse(res.request_timestamp), bundle: ids });
    }

    getStatus(url, collection, showAnnouncement = true): void {
        if (showAnnouncement && this.startTime == undefined) {
            this.show('Publish status information - Waiting for Server Response', `Polling ${url}`, 'warn', false, '', null, null, null, 0, false);
            this.pollingIndex = this.toasts.length - 1;
        }

        if (this.startTime == undefined) {
            this.startTime = Date.now();
        }

        let server = this.stixService.taxiiServerType;
        this.stixService.newVersionObjects = [];

        timer(0, INTERVAL)
            .pipe(
                switchMap(() => this.stixService.getStatus(url)),
                takeUntil(this.closeTimer$)
            )
            .subscribe({
                next: (res: any) => {
                    let pollStatus = res['status'];
                    console.debug(`POLL STATUS: ${pollStatus}`);
                    let pollTime = Date.now();
                    let pollDuration = (pollTime - this.startTime) / 1000; // Duration of poll in seconds

                    //If status is not pending OR TAXII Server is not AIS that requires human review OR pollduration exceeds 10 minutes
                    if (this.stopPolling(pollStatus, server, res, pollDuration)) {
                        this.closeTimer$.next(null); // <-- stop polling
                        this.startTime = undefined;

                        if (pollStatus == 'complete') {
                            this.ifPollStatusIsComplete(res, showAnnouncement);
                        } else if (showAnnouncement) {
                            if (this.pollingIndex > -1 && this.toasts[this.pollingIndex]) {
                                this.remove(this.toasts[this.toasts.length - 1]);
                                this.pollingIndex = -1;
                            }

                            this.show(
                                'Publish status information - Bundle Likely Marked for Manual Review',
                                `${JSON.stringify(res)}`,
                                'warn',
                                true,
                                '',
                                null,
                                null,
                                null,
                                0,
                                false
                            );
                        }
                    }
                },
                error: (error: any) => {
                    this.closeTimer$.next(null);
                    console.error(error);

                    if (error.status == 404) {
                        this.getStatus(url, collection);
                        return;
                    }

                    this.startTime = undefined;

                    if (this.pollingIndex > -1 && this.toasts[this.pollingIndex]) {
                        this.remove(this.toasts[this.toasts.length - 1]);
                        this.pollingIndex = -1;
                    }

                    this.show('Publish status information', `${JSON.stringify(error)}`, 'warn', true, '', null, null, null, 0, false);
                },
            });
    }

    ngOnDestroy(): void {
        this.closeTimer$.next(null);
    }
}
