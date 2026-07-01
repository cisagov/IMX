import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { faQuestionCircle, faCheckCircle, faTimesCircle, faEdit, faPlusSquare } from '@fortawesome/free-regular-svg-icons';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-object-addition',
    templateUrl: './object-addition.component.html',
    styleUrls: ['./object-addition.component.css'],
    standalone: false,
})
export class ObjectAdditionComponent implements OnInit {
    @Output() addObjectEvent: EventEmitter<boolean>;

    @ViewChild('addComponent', { static: false }) addComponent: AddComponentComponent;

    faQuestionCircle = faQuestionCircle;
    createAnotherObject = null;
    objectSelection = null;

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.addObjectEvent = new EventEmitter();
    }

    ngOnInit(): void {
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'report');
    }

    onAddObject(createAnother: boolean) {
        if (this.guidedService.isGuidedReport) {
            // Add report object
            let data = {
                type: 'add-gr-component',
                value: {
                    gr_name: this.guidedService.gr.gr_name,
                    gr_report_types: this.guidedService.gr.gr_report_type,
                    gr_published: this.guidedService.gr.gr_published,
                    gr_description: this.guidedService.gr.gr_description,
                },
                objectSelection: this.objectSelection,
            };

            this.stixService.sendData(data);
        }
        this.createAnotherObject = createAnother;
        setTimeout(() => {
            this.addObjectEvent.emit(createAnother);
        }, 200);
    }
}
