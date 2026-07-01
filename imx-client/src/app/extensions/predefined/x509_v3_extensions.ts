export class X509V3Extensions {
    extension_id: string;
    extension_type: string;
    basic_constraints: string;
    name_constraints: string;
    policy_constraints: string;
    key_usage: string;
    extended_key_usage: string;
    subject_key_identifier: string;
    authority_key_identifier: string;
    subject_alternative_name: string;
    issuer_alternative_name: string;
    subject_directory_attributes: string;
    crl_distribution_points: string;
    inhibit_any_policy: string;
    private_key_usage_period_not_before: string;
    private_key_usage_period_not_after: string;
    certificate_policies: string;
    policy_mappings: string;

    constructor(
        extension_id?: string,
        extension_type?: string,
        basic_constraints?: string,
        name_constraints?: string,
        policy_constraints?: string,
        key_usage?: string,
        extended_key_usage?: string,
        subject_key_identifier?: string,
        authority_key_identifier?: string,
        subject_alternative_name?: string,
        issuer_alternative_name?: string,
        subject_directory_attributes?: string,
        crl_distribution_points?: string,
        inhibit_any_policy?: string,
        private_key_usage_period_not_before?: string,
        private_key_usage_period_not_after?: string,
        certificate_policies?: string,
        policy_mappings?: string
    ) {
        this.extension_id = extension_id || '';
        this.extension_type = extension_type || '';
        this.basic_constraints = basic_constraints || '';
        this.name_constraints = name_constraints || '';
        this.policy_constraints = policy_constraints || '';
        this.key_usage = key_usage || '';
        this.extended_key_usage = extended_key_usage || '';
        this.subject_key_identifier = subject_key_identifier || '';
        this.authority_key_identifier = authority_key_identifier || '';
        this.subject_alternative_name = subject_alternative_name || '';
        this.issuer_alternative_name = issuer_alternative_name || '';
        this.subject_directory_attributes = subject_directory_attributes || '';
        this.crl_distribution_points = crl_distribution_points || '';
        this.inhibit_any_policy = inhibit_any_policy || '';
        this.private_key_usage_period_not_before = private_key_usage_period_not_before || '';
        this.private_key_usage_period_not_after = private_key_usage_period_not_after || '';
        this.certificate_policies = certificate_policies || '';
        this.policy_mappings = policy_mappings || '';
    }

    getGranularMarkingSelectors(): string[] {
        let selectors = [];
        this.basic_constraints ? selectors.push('basic_constraints') : null;
        this.name_constraints ? selectors.push('name_constraints') : null;
        this.policy_constraints ? selectors.push('policy_constraints') : null;
        this.key_usage ? selectors.push('key_usage') : null;
        this.extended_key_usage ? selectors.push('extended_key_usage') : null;
        this.subject_key_identifier ? selectors.push('subject_key_identifier') : null;
        this.authority_key_identifier ? selectors.push('authority_key_identifier') : null;
        this.issuer_alternative_name ? selectors.push('issuer_alternative_name') : null;
        this.crl_distribution_points ? selectors.push('crl_distribution_points') : null;
        this.inhibit_any_policy ? selectors.push('inhibit_any_policy') : null;
        this.private_key_usage_period_not_before ? selectors.push('private_key_usage_period_not_before') : null;
        this.private_key_usage_period_not_after ? selectors.push('private_key_usage_period_not_after') : null;
        this.certificate_policies ? selectors.push('certificate_policies') : null;
        this.policy_mappings ? selectors.push('policy_mappings') : null;
        return selectors;
    }
}
