import { Component, Input, OnInit } from '@angular/core';
import { faCheck, faClock, faStop } from '@fortawesome/free-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-submission-info',
    standalone: false,
    templateUrl: './submission-info.component.html',
    styleUrls: ['./submission-info.component.css', '../../taxii-search.component.css', '../../../dashboard/dashboard.component.css'],
})
export class SubmissionInfoComponent implements OnInit {
    @Input() submission;
    @Input() search;

    faClock = faClock;
    faCheck = faCheck;
    faStop = faStop;

    success = [];
    failure = [];
    pending = [];

    show = {
        success: true,
        failure: true,
        pending: true,
    };

    constructor(public dialogRef: NgbActiveModal) {}

    ngOnInit(): void {
        if (this.search) {
            this.failure = this.submission.failures;
            this.pending = this.submission.pendings;
            this.success = this.submission.successes;
        } else {
            this.failure = this.submission.res.failures;
            this.pending = this.submission.res.pendings;
            this.success = this.submission.res.successes;
        }
    }

    close() {
        this.dialogRef.close({ action: 'close' });
    }

    toggleShow(cat) {
        this.show[cat] = !this.show[cat];
    }

    async downloadFile() {
        const blob = new Blob([JSON.stringify(this.submission, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.submission.docName ? this.submission.docName : this.submission.id;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
