import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { STIX_OBJECTS } from 'src/app/models/stix-objects';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-objects-modal',
    templateUrl: './objects-modal.component.html',
    styleUrls: ['./objects-modal.component.css', '../../dashboard/dashboard.component.css', '../../app.component.css'],
    standalone: false,
})
export class ObjectsModalComponent {
    activeTab = 'sdo';
    stixObjects = STIX_OBJECTS;

    constructor(
        public modal: NgbActiveModal,
        public stixService: StixService
    ) {}

    changeTab(tab: string) {
        this.activeTab = tab;
    }

    close(type = null) {
        if (type) {
            this.stixService.currentType = type;
        }

        window.scrollTo(0, 0);
        this.modal.close();
    }
}
