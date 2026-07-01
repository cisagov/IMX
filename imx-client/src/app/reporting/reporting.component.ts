import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { EnvService } from '../env-service/env.service';

@Component({
    selector: 'app-reporting',
    templateUrl: './reporting.component.html',
    styleUrls: ['./reporting.component.css'],
    standalone: false,
})
export class ReportingComponent implements OnInit {
    private pullHeaders = new HttpHeaders().set('Content-Type', 'application/taxii+json;version=2.1');
    private params = new HttpParams()
        .set('dashboardId', this.envService.env.quicksight.dashboardId)
        .append('userArn', this.envService.env.quicksight.userArn)
        .append('resetDisabled', this.envService.env.quicksight.resetDisabled)
        .append('undoRedoDisabled', this.envService.env.quicksight.undoRedoDisabled);

    constructor(
        private httpClient: HttpClient,
        private envService: EnvService
    ) {}

    ngOnInit(): void {
        this.grabDashboardUrl();
    }

    grabDashboardUrl(): void {
        this.httpClient
            .get(this.envService.env.quicksight.apiGatewayUrl, {
                headers: this.pullHeaders,
                params: this.params,
            })
            .subscribe((response: any) => {
                this.embedDashboard(response.EmbedUrl);
            });
    }

    private embedDashboard(embedUrl: string): void {
        const dasboardContainer = document.getElementById('dashboardContainer');
        const params = {
            url: embedUrl,
            container: dasboardContainer,
            height: '1500px',
            width: '85%',
        };

        const dashboard = {};
    }
}
