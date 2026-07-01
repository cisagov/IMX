import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StixService } from '../../stix-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-customize-columns',
    templateUrl: './customize-columns.component.html',
    styleUrls: ['./customize-columns.component.css'],
    standalone: false,
})
export class CustomizeColumnsComponent implements OnInit, OnDestroy {
    faCheck = faCheck;

    customizeColumnsSubscription: Subscription;
    columns: any;

    constructor(
        public stixService: StixService,
        public activeModal: NgbActiveModal
    ) {}

    ngOnInit(): void {
        this.customizeColumnsSubscription = this.stixService.getData().subscribe((data) => {
            this.columns = data.data;
        });
    }

    closeModal() {
        const data = {
            data: this.columns,
        };

        this.stixService.sendData(data);
    }

    ngOnDestroy() {
        if (this.customizeColumnsSubscription) {
            this.customizeColumnsSubscription.unsubscribe();
        }
    }
}
