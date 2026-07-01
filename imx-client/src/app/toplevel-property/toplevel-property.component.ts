import { Component } from '@angular/core';
import { StixService } from '../stix-service.service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-toplevel-property',
    templateUrl: './toplevel-property.component.html',
    styleUrls: ['./toplevel-property.component.css', '../extensions/extensions.component.css'],
    standalone: false,
})
export class ToplevelPropertyComponent {
    faTrash = faTrash;

    constructor(public stixService: StixService) {}
}
