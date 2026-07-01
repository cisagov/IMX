import { Component } from '@angular/core';
import { GuidedService } from 'src/app/guided.service';

@Component({
    selector: 'app-report-type',
    templateUrl: './report-type.component.html',
    styleUrls: ['./report-type.component.css'],
    standalone: false,
})
export class ReportTypeComponent {
    grTypeOptions: any = [
        { key: 'attack-pattern', value: 'Attack Pattern' },
        { key: 'campaign', value: 'Campaign' },
        { key: 'identity', value: 'Identity' },
        { key: 'indicator', value: 'Indicator' },
        { key: 'intrusion-set', value: 'Intrusion Set' },
        { key: 'malware', value: 'Malware' },
        { key: 'observed-data', value: 'Observed Data' },
        { key: 'threat-actor', value: 'Threat Actor' },
        { key: 'threat-report', value: 'Threat Report' },
        { key: 'tool', value: 'Tool' },
        { key: 'vulnerability', value: 'Vulnerability' },
    ];

    constructor(public guidedService: GuidedService) {}

    grTypeHandler(event) {
        if (event && event.target && event.target.value) {
            this.guidedService.gr.gr_report_type = event.target.value;
        }
    }
}
