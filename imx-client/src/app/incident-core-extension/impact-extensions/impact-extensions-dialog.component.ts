import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StixService } from 'src/app/stix-service.service';
import { faPlus, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export interface IncidentCoreExtensionData {
    curr: null;
}

@Component({
    selector: 'impact-extensions-dialog',
    templateUrl: './impact-extensions-dialog.component.html',
    styleUrls: ['./impact-extensions-dialog.component.css'],
    standalone: false,
})
export class ImpactExtensionsDialogComponent implements OnInit {
    faPlus = faPlus;
    faTrash = faTrash;
    faInfoCircle = faInfoCircle;

    type: string = 'availability';
    currentExtension: any = {};

    errorMessage = '';
    errors = {};
    state_change_type: string = '';
    initial_ref: string = '';
    result_ref: string = '';
    isAddingIncidentCoreExtension = true;

    refIds: string[] = [];

    incidentConfidentialityLossEnum = ['confirmed-loss', 'contained', 'exploited-loss', 'none', 'suspected-loss'];

    informationTypeOV = [
        'classified-material',
        'communication',
        'credentials-admin',
        'credentials-user',
        'financial',
        'legal',
        'payment',
        'phi',
        'pii',
        'proprietary',
        'system',
    ];

    externalImpactOV = [
        'economic',
        'emergency-services',
        'foreign-relations',
        'national-security',
        'public-confidence',
        'public-health',
        'public-safety',
    ];

    integrityAlterationEnum = [
        'potential-destruction',
        'potential-modification',
        'partial-destruction',
        'partial-modification',
        'full-destruction',
        'full-modification',
        'none',
    ];

    monetaryImpactTypeOV = [
        'asset-and-fraud',
        'brand-damage',
        'business-disruption',
        'competitive-advantage',
        'legal-and-regulatory',
        'operating-costs',
        'ransom-demand',
        'ransom-payment',
        'response-and-recovery',
        'uncategorized',
    ];

    physicalImpactEnum = ['damaged-functional', 'damaged-nonfunctional', 'destruction', 'none', 'unknown'];

    assetTypeOV = [
        'building-doors',
        'building-windows',
        'buildings',
        'computers-mobile',
        'computers-personal',
        'computers-server',
        'environment',
        'ics-actuator',
        'ics-engineering-workstation',
        'ics-historian',
        'ics-hmi',
        'ics-other',
        'ics-plc',
        'ics-safety-system',
        'ics-sensor',
        'inventory',
        'network-device',
        'private-infrastructure',
        'public-infrastructure',
        'security-containers',
        'vehicles',
    ];

    traceabilityEnum = ['accountability-lost', 'partial-accountability', 'provable-accountability'];

    currencyCodes = [
        'AED',
        'AFN',
        'ALL',
        'AMD',
        'ANG',
        'AOA',
        'ARS',
        'AUD',
        'AWG',
        'AZN',
        'BAM',
        'BBD',
        'BDT',
        'BGN',
        'BHD',
        'BIF',
        'BMD',
        'BND',
        'BOB',
        'BOV',
        'BRL',
        'BSD',
        'BTN',
        'BWP',
        'BYN',
        'BZD',
        'CAD',
        'CDF',
        'CHE',
        'CHF',
        'CHW',
        'CLF',
        'CLP',
        'CNY',
        'COP',
        'COU',
        'CRC',
        'CUP',
        'CVE',
        'CZK',
        'DJF',
        'DKK',
        'DOP',
        'DZD',
        'EGP',
        'ERN',
        'ETB',
        'EUR',
        'FJD',
        'FKP',
        'GBP',
        'GEL',
        'GHS',
        'GIP',
        'GMD',
        'GNF',
        'GTQ',
        'GYD',
        'HKD',
        'HNL',
        'HTG',
        'HUF',
        'IDR',
        'ILS',
        'INR',
        'IQD',
        'IRR',
        'ISK',
        'JMD',
        'JOD',
        'JPY',
        'KES',
        'KGS',
        'KHR',
        'KMF',
        'KPW',
        'KRW',
        'KWD',
        'KYD',
        'KZT',
        'LAK',
        'LBP',
        'LKR',
        'LRD',
        'LSL',
        'LYD',
        'MAD',
        'MDL',
        'MGA',
        'MKD',
        'MMK',
        'MNT',
        'MOP',
        'MRU',
        'MUR',
        'MVR',
        'MWK',
        'MXN',
        'MXV',
        'MYR',
        'MWK',
        'MXN',
        'MXV',
        'MYR',
        'MZN',
        'NAD',
        'NGN',
        'NIO',
        'NOK',
        'NPR',
        'NZD',
        'OMR',
        'PAB',
        'PEN',
        'PEK',
        'PGK',
        'PHP',
        'PKR',
        'PLN',
        'PYG',
        'QAR',
        'RON',
        'RSD',
        'RUB',
        'RWF',
        'SAR',
        'SBD',
        'SCR',
        'SDG',
        'SEK',
        'SGD',
        'SHP',
        'SLE',
        'SOS',
        'SRD',
        'SSP',
        'STN',
        'SVC',
        'SYP',
        'SZL',
        'THB',
        'TJS',
        'TMT',
        'TND',
        'TOP',
        'TRY',
        'TTD',
        'TWD',
        'TZS',
        'UAH',
        'UGX',
        'USD',
        'USN',
        'UYI',
        'UYU',
        'UYW',
        'UZS',
        'VED',
        'VES',
        'VND',
        'VUV',
        'WST',
        'XAF',
        'XAG',
        'XAU',
        'XBA',
        'XBB',
        'XBC',
        'XBD',
        'XCD',
        'XDR',
        'XOF',
        'XPD',
        'XPF',
        'XPT',
        'XSU',
        'XTS',
        'XUA',
        'XXX',
        'YER',
        'ZAR',
        'ZMW',
        'ZWG',
    ];

    constructor(
        public stixService: StixService,
        public dialogRef: MatDialogRef<ImpactExtensionsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IncidentCoreExtensionData
    ) {
        this.errorMessage = '';
        this.type = data['type'];
        this.type = this.type.substring(0, this.type.length - 4);
        this.refIds = this.stixService.bundle.objects.map((o) => o.id);

        if (data['extension']) {
            this.currentExtension = JSON.parse(JSON.stringify(data['extension']));
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onX(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        let temp = {};
        for (let prop in this.currentExtension) {
            if (this.currentExtension[prop] == null) {
                delete this.currentExtension[prop];
            }
        }
        temp[this.type + '-ext'] = this.currentExtension;
        if (this.data['extension'] && this.data['index'] !== undefined) {
            this.stixService.extensions[this.data['index']] = temp;
        } else {
            this.stixService.extensions.push(temp);
        }
        this.dialogRef.close(this.currentExtension);
    }

    // For later validation
    isValid(): any {
        const md_Regex = new RegExp('marking-definition--[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');

        let ret;
        switch (this.type) {
            case 'availability':
                if (this.currentExtension['availability_impact'] > 100 || this.currentExtension['availability_impact'] < 0) {
                    this.errors['availability_impact'] = 'Availability Impact must be between 0 and 100';
                    return false;
                }
                delete this.errors['availability_impact'];
                if (!this.currentExtension['availability_impact']) {
                    return false;
                }
                break;
            case 'confidentiality':
                ret = true;
                let loss = this.currentExtension['loss_type'];
                if (loss && loss != 'none' && !this.currentExtension['information_type']) {
                    this.errors['information_type'] = "Must be present when Loss Type is not 'None'";
                    ret = false;
                } else {
                    delete this.errors['information_type'];
                }
                if (this.currentExtension['record_count'] && this.currentExtension['record_count'] < 0) {
                    this.errors['record_count'] = 'Must not be negative';
                    ret = false;
                } else {
                    delete this.errors['record_count'];
                }
                if (this.currentExtension['record_size'] && this.currentExtension['record_size'] < 0) {
                    this.errors['record_size'] = 'Must not be negative';
                    ret = false;
                } else {
                    delete this.errors['record_size'];
                }

                if (!loss) {
                    ret = false;
                }
                return ret;
            case 'external':
                if (!this.currentExtension['impact_type']) {
                    return false;
                }
                break;
            case 'integrity':
                ret = true;
                let alt = this.currentExtension['alteration'];
                if (alt && alt != 'none' && !this.currentExtension['information_type']) {
                    this.errors['information_type'] = "Must be present when Alteration is not 'None'";
                    ret = false;
                } else {
                    delete this.errors['information_type'];
                }
                if (this.currentExtension['record_count'] && this.currentExtension['record_count'] < 0) {
                    this.errors['record_count'] = 'Must not be negative';
                    ret = false;
                } else {
                    delete this.errors['record_count'];
                }
                if (this.currentExtension['record_size'] && this.currentExtension['record_size'] < 0) {
                    this.errors['record_size'] = 'Must not be negative';
                    ret = false;
                } else {
                    delete this.errors['record_size'];
                }

                if (!alt) {
                    ret = false;
                }
                return ret;
            case 'monetary':
                ret = true;
                if (this.currentExtension['conversion_rate']) {
                    if (!this.currentExtension['currency_actual']) {
                        this.errors['conversion_rate'] = 'May not be used if Currency Actual not present';
                        ret = false;
                    } else if (this.currentExtension['conversion_rate'] < 0) {
                        this.errors['conversion_rate'] = 'Must not be negative';
                        ret = false;
                    } else {
                        delete this.errors['conversion_rate'];
                    }
                    if (!this.currentExtension['conversion_time']) {
                        this.errors['conversion_time'] = 'Must be populated if Conversion Rate is populated';
                    }
                } else if (!this.currentExtension['currency_actual']) {
                    delete this.errors['conversion_rate'];
                } else {
                    this.errors['conversion_rate'] = 'Must be populated if Currency Actual is Present';
                }

                if (this.currentExtension['conversion_time']) {
                    delete this.errors['conversion_time'];
                }
                if (
                    !this.currentExtension['currency'] &&
                    (this.currentExtension['currency_actual'] || this.currentExtension['min_amount'] || this.currentExtension['max_amount'])
                ) {
                    this.errors['currency'] = 'Must be populated if Currency Actual or Min/Max Amount are present';
                    ret = false;
                } else {
                    delete this.errors['currency'];
                }

                let min = this.currentExtension['min_amount'];
                let max = this.currentExtension['max_amount'];
                if (max) {
                    if (max < 0) {
                        this.errors['max_amount'] = 'Must not be negative';
                        ret = false;
                    } else {
                        delete this.errors['max_amount'];
                    }
                }
                if (min) {
                    if (!max) {
                        this.errors['max_amount'] = 'Must be populated if Min Amount is present';
                        ret = false;
                    } else if (max < min) {
                        this.errors['max_amount'] = 'Must be equal to or greater than Min Amount';
                        ret = false;
                    }

                    if (min < 0) {
                        this.errors['min_amount'] = 'Must not be negative';
                        ret = false;
                    } else {
                        delete this.errors['min_amount'];
                    }
                }
                if (max && !min) {
                    this.errors['min_amount'] = 'Must be populated if Max Amount is present';
                    ret = false;
                } else {
                    delete this.errors['min_amount'];
                }

                if (!this.currentExtension['variety']) {
                    ret = false;
                }
                return ret;
            case 'physical':
                ret = true;
                if (this.currentExtension['impact_type'] && this.currentExtension['impact_type'] != 'none' && !this.currentExtension['asset_type']) {
                    this.errors['asset_type'] = "Must be present when Impact Type is not 'None'";
                    ret = false;
                } else {
                    delete this.errors['asset_type'];
                }

                if (!this.currentExtension['impact_type']) {
                    ret = false;
                }
                return ret;
            case 'traceability':
                if (!this.currentExtension['traceability_impact']) {
                    return false;
                }
                break;
        }

        return true;
    }

    ngOnInit(): void {}
}
