import { Component, OnInit, ComponentRef } from '@angular/core';
import { QueryStixComponent } from '../query-stix.component';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import { EnvService } from 'src/app/env-service/env.service';

@Component({
    selector: 'app-additional-filters',
    templateUrl: './additional-filters.component.html',
    styleUrls: ['./additional-filters.component.css'],
    standalone: false,
})
export class AdditionalFiltersComponent implements OnInit {
    public unique_key: number;
    public parentRef: QueryStixComponent;
    faTrash = faTrash;
    type = '';
    attributes = [];
    attribute = '';
    value: any;
    sign = '';

    signs: string[] = ['>=', '<=', '='];

    types: string[] = [
        'created by',
        'top-level property',
        'top-level property of type list',
        'property within nested structures',
        'relationships',
        'calculations',
    ];

    identityList: any[] = [];

    relationshipPropertyList: any[] = [
        { key: 'network-traffic', value: ['dst_ref', 'encapsulated_by_ref', 'encapsulates_refs', 'src_ref'] },
        { key: 'malware-analysis', value: ['analysis_sco_refs', 'host_vm_ref', 'installed_software_refs', 'operating_system_ref', 'sample_ref'] },
        { key: 'email-message', value: ['bcc_refs', 'cc_refs', 'from_ref', 'raw_email_ref', 'to_refs'] },
        { key: 'email-address', value: ['belongs_to_ref'] },
        { key: 'ipv4-addr', value: ['belongs_to_refs', 'resolves_to_refs'] },
        { key: 'ipv6-addr', value: ['belongs_to_refs', 'resolves_to_refs'] },
        { key: 'process', value: ['child_refs', 'creator_user_ref', 'image_ref', 'opened_connections_refs', 'parent_ref'] },
        { key: 'directory', value: ['contains_refs'] },
        { key: 'file', value: ['contains_refs', 'content_ref'] },
        { key: 'identity', value: ['created_by_ref'] },
        { key: 'window-registry-key', value: ['created_by_ref', 'creator_user_ref'] },
        { key: 'language-content', value: ['object_ref'] },
        { key: 'grouping', value: ['object_refs'] },
        { key: 'note', value: ['object_refs'] },
        { key: 'observed-data', value: ['object_refs'] },
        { key: 'opinion', value: ['object_refs'] },
        { key: 'report', value: ['object_refs'] },
        { key: 'sighting', value: ['observed_data_refs', 'sighting_of_ref', 'where_sighted_refs'] },
        { key: 'malware', value: ['operating_system_ref', 'operating_system_refs', 'sample_refs'] },
        { key: 'domain-name', value: ['resolves_to_refs'] },
        { key: 'relationship', value: ['source_ref', 'target_ref'] },
        { key: 'network-traffic', value: ['src_ref'] },
    ];

    calculationPropertyList: string[] = ['confidence', 'modified', 'number', 'src_port', 'dst_port', 'valid_until', 'valid_from'];

    tier1PropertyList: string[] = [
        'account_type',
        'confidence',
        'context',
        'data_type',
        'dst_port',
        'encryption_algorithm',
        'identity_class',
        'name',
        'number',
        'option',
        'pattern',
        'pattern_type',
        'primary_motivation',
        'region',
        'relationship_type',
        'resource_level',
        'results',
        'revoked',
        'src_port',
        'sophistication',
        'subject',
        'value',
    ];

    tier2PropertyList: string[] = [
        'aliases',
        'architecture_executions_envs',
        'capabilities',
        'extension_types',
        'implementation_languages',
        'indicator_types',
        'infrastructure_types',
        'labels',
        'malware_types',
        'personal_motivations',
        'report_types',
        'roles',
        'secondary_motivations',
        'sectors',
        'threat_actor_types',
        'tool_types',
    ];

    tier3PropertyList: string[] = [
        'address_family',
        'external_id',
        'MD5',
        'SHA-1',
        'SHA-256',
        'SHA-512',
        'SHA3-256',
        'SHA3-512',
        'SSDEEP',
        'TLSH',
        'integrity_level',
        'pe_type',
        'phase_name',
        'service_status',
        'service_type',
        'socket_type',
        'source_name',
        'start_type',
        'tlp',
    ];

    constructor(
        private stixService: StixService,
        public readonly envService: EnvService
    ) {}

    ngOnInit(): void {
        const idStorage = localStorage.getItem('identities');
        if (idStorage) {
            try {
                this.identityList = JSON.parse(idStorage).arr;
                if (this.stixService.taxiiServerType == 'ais' || this.stixService.taxiiServerType == 'default') {
                    this.envService.env.additionalIdentities?.forEach((identity) => {
                        const found = this.identityList.find((ident) => ident.id == identity.id);

                        if (!found) this.identityList.push(identity);
                    });
                }
            } catch (e) {
                console.error('Error parsing saved identities with message: ', e);
            }
        }
    }

    updateOptions(selection) {
        if (selection === 'created by' || this.type === 'created by') {
            this.sign = '=';
        }
        if (selection === 'relationships' || this.type === 'relationships') {
            this.attributes = [];
            if (this.parentRef.queryParams.type.length > 0) {
                this.parentRef.queryParams.type.forEach((t) => {
                    let index = this.relationshipPropertyList.findIndex((i) => i.key === t);
                    if (index > -1) {
                        this.attributes = this.attributes.concat(this.relationshipPropertyList[index].value);
                    }
                });
            } else {
                this.relationshipPropertyList.forEach((t) => {
                    this.attributes = this.attributes.concat(t.value);
                });
            }

            this.attributes = this.attributes.concat(['making_ref', 'object_marking_refs']);
            this.attributes.sort();

            this.sign = '=';
        }

        if (selection === 'calculations' || this.type === 'calculations') {
            this.signs = ['>=', '<='];
            this.attributes = this.calculationPropertyList;
            if (this.attribute === 'valid_until') {
                this.sign = '>=';
            }

            if (this.attribute === 'valid_from') {
                this.sign = '<=';
            }
        }

        if (selection === 'top-level property' || this.type === 'top-level property') {
            this.attributes = this.tier1PropertyList;
            this.sign = '=';
        }

        if (selection === 'top-level property of type list' || this.type === 'top-level property of type list') {
            this.attributes = this.tier2PropertyList;
            this.sign = '=';
        }

        if (selection === 'property within nested structures' || this.type === 'property within nested structures') {
            this.attributes = this.tier3PropertyList;
            this.sign = '=';
        }

        this.value = null;
    }

    remove_me() {
        console.info('unique_key is: ', this.unique_key);
        this.parentRef.remove(this.unique_key);
    }
}
