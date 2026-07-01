import { Component, Input, OnInit } from '@angular/core';
import { StixService } from '../stix-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faTrash, faBan, faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-remove-object',
    standalone: false,
    templateUrl: './remove-object.component.html',
    styleUrls: ['./remove-object.component.css'],
})
export class RemoveObjectComponent implements OnInit {
    @Input() public removingObjects: string[];

    faTrash = faTrash;
    faStop = faBan;
    faAngleDoubleUp = faAngleDoubleUp;

    objects: any[] = [];
    expand: boolean[] = [];

    loading = true;

    editorOptions = {
        theme: 'vs',
        language: 'json',
        minimap: {
            enabled: false,
        },
        readOnly: true,
        overviewRulerLanes: 0,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
    };

    constructor(
        public activeModal: NgbActiveModal,
        public stixService: StixService
    ) {}

    ngOnInit(): void {
        this.stixService.bundle.objects.forEach((obj) => {
            if (this.removingObjects.includes(obj.id)) {
                this.objects.push(obj);
                this.expand.push(false);
            }
        });

        this.loading = false;
    }

    close() {
        this.activeModal.close('cancel');
    }

    confirm() {
        this.activeModal.close('confirm');
    }

    getComponentDisplayAcsOrMarkingDef(acs, component) {
        if (acs[component.id]) {
            return acs[component.id];
        }

        if (this.stixService.markingDefinition[component.id]) {
            return this.stixService.markingDefinition[component.id];
        }

        return `(${component.id})`;
    }

    getComponentDisplayMarkingDef(component) {
        let componentDisplay = '';
        let acs = JSON.parse(localStorage.getItem('acs-type')) ?? {};

        // Display as CUI or CONTROLLED if extensions include extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a
        if (component?.extensions?.['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a']) {
            componentDisplay = this.stixService.getCuiDisplay(
                component.extensions['extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a'],
                component.id
            );
        } else {
            componentDisplay = this.getComponentDisplayAcsOrMarkingDef(acs, component);

            if (componentDisplay === 'Federal and non-Federal Entities' && this.stixService.taxiiServerType === 'ais')
                componentDisplay = 'Federal and CISCP';
        }

        return componentDisplay;
    }

    getComponentDisplayArtifact(component) {
        let componentDisplay = '';

        if (component.payload_bin) {
            if (component.hashes) {
                const keys = Object.keys(component.hashes);
                componentDisplay = component.hashes[keys[0]];
            } else {
                componentDisplay = component.id;
            }
        } else {
            componentDisplay = component.url;
        }

        return componentDisplay;
    }

    getComponentDisplayFile(component) {
        let componentDisplay = '';

        if (component.name) componentDisplay = component.name;
        else if (component.hashes) componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayProcess(component) {
        let componentDisplay = '';

        if (component.pid) componentDisplay = component.pid;
        else if (component.cwd) componentDisplay = component.cwd;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayRelationship(component) {
        let componentDisplay = '';

        if (component.source_ref && component.target_ref) {
            let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.source_ref);
            let targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === component.target_ref);
            let sourceDisplay = sourceRefObject.length > 0 ? this.getComponentDisplay(sourceRefObject[0]) : component.source_ref;
            let targetDisplay = targetRefObject.length > 0 ? this.getComponentDisplay(targetRefObject[0]) : component.target_ref;
            let relationship_type = component.relationship_type;

            componentDisplay = `${sourceDisplay} <i>${relationship_type}</i> ${targetDisplay}`;
        } else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayUserAccount(component) {
        let componentDisplay = '';

        if (component.user_id) componentDisplay = component.user_id;
        else if (component.account_login) componentDisplay = component.account_login;
        else if (component.display_name) componentDisplay = component.display_name;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayWindowsRegistryKey(component) {
        let componentDisplay = '';

        if (component.key) componentDisplay = component.key;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayX509(component) {
        let componentDisplay = '';

        if (component.subject) componentDisplay = component.subject;
        else if (component.serial_number) componentDisplay = component.serial_number;
        else if (component.hashes) componentDisplay = `${Object.keys(component.hashes)[0]}: ${component.hashes[Object.keys(component.hashes)[0]]}`;
        else if (component.issuer) componentDisplay = component.issuer;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayObservedString(component) {
        let componentDisplay = '';

        if (component.value) componentDisplay = component.value;
        else componentDisplay = `<NO NAME> (${component.id})`;

        return componentDisplay;
    }

    getComponentDisplayEmailMessage(component) {
        if (component.subject) {
            return `${component.subject}`;
        }

        return `No Subject Included: (${component.id})`;
    }

    getComponentDisplay(component: any): string {
        if (!component?.type) {
            return component?.name ?? '<NO NAME>';
        }

        let componentDisplay = '';
        switch (component.type) {
            case 'marking-definition':
                componentDisplay = this.getComponentDisplayMarkingDef(component);
                break;
            case 'malware-analysis':
                componentDisplay = component.id;
                break;
            case 'artifact':
                componentDisplay = this.getComponentDisplayArtifact(component);
                break;
            case 'autonomous-system':
                componentDisplay = `${component.number} ${component.name ? '(' + component.name + ')' : ''}`;
                break;
            case 'directory':
                componentDisplay = component.path;
                break;
            case 'email-message':
                componentDisplay = this.getComponentDisplayEmailMessage(component);
                break;
            case 'file':
                componentDisplay = this.getComponentDisplayFile(component);
                break;
            case 'domain-name':
            case 'email-addr':
            case 'url':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr':
                componentDisplay = component.value;
                break;
            case 'impact':
                componentDisplay = component.impact_category
                    ? component.impact_category.charAt(0).toUpperCase() + component.impact_category.slice(1)
                    : `(${component.id})`;
                break;
            case 'mutex':
            case 'software':
                componentDisplay = component.name;
                break;
            case 'process':
                componentDisplay = this.getComponentDisplayProcess(component);
                break;
            case 'relationship':
                componentDisplay = this.getComponentDisplayRelationship(component);
                break;
            case 'user-account':
                componentDisplay = this.getComponentDisplayUserAccount(component);
                break;
            case 'windows-registry-key':
                componentDisplay = this.getComponentDisplayWindowsRegistryKey(component);
                break;
            case 'x509-certificate':
                componentDisplay = this.getComponentDisplayX509(component);
                break;
            case 'observed-string':
                componentDisplay = this.getComponentDisplayObservedString(component);
                break;
            default:
                return component.name ? `${component.name}` : `<NO NAME> (${component.id})`;
        }

        return componentDisplay;
    }

    getType(type: string) {
        return type.split('-').reduce((prev, next) => {
            if (prev) prev += ' ';

            return (prev += next.charAt(0).toUpperCase() + next.slice(1));
        }, '');
    }

    toggleExpand(ind) {
        this.expand[ind] = !this.expand[ind];
    }

    getJson(component) {
        return JSON.stringify(component, null, 2);
    }
}
