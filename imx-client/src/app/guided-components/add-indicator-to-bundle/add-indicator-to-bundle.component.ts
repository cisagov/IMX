import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';
import {
    faTrash,
    faFileImport,
    faInfo,
    faInfoCircle,
    faUpload,
    faFileUpload,
    faHeart,
    faBan,
    faPaperPlane,
    faExclamationTriangle,
    faArrowLeft,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-add-indicator-to-bundle',
    templateUrl: './add-indicator-to-bundle.component.html',
    styleUrls: ['./add-indicator-to-bundle.component.css'],
    standalone: false,
})
export class AddIndicatorToBundleComponent implements OnInit {
    @Input() evidenceId: any;

    faTrash = faTrash;

    pendingObjects = [];
    stixObjects = [];
    rownumber: number = -1;
    objnumber: number = -1;
    requestObj = null;
    addingStixToPending = false;

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService,
        public httpClient: HttpClient,
        private envService: EnvService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        this.requestObj = {
            evidenceId: this.evidenceId,
            format: 'json',
        };

        let url = this.envService.env.tpg.url;

        this.addingStixToPending = true;
        this.httpClient
            .post<any>(url, this.requestObj, { headers: this.guidedService.httpHeadersJSONNoAuth, observe: 'response' })
            .subscribe((tpgBundle: any) => {
                this.pendingObjects = tpgBundle && tpgBundle.body && tpgBundle.body.objects ? tpgBundle.body.objects : [];
                this.addingStixToPending = false;
            });
    }

    ngOnInit(): void {
        this.stixObjects = this.guidedService.stixObjects;
    }

    getStixObjectID(type): string {
        type = type.toLowerCase();
        type.replace(' ', '-');

        return type;
    }

    removeObject(objId) {
        const index = this.pendingObjects.findIndex((o) => o.id === objId);
        if (index >= 0) {
            this.pendingObjects.splice(index, 1);
        }
    }

    changeShow(objIndex, rowIndex): void {
        if (objIndex == this.objnumber && rowIndex == this.rownumber) {
            this.rownumber = -1;
        } else {
            this.objnumber = objIndex;
            this.rownumber = rowIndex;
        }
    }

    addToBundle() {
        this.pendingObjects.forEach((o) => {
            this.stixService.addComponent(o);
        });
    }

    getComponentPatternValue(component, type = null) {
        if (component.pattern) {
            if (component.pattern[0] === '[') {
                component.pattern = component.pattern.substring(1, component.pattern.length - 1);
            }
            let patterns = component.pattern.split(' = ');
            let value = patterns[1].trim();
            if (value[0] === "'") {
                value = value.substring(1, value.length - 1);
            }

            if (value.length > 30 && type === 'short') {
                return value.slice(0, 30) + '...';
            }
            return value;
        }
    }
}
