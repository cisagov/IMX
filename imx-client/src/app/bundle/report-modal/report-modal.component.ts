import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-report-modal',
    templateUrl: './report-modal.component.html',
    styleUrls: ['./report-modal.component.css', '../bundle.component.css', '../../dashboard/dashboard.component.css', '../../app.component.css'],
    standalone: false,
})
export class ReportModalComponent implements OnInit {
    reportName;

    constructor(
        public stixService: StixService,
        public activeModal: NgbActiveModal
    ) {}

    ngOnInit() {
        this.reportName = this.stixService.reportName;
    }

    saveReportName() {
        this.stixService.setReportName(this.reportName);
        this.activeModal.close();
    }

    closeModal() {
        this.activeModal.close();
    }

    determineReportName() {
        if (this.stixService.reportName) return this.stixService.reportName;
        else {
            let report = this.stixService.bundle.objects.find((elem) => elem.type === 'report');
            let docName = report
                ? report.name.replaceAll(' ', '_') + `${localStorage.getItem('evidence') ? '_' + localStorage.getItem('evidence') : ''}`
                : '';

            return docName || 'Unnamed Report';
        }
    }
}
