import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnvService } from '../env-service/env.service';
import { StixService } from '../stix-service.service';
import { AnnouncementService } from '../announcement-service/announcement-service.service';
import { faAngleDoubleUp, faBan, faCheck, faPlay, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { IdentifyStixService } from '../dialogs/copy-paste-dialog/identify-stix/identify-stix.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Bundle } from '../models/bundle';
import { MispService } from '../misp-service/misp.service';
import { MispResultComponent } from './misp-result/misp-result.component';

@Component({
    selector: 'app-misp-dialog',
    templateUrl: './misp-dialog.component.html',
    styleUrls: ['./misp-dialog.component.css'],
    standalone: false,
})
export class MispDialogComponent implements OnInit {
    @ViewChild(MispResultComponent) mispResultComponent!: MispResultComponent;

    faBan = faBan;
    faPlay = faPlay;
    faCheck = faCheck;
    faAngleDoubleUp = faAngleDoubleUp;
    faAngleLeft = faAngleLeft;

    hasResult = false;
    isLoading = false;

    textBody: String = '';

    lineCount = 0;
    linesMax = 100;

    searchFromBundle = false;

    results = [];

    constructor(
        public dialogRef: MatDialogRef<MispDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
        private readonly envService: EnvService,
        public readonly stixService: StixService,
        private readonly announcementService: AnnouncementService,
        private identifyStix: IdentifyStixService,
        private readonly httpClient: HttpClient,
        public readonly mispService: MispService
    ) {}

    ngOnInit(): void {
        if (this.data.search) {
        } else {
        }
    }

    async onParse() {
        try {
            await this.envService.checkAuth('/bundle');
            this.isLoading = true;

            let classification = this.mispService.validateAndClassifyInputs(this.textBody.toString());

            if (classification.invalid.length > 0) {
                const extracted = await this.extractIndicatorsFromText(this.textBody.toString());
                if (extracted) {
                    this.textBody = extracted;
                    classification = this.mispService.validateAndClassifyInputs(extracted);
                }
            }

            if (classification.cidr.length > 0) {
                const cidrList = classification.cidr.join(', ');
                this.announcementService.show(
                    'Invalid Input',
                    `CIDR ranges are not supported, please enter individual IP addresses: ${cidrList}`,
                    'warning',
                    false
                );
                this.isLoading = false;
                return;
            }

            if (classification.invalid.length > 0) {
                const invalidList = classification.invalid.join(', ');
                this.announcementService.show(
                    'Invalid Input',
                    `The following entries are not valid IP addresses or hashes: ${invalidList}`,
                    'warning',
                    false
                );
                if (classification.sha1.length === 0 && classification.sha256.length === 0 && classification.md5.length === 0) {
                    this.isLoading = false;
                    return;
                }
            }

            const totalIndicators = classification.sha1.length + classification.sha256.length + classification.md5.length;
            if (totalIndicators > this.linesMax) {
                this.announcementService.show(
                    'Too Many Indicators',
                    `Found ${totalIndicators} indicators but the maximum is ${this.linesMax}. Please reduce the number of IPs/hashes.`,
                    'warning',
                    false
                );
                this.isLoading = false;
                return;
            }

            const indicators = this.mispService.mapClassification(classification);

            this.results = await this.mispService.searchMisp(indicators);
            this.hasResult = true;
            this.isLoading = false;
        } catch (err) {
            this.announcementService.show('Error while searching', `${err.message}`, 'error', false);
            this.isLoading = false;
        }
    }

    onX() {
        this.dialogRef.close();
    }

    async extractIndicatorsFromText(text: string): Promise<string | null> {
        try {
            const result: any = await this.identifyStix.postIdentifyStix(text);
            if (!result || !result.objects || result.objects.length === 0) {
                return null;
            }

            const values: string[] = [];

            for (const obj of result.objects) {
                switch (obj.type) {
                    case 'ipv4-addr':
                    case 'ipv6-addr':
                        if (obj.value) {
                            values.push(obj.value);
                        }
                        break;
                    case 'file':
                        if (obj.hashes) {
                            const hash =
                                obj.hashes['SHA-256'] ||
                                obj.hashes['SHA-1'] ||
                                obj.hashes['MD5'] ||
                                obj.hashes['SHA-512'] ||
                                obj.hashes['SSDEEP'] ||
                                obj.hashes['TLSH'];
                            if (hash) {
                                values.push(hash);
                            }
                        }
                        break;
                }
            }

            const unique = [...new Set(values)];
            return unique.length > 0 ? unique.join('\n') : null;
        } catch (e) {
            console.error('Error extracting indicators from text:', e);
            return null;
        }
    }

    back() {
        this.hasResult = false;
    }

    import() {
        const objects = this.mispResultComponent.emitStix();
        if (objects.length < 1) {
            this.announcementService.show(
                'No Event was selected to import',
                'No object was selected to import. Please select at least one event and object to import',
                'warning',
                false
            );
            return;
        }

        const tempBundle = new Bundle(objects);
        this.dialogRef.close({ selectedObjects: tempBundle });
    }
}
