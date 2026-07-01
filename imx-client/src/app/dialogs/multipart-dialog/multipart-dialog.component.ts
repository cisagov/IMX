import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';

export interface mulitpartData {
    allowedRefs: [];
    mode: '';
    body: '';
    body_raw_ref: '';
    content_type: '';
    content_disposition: '';
}

@Component({
    selector: 'app-multipart-dialog',
    templateUrl: './multipart-dialog.component.html',
    styleUrls: ['./multipart-dialog.component.css'],
    standalone: false,
})
export class MultipartDialogComponent {
    faPlus = faPlus;
    faBan = faBan;

    modalError: string = '';
    body_ref_error: string = '';

    body: string = '';
    body_raw_ref: string = '';
    content_type: string = '';
    content_disposition: string = '';
    mode: string = '';

    ref_options: string[] = [];

    addEnabled: boolean = false;

    objectRegex = new RegExp(/^(\w[-[a-z0-9]+]*)--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/);
    artifactRegex = new RegExp('^artifact--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
    fileRegex = new RegExp('^file--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<MultipartDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: mulitpartData
    ) {
        this.ref_options = this.data.allowedRefs;
        this.mode = this.data.mode;
        this.body = this.data.body;
        this.body_raw_ref = this.data.body_raw_ref;
        this.content_type = this.data.content_type;
        this.content_disposition = this.data.content_disposition;
    }

    getObjDisplayName(opt: any): string {
        let displayString = '';
        switch (opt.type) {
            case 'malware-analysis':
                return opt.id;

            case 'artifact':
                displayString = (opt.url ? opt.url : '') + (opt.payload_bin ? opt.payload_bin : '');
                break;

            case 'autonomous-system':
                displayString = opt.number + (opt.name ? ' (' + opt.name + ')' : '');
                break;

            case 'directory':
                displayString = opt.path;
                break;

            case 'email-message':
                displayString = opt.subject ? opt.subject : 'No Subject Included';
                break;

            case 'file':
                if (opt.name) displayString = opt.name;
                else if (opt.hashes) displayString = Object.keys(opt.hashes)[0] + ': ' + opt.hashes[Object.keys(opt.hashes)[0]];
                else displayString = '';
                break;

            case 'domain-name':
            case 'email-addr':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr':
            case 'url':
                displayString = opt.value;
                break;

            case 'process':
                if (opt.pid) displayString = opt.pid;
                else if (opt.cwd) displayString = opt.cwd;
                else displayString = '';
                break;

            case 'relationship':
                if (opt.source_ref && opt.target_ref) {
                    let sourceRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === opt.source_ref);
                    let targetRefObject = this.stixService.bundle.objects.filter((obj) => obj.id === opt.target_ref);
                    if (sourceRefObject.length > 0 && targetRefObject.length > 0)
                        displayString =
                            this.getObjDisplayName(sourceRefObject[0]).split('|')[0].trim() +
                            ' -> ' +
                            this.getObjDisplayName(targetRefObject[0]).split('|')[0].trim();
                    else displayString = '';
                } else displayString = '';
                break;

            case 'user-account':
                if (opt.user_id) displayString = opt.user_id;
                else if (opt.account_login) displayString = opt.account_login;
                else if (opt.display_name) displayString = opt.display_name;
                else displayString = '';
                break;

            case 'windows-registry-key':
                if (opt.key) displayString = opt.key;
                else displayString = '';
                break;

            case 'x509-certificate':
                if (opt.subject) displayString = opt.subject;
                else if (opt.serial_number) displayString = opt.serial_number;
                else if (opt.hashes) displayString = Object.keys(opt.hashes)[0] + ': ' + opt.hashes[Object.keys(opt.hashes)[0]];
                else if (opt.issuer) displayString = opt.issuer;
                else displayString = '';
                break;

            case 'attack-pattern':
            case 'campaign':
            case 'course-of-action':
            case 'grouping':
            case 'identity':
            case 'incident':
            case 'indicator':
            case 'infrastructure':
            case 'intrusion-set':
            case 'location':
            case 'malware':
            case 'note':
            case 'observed-data':
            case 'opinion':
            case 'report':
            case 'threat-actor':
            case 'tool':
            case 'vulnerability':
            case 'sighting':
            case 'mutex':
            case 'network-traffic':
            case 'software':
            case 'language-content':
            case 'marking-definition':
            case 'extension-definition':
                displayString = opt.name;
                break;

            default:
                displayString = opt.type;
        }
        if (displayString && displayString.length > 100) displayString = `${displayString.substring(0, 97) + '...'}`;
        if (displayString) return displayString + ' | ' + opt.id;
        else return '<NO NAME> | ' + opt.id;
    }

    onAdd() {
        let result = {};
        if (this.body !== '') result['body'] = this.body;
        if (this.body_raw_ref !== '') result['body_raw_ref'] = this.body_raw_ref;
        if (this.content_type !== '') result['content_type'] = this.content_type;
        if (this.content_disposition !== '') result['content_disposition'] = this.content_disposition;

        this.dialogRef.close(result);
    }

    cancelModal(): void {
        this.dialogRef.close();
    }

    onSelectBodyRawRef(event: any): void {
        const value = event.target.value;
        if (value) {
            this.body_raw_ref = value;
            this.isModalAddEnabled();
        }
    }

    isModalAddEnabled() {
        // Check if both body and body_raw_ref are filled (not allowed per STIX 2.1)
        if (this.body !== '' && this.body_raw_ref !== '') {
            this.modalError = 'Cannot have both Body and Body Raw Ref - please use only one';
            this.body_ref_error = '';
            this.addEnabled = false;
        } else if (this.body_raw_ref !== '' && (this.artifactRegex.test(this.body_raw_ref) || this.fileRegex.test(this.body_raw_ref))) {
            this.modalError = '';
            this.body_ref_error = '';
            this.addEnabled = true;
        } else if (this.body_raw_ref !== '' && !this.artifactRegex.test(this.body_raw_ref) && !this.fileRegex.test(this.body_raw_ref)) {
            this.modalError = '';
            this.body_ref_error = 'Must be a valid Artifact or File ID';
            this.addEnabled = false;
        } else if (this.body_raw_ref === '' && this.body !== '') {
            this.modalError = '';
            this.body_ref_error = '';
            this.addEnabled = true;
        } else {
            this.modalError = 'Either Body or Body Raw Ref is required (but not both)';
            this.body_ref_error = '';
            this.addEnabled = false;
        }
    }
}
