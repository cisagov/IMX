import { Component, Output, OnInit, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { faQuestionCircle, faPlus, faClock } from '@fortawesome/free-solid-svg-icons';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-report-assessment',
    templateUrl: './report-assessment.component.html',
    styleUrls: ['./report-assessment.component.css'],
    standalone: false,
})
export class ReportAssessmentComponent implements OnInit, OnDestroy {
    @Output() syncCartEmitter = new EventEmitter<any>();
    @Output() getEditItemEmitter = new EventEmitter<any>();

    @Output() showAssistance: EventEmitter<any>;
    @ViewChild('addComponent', { static: false }) addComponent: AddComponentComponent;
    @Output() changePage = new EventEmitter<any>();

    component: string = 'report-assessment';

    faQuestionCircle = faQuestionCircle;
    faPlus = faPlus;
    faClock = faClock;

    reportName = null;
    disableName: boolean = false;
    published: any = null;
    reportDetails = null;
    objectSelection = null;

    moment = moment;
    moment_tz = moment_tz;
    timeZones = [];
    timeZone = null;

    reportId = '';

    constructor(
        public guidedService: GuidedService,
        private envService: EnvService,
        public stixService: StixService
    ) {
        this.showAssistance = new EventEmitter();
    }

    ngOnInit(): void {
        this.guidedService.isGuidedReport = true;
        this.timeZones = this.moment_tz.tz.names();
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'report');

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                let tempObj = this.guidedService.cart[this.component]['report'][0];

                this.reportName = tempObj.name;
                this.reportId = tempObj.id;
                this.disableName = true;
                this.reportDetails = tempObj.description ? tempObj.description : null;
                this.published = tempObj.published;
            }
        }, 100);
    }

    async addComponents() {

        this.updateReportFields();

        let currentDate = new Date();
        const publishedTimeInTzUtc =
            this.published && this.guidedService.currentCartIndex === null
                ? this.guidedService.convertTimeToTzUtc(this.published, this.timeZone)
                : currentDate.toISOString();
        this.published = this.published ? this.published : currentDate.toUTCString();

        if (this.published) {
            let tempReport = {
                type: 'report',
                created_by_ref: this.envService.env.defaultIdentity.id,
                name: this.reportName ? this.reportName : `report-generated-${new Date().toISOString()}`,
                published: publishedTimeInTzUtc,
                description: this.reportDetails ? this.reportDetails : null,
                object_refs: [this.envService.env.defaultIdentity.id],
            };
            if (this.stixService.externalReferences.length > 0) {
                tempReport['external_references'] = this.stixService.externalReferences;
            }
            tempReport['id'] = this.reportId !== '' ? this.reportId : this.getStixId(tempReport, 'report');
            if (this.guidedService.currentCartIndex === null) {
                for (let field in tempReport) {
                    this.guidedService.currentReport[field] = tempReport[field];
                }
            } else {
                this.guidedService.currentReport['description'] = this.reportDetails;
            }
        }

        if (this.guidedService.currentCartIndex === null) this.guidedService.addCartToBundle();
    }

    getStixId(object, typeName) {
        if (this.guidedService.editCart && this.guidedService.editCart[this.component] && this.guidedService.editCart[this.component][typeName]) {
            for (let oldObject of this.guidedService.editCart[this.component][typeName]) {
                if (oldObject.cartId === object.cartId) {
                    return oldObject.id;
                }
            }
        }

        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    setTimeZone(event) {
        if (event && event.target && event.target.value) {
            this.timeZone = event.target.value;
        }
    }

    ngOnDestroy() {}

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else {
            this.getEditItemEmitter.emit(event);
        }
    }

    syncCart(event) {
        if (event === this.component) {
            this.syncCartEmitter.emit();
        }
    }

    updateReportFields() {
        this.guidedService.reportFields = {
            name: this.reportName,
            description: this.reportDetails,
            published: this.published,
            external_references: this.stixService.externalReferences
        }
    }
}
