import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StixService } from '../stix-service.service';
import { faEdit, faIdCard, faTimes, faTrash, faFileImport, faStickyNote } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-identity',
    templateUrl: './identity.component.html',
    styleUrl: './identity.component.css',
    standalone: false,
})
export class IdentityComponent implements OnInit {
    @Output() editObject = new EventEmitter<any>();
    @Output() revokeObject = new EventEmitter<any>();
    @Output() setMainIdentity = new EventEmitter<any>();
    @Output() removeObject = new EventEmitter<any>();
    @Output() addCISAIdentity = new EventEmitter<any>();
    @Input() getJsonDisplayForComponent!: (component: any) => any;
    @Input() compareIdentity!: (id: string) => boolean;
    @Input() storedIdentities: any;
    @Input() cisaId: any;

    faEdit = faEdit;
    faIdCard = faIdCard;
    faRevoke = faTimes;
    faTrash = faTrash;
    faFileImport = faFileImport;
    faNote = faStickyNote;

    constructor(public stixService: StixService) {}

    ngOnInit(): void {}

    stopPropagation(event) {}

    copyObj(obj) {
        let tempObj = {};

        for (let field in obj) {
            tempObj[field] = obj[field];
        }

        return tempObj;
    }
}
