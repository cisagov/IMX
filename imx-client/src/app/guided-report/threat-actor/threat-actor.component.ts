import { Component, OnInit, Input } from '@angular/core';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';

@Component({
    selector: 'app-threat-actor',
    templateUrl: './threat-actor.component.html',
    styleUrls: ['./threat-actor.component.css'],
    standalone: false,
})
export class ThreatActorComponent implements OnInit {
    // @Input() objectSelection: any;

    objectSelection: any = null;

    reloadAddComponent: boolean = false;
    name: string = 'threat actor1';

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {}

    ngOnInit(): void {
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'threat-actor');
    }

    addComponent() {
        let data = {};

        data = {
            type: 'add-gr-component',
            value: {
                name: this.name,
            },
            objectSelection: this.objectSelection,
        };

        this.stixService.sendData(data);
    }
}
