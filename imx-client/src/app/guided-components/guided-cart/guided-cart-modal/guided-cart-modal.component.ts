import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faEdit, faTrash, faBan, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { GuidedService } from 'src/app/guided.service';

export interface GuidedCartData {
    cart: {};
    editMode: false;
    currentMode: string;
}

@Component({
    selector: 'app-guided-cart-modal',
    templateUrl: './guided-cart-modal.component.html',
    styleUrls: ['./guided-cart-modal.component.css'],
    standalone: false,
})
export class GuidedCartModalComponent implements OnInit {
    faEdit = faEdit;
    faTrash = faTrash;
    faBan = faBan;
    faChevronUp = faChevronUp;
    faChevronDown = faChevronDown;

    cart: any = {};
    editMode: boolean = false;

    currentMode: string = '';
    categories = {
        REPORT: [],
        'WHAT (Impact)': [],
        'HOW (CWE)': [],
        'HOW (TTP)': [],
        'HOW (Query)': [],
        'HOW (Observable)': [],
        'HOW (Detection)': [],
        'WHERE (Location)': [],
        WHO: [],
    };

    impactDetailsOpen: { [index: number]: boolean } = {};

    constructor(
        public dialogRef: MatDialogRef<GuidedCartModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: GuidedCartData
    ) {
        this.cart = data.cart;
        this.editMode = data.editMode;
        this.currentMode = data.currentMode;
    }

    ngOnInit(): void {
        this.organizeCategories();
    }

    editFromCart(object, type) {
        const [index, key] = this.getKeyAndIndex(type, object);
        let result = {
            mode: 'edit',
            key: key,
            index: index,
        };

        this.dialogRef.close(result);
    }

    getKeyAndIndex(type, object) {
        let index;
        let key;
        switch (type) {
            case 'WHO':
                if (object.type == 'identity') {
                    index = this.cart['Identity'].findIndex((obj) => obj.id == object.id);
                    key = 'Identity';
                } else if (object.type == 'threat-actor') {
                    index = this.cart['Threat Actor'].findIndex((obj) => obj.id == object.id);
                    key = 'Threat Actor';
                }
                break;
            case 'WHERE (Location)':
                index = this.cart['Location'].findIndex((obj) => obj.id == object.id);
                key = 'Location';
                break;
            case 'HOW (Detection)':
                if (object.type == 'event') {
                    index = this.cart['Event'].findIndex((obj) => obj.id == object.id);
                    key = 'Event';
                } else if (object.type == 'incident') {
                    index = this.cart['Incident'].findIndex((obj) => obj.id == object.id);
                    key = 'Incident';
                }
                break;
            case 'HOW (Observable)':
                switch (object.type) {
                    case 'ipv4-addr':
                        index = this.cart['IPv4 Address'].findIndex((obj) => obj.id == object.id);
                        key = 'IPv4 Address';
                        break;
                    case 'ipv6-addr':
                        index = this.cart['IPv6 Address'].findIndex((obj) => obj.id == object.id);
                        key = 'IPv6 Address';
                        break;
                    case 'mac-addr':
                        index = this.cart['Mac Address'].findIndex((obj) => obj.id == object.id);
                        key = 'Mac Address';
                        break;
                    case 'email-addr':
                        index = this.cart['Email Address'].findIndex((obj) => obj.id == object.id);
                        key = 'Email Address';
                        break;
                    case 'url':
                        index = this.cart['URL'].findIndex((obj) => obj.id == object.id);
                        key = 'URL';
                        break;
                    case 'artifact':
                    case 'autonomous-system':
                    case 'directory':
                    case 'domain-name':
                    case 'email-message':
                    case 'file':
                    case 'malware':
                    case 'malware-analysis':
                    case 'mutex':
                    case 'network-traffic':
                    case 'process':
                    case 'software':
                    case 'user-account':
                    case 'windows-registry-key':
                    case 'x509-certificate':
                        key = object.type.split('-').reduce((prev, next) => {
                            if (prev) prev += ' ';

                            prev += next.charAt(0).toUpperCase() + next.slice(1);
                            return prev;
                        }, '');

                        index = this.cart[key].findIndex((obj) => obj.id == object.id);
                        break;
                }
                break;
            case 'HOW (Query)':
                index = this.cart['Indicator'].findIndex((obj) => obj.id == object.id);
                key = 'Indicator';
                break;
            case 'HOW (TTP)':
                index = this.cart['Attack Pattern'].findIndex((obj) => obj.id == object.id);
                key = 'Attack Pattern';
                break;
            case 'HOW (CWE)':
                index = this.cart['Vulnerability'].findIndex((obj) => obj.id == object.id);
                key = 'Vulnerability';
                break;
            case 'WHAT (Impact)':
                index = this.cart['Impact'].findIndex((obj) => obj.id == object.id);
                key = 'Impact';
                break;
            case 'REPORT':
                index = this.cart['report'].findIndex((obj) => obj.id == object.id);
                key = 'report';
                break;
        }

        return [index, key];
    }

    deleteFromCart(object, type, search) {
        const [index, key] = this.getKeyAndIndex(type, object);

        let result = {
            mode: 'delete',
            key: key,
            index: index,
            search: search,
        };

        this.dialogRef.close(result);
    }

    getName(value) {
        return value.display_name + ` (${this.getType(value.type)})`;
    }

    getType(string) {
        if (string == 'ipv4-addr') {
            return 'IPv4 Address';
        } else if (string == 'ipv6-addr') {
            return 'IPv6 Address';
        } else if (string == 'mac-addr') {
            return 'Mac Address';
        } else if (string == 'email-addr') {
            return 'Email Address';
        }
        return string.split('-').reduce((prev: string, next: string) => {
            if (prev) prev += ' ';
            prev += next.charAt(0).toUpperCase() + next.slice(1);

            return prev;
        }, '');
    }

    toggleImpactDetails(i: number): void {
        this.impactDetailsOpen[i] = !this.impactDetailsOpen[i];
    }

    /**
     * Takes an extension definition JSON and converts it to a user-readable value
     */
    formatExtensionObject(object: any): string {
        if (!object) return '';

        const parts: string[] = [];

        for (const key of Object.keys(object)) {
            const label = key
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const value = String(object[key])
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            parts.push(`${label}: ${value}`);
        }
        return parts.join('\n');
    }

    onX(): void {
        this.dialogRef.close();
    }

    skipDisplay(string) {
        const skippedDisplay = [];
    }

    getDisplayHeader(string) {
        switch (string) {
            case 'Identity':
                return 'WHO';
            default:
                return string;
        }
    }

    getCategoryLength(type) {
        return `${this.categories[type].length}`;
    }

    organizeCategories() {
        for (const category in this.categories) {
            this.categories[category] = [];

            switch (category) {
                case 'WHO':
                    if (this.cart['Identity']) this.categories[category] = [...this.cart['Identity']];
                    if (this.cart['Threat Actor']) this.categories[category] = [...this.categories[category], ...this.cart['Threat Actor']];
                    break;
                case 'WHERE (Location)':
                    if (this.cart['Location']) this.categories[category] = [...this.cart['Location']];
                    break;
                case 'HOW (Detection)':
                    if (this.cart['Event']) this.categories[category] = [...this.cart['Event']];
                    if (this.cart['Incident']) this.categories[category] = [...this.categories[category], ...this.cart['Incident']];
                    break;
                case 'HOW (Observable)':
                    const observableTypes = [
                        'Artifact',
                        'Autonomous System',
                        'Directory',
                        'Domain Name',
                        'Email Address',
                        'Email Message',
                        'File',
                        'IPv4 Address',
                        'IPv6 Address',
                        'Mac Address',
                        'Malware',
                        'Malware Analysis',
                        'Mutex',
                        'Network Traffic',
                        'Process',
                        'Software',
                        'URL',
                        'User Account',
                        'Windows Registry Key',
                        'X509 Certificate',
                    ];

                    for (const type of observableTypes) {
                        if (this.cart[type]) this.categories[category] = [...this.categories[category], ...this.cart[type]];
                    }
                    break;
                case 'HOW (Query)':
                    if (this.cart['Indicator']) this.categories[category] = [...this.cart['Indicator']];
                    break;
                case 'HOW (TTP)':
                    if (this.cart['Attack Pattern']) this.categories[category] = [...this.cart['Attack Pattern']];
                    break;
                case 'HOW (CWE)':
                    if (this.cart['Vulnerability']) this.categories[category] = [...this.cart['Vulnerability']];
                    break;
                case 'WHAT (Impact)':
                    if (this.cart['Impact']) this.categories[category] = [...this.cart['Impact']];
                    break;
                case 'REPORT':
                    if (this.cart['report']) this.categories[category] = [...this.cart['report']];
                    break;
            }
        }
    }

    getCategory(type) {
        return this.categories[type];
    }
}
