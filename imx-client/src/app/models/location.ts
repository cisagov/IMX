import { v4 as uuid } from 'uuid';
import { Observable, of } from 'rxjs';
import { FormModel } from '../dynamic-form-component/form-model';
import { QuestionBase } from '../dynamic-form-component/question-base';
import { DatetimeQuestion } from '../dynamic-form-component/question-types/question-datepicker';
import { DropdownQuestion } from '../dynamic-form-component/question-types/question-dropdown';
import { TextboxQuestion } from '../dynamic-form-component/question-types/question-textbox';
import { IdentityQuestion } from '../dynamic-form-component/question-types/question-identity';
import { ExternalReference } from './external-reference';
import { GranularMarking } from './granular-marking';
import { Extension } from './extension';
import { StringArrayQuestion } from '../dynamic-form-component/question-types/question-string-array';
import { StixService } from '../stix-service.service';
import { COUNTRIES } from './countries';
import { LANGUAGES } from './languages';
import { Content } from './content';
import { Window } from './window';

export class Location extends FormModel {
    type?: string;
    id?: string;
    spec_version?: string;
    created?: string;
    modified?: string;
    created_by_ref?: string;
    revoked?: boolean;
    labels?: string[];
    confidence?: number;
    lang?: string;
    indicator_types?: string[];
    external_references?: ExternalReference[];
    object_marking_refs?: string[];
    granular_markings?: GranularMarking[];
    extensions?: Extension[];
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    precision?: number;
    region?: string;
    country?: string;
    administrative_area?: string;
    city?: string;
    street_address?: string;
    postal_code?: string;
    loaded?: boolean = false;

    constructor(
        public stixService: StixService,
        type?: string | '',
        id?: string | '',
        spec_version?: string | '',
        created?: string | '',
        modified?: string | '',
        created_by_ref?: string | '',
        revoked?: boolean,
        labels?: string[] | [],
        confidence?: number,
        lang?: string | '',
        indicator_types?: string[] | [],
        external_references?: ExternalReference[] | [],
        object_marking_refs?: string[] | [],
        granular_markings?: GranularMarking[] | [],
        extensions?: Extension[] | [],
        name?: string | '',
        description?: string | '',
        latitude?: number,
        longitude?: number,
        precision?: number,
        region?: string | '',
        country?: string | '',
        administrative_area?: string | '',
        city?: string | '',
        street_address?: string | '',
        postal_code?: string | ''
    ) {
        super();
        this.type = type;
        this.id = id;
        this.spec_version = spec_version;
        this.created = created;
        this.modified = modified;
        this.created_by_ref = created_by_ref;
        this.revoked = revoked;
        this.labels = labels;
        this.confidence = confidence;
        this.lang = lang;
        this.indicator_types = indicator_types;
        this.external_references = external_references;
        this.object_marking_refs = object_marking_refs;
        this.granular_markings = granular_markings;
        this.extensions = extensions;
        this.name = name;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.precision = precision;
        this.region = region;
        this.country = country;
        this.administrative_area = administrative_area;
        this.city = city;
        this.street_address = street_address;
        this.postal_code = postal_code;
    }

    getWindows(): Window[] {
        return [];
    }
    getExternalReferences(): ExternalReference[] {
        return this.external_references || [];
    }

    getContents(): Content[] {
        return [];
    }

    getGranularMarkings(): GranularMarking[] {
        return this.granular_markings || [];
    }
    getExtensions(): Extension[] {
        return this.extensions || [];
    }

    getQuestions(): QuestionBase<any>[] {
        let questions: QuestionBase<any>[] = [
            new TextboxQuestion({
                key: 'type',
                label: 'Type',
                value: 'location',
                required: true,
                order: 2,
                type: 'text',
                readonly: true,
                columnWidth: 'col-2 type',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'id',
                label: 'ID',
                value: `location--${uuid()}`,
                validatorFn: (componentData: any) => {
                    const id = componentData.id;
                    const idRegex = new RegExp('^location--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$');
                    if (!idRegex.test(id))
                        return {
                            valid: false,
                            errorMessage: "Must begin with 'location--' and followed by a UUID (i.e. opinion--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                        };
                    return {
                        valid: true,
                    };
                },
                required: true,
                order: 1,
                type: 'text',
                readonly: true,
                columnWidth: 'col-5 id',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'spec_version',
                label: 'Spec Ver.',
                value: '2.1',
                readonly: true,
                columnWidth: 'col-1 spec-version',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 3,
            }),
            new DatetimeQuestion({
                key: 'created',
                label: 'Created*',
                columnWidth: 'col-2 created',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 4,
            }),
            new DatetimeQuestion({
                key: 'modified',
                label: 'Modified*',
                validatorFn: (componentData: any) => {
                    // Check whether Modified Date is equal or after to Created Date
                    let createdDateTime = Date.parse(componentData['created']);
                    let modifiedDateTime = Date.parse(componentData['modified']);

                    if (modifiedDateTime && modifiedDateTime < createdDateTime && !this.stixService.newObject) {
                        return {
                            valid: false,
                            errorMessage: 'Modified date must be after created date.',
                        };
                    }

                    return {
                        valid: true,
                    };
                },
                columnWidth: 'col-2 modified',
                nonGuidedCol: 'col-6 pe-5',
                required: true,
                order: 5,
            }),
            new TextboxQuestion({
                key: 'name',
                label: 'Name',
                order: 6,
                required: false,
                columnWidth: 'col-3 name',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'description',
                label: 'Description',
                order: 7,
                required: false,
                columnWidth: 'col-12',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'confidence',
                label: 'Confidence',
                validatorFn: (componentData: any) => {
                    const confidence = componentData.confidence;
                    const confidenceRegex = new RegExp('^[1-9]?[0-9]{1}$|^100$');
                    if (confidence && !confidenceRegex.test(confidence))
                        return {
                            valid: false,
                            errorMessage: 'Confidence value MUST be a number in the range of 0-100',
                        };

                    return {
                        valid: true,
                    };
                },
                type: 'number',
                order: 8,
                required: false,
                columnWidth: 'col-2 confidence',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new IdentityQuestion({
                key: 'created_by_ref',
                label: 'Created By Ref',
                validatorFn: (componentData: any) => {
                    const created_by_ref = componentData.created_by_ref;
                    const created_by_refRegex = new RegExp('identity--[0-9a-f]{8}\-[0-9a-f]{4}\-[45][0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}');
                    if (created_by_ref != '') {
                        if (!created_by_refRegex.test(created_by_ref))
                            return {
                                valid: false,
                                errorMessage:
                                    "Must begin with 'identity--' and followed by a UUID (i.e. identity--d9fc3f18-80c9-4a40-a4fc-8a6aca45c20e)",
                            };
                    }
                    return {
                        valid: true,
                    };
                },
                relString: this.created_by_ref,
                order: 11,
                required: false,
                columnWidth: 'col-4 created-by-ref',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'lang',
                label: 'Language',
                options: LANGUAGES,
                order: 10,
                required: false,
                columnWidth: 'col-3 language',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new DropdownQuestion({
                key: 'revoked',
                label: 'Revoked',
                options: [
                    { key: 'true', value: 'True' },
                    { key: 'false', value: 'False' },
                ],
                columnWidth: 'col-6',
                revokedCol: 'col-12 pe-5',
                order: 99,
            }),
            new DropdownQuestion({
                key: 'region',
                label: 'Region',

                options: [
                    { key: 'eastern-africa', value: 'Eastern Africa' },
                    { key: 'middle-africa', value: 'Middle Africa' },
                    { key: 'northern-africa', value: 'Northern Africa' },
                    { key: 'southern-africa', value: 'Southern Africa' },
                    { key: 'western-africa', value: 'Western Africa' },
                    { key: 'caribbean', value: 'Caribbean' },
                    { key: 'central-america', value: 'Central America' },
                    { key: 'latin-america-caribbean', value: 'Latin America Caribbean' },
                    { key: 'northern-america', value: 'Northern America' },
                    { key: 'south-america', value: 'South America' },
                    { key: 'central-asia', value: 'Central Asia' },
                    { key: 'eastern-asia', value: 'Eastern Asia' },
                    { key: 'southern-asia', value: 'Southern Asia' },
                    { key: 'south-eastern-asia', value: 'South Eastern Asia' },
                    { key: 'western-asia', value: 'Western Asia' },
                    { key: 'eastern-europe', value: 'Eastern Europe' },
                    { key: 'northern-europe', value: 'Northern Europe' },
                    { key: 'southern-europe', value: 'Southern Europe' },
                    { key: 'western-europe', value: 'Western Europe' },
                    { key: 'antarctica', value: 'Antarctica' },
                    { key: 'australia-new-zealand', value: 'Australia New Zealand' },
                    { key: 'melanesia', value: 'Melanesia' },
                    { key: 'micronesia', value: 'Micronesia' },
                    { key: 'polynesia', value: 'Polynesia' },
                ],
                validatorFn: (componentData: any) => {
                    const country = componentData.region;
                    const region = componentData['country'];
                    const latitude = componentData['latitude'];
                    const longitude = componentData['longitude'];

                    if ((!country || country == '') && (!region || region == '') && !latitude && !longitude)
                        return {
                            valid: false,
                            errorMessage: 'Country, Region, or Lat/Long is required',
                        };

                    return {
                        valid: true,
                    };
                },

                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
                order: 12,
            }),
            new TextboxQuestion({
                key: 'latitude',
                label: 'Latitiude',
                validatorFn: (componentData: any) => {
                    const latitude = componentData.latitude;
                    const region = componentData['region'];
                    const country = componentData['country'];
                    const longitude = componentData['longitude'];

                    if ((!country || country == '') && (!region || region == '') && !latitude && !longitude)
                        return {
                            valid: false,
                            errorMessage: 'Country, Region, or Lat/Long is required',
                        };

                    const latitudeRegex = new RegExp(/^-?(90(\.0+)?|(([0-8]\d)|([0-1]?\d))(\.\d+)?)$/);

                    if (latitude != '') {
                        if (!latitudeRegex.test(latitude))
                            return {
                                valid: false,
                                errorMessage: 'Must be in range -90 to 90 degrees',
                            };
                        if (componentData.latitude && !componentData['longitude']) {
                            return {
                                valid: false,
                                errorMessage: 'Longitude required when a Latitude is provided',
                            };
                        }
                    }
                    return {
                        valid: true,
                    };
                },
                order: 14,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                type: 'number',
            }),
            new TextboxQuestion({
                key: 'longitude',
                label: 'Longitude',
                validatorFn: (componentData: any) => {
                    const longitude = componentData.longitude;
                    const region = componentData['region'];
                    const country = componentData['country'];
                    const latitude = componentData['latitude'];
                    if ((!country || country == '') && (!region || region == '') && !latitude && !longitude)
                        return {
                            valid: false,
                            errorMessage: 'Country, Region, or Lat/Long is required',
                        };

                    const longitudeRegex = new RegExp(/^-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);

                    if (longitude != '') {
                        if (!longitudeRegex.test(longitude))
                            return {
                                valid: false,
                                errorMessage: 'Must be in range -180 to 180 degrees',
                            };
                        if (componentData.longitude && !componentData['latitude']) {
                            return {
                                valid: false,
                                errorMessage: 'Latitude required when a Longitude is provided',
                            };
                        }
                    }
                    return {
                        valid: true,
                    };
                },
                order: 15,
                required: false,
                columnWidth: 'col-4',
                nonGuidedCol: 'col-6 pe-5',
                type: 'number',
            }),
            new DropdownQuestion({
                key: 'country',
                label: 'Country',
                options: COUNTRIES,
                validatorFn: (componentData: any) => {
                    const country = componentData.country;
                    const region = componentData.region;
                    const longitude = componentData['longitude'];
                    const latitude = componentData['latitude'];
                    if ((!country || country == '') && (!region || region == '') && !latitude && !longitude)
                        return {
                            valid: false,
                            errorMessage: 'Country, Region or Lat/Long is required',
                        };
                    return {
                        valid: true,
                    };
                },
                order: 13,
                required: false,
                columnWidth: 'col-6',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'precision',
                label: 'Precision',
                validatorFn: (componentData: any) => {
                    if (componentData.precision) {
                        if (componentData.precision && !componentData['latitude']) {
                            return {
                                valid: false,
                                errorMessage: 'Lat/Long required when precision is provided',
                            };
                        }
                    }
                    if (componentData.precision) {
                        if (componentData.precision && !componentData['longitude']) {
                            return {
                                valid: false,
                                errorMessage: 'Lat/Long required when precision is provided',
                            };
                        }
                    }

                    return {
                        valid: true,
                    };
                },
                order: 16,
                required: false,
                nonGuidedCol: 'col-6 pe-5',
                columnWidth: 'col-4',
                type: 'number',
            }),
            new TextboxQuestion({
                key: 'street_address',
                label: 'Street Address',
                order: 18,
                required: false,
                columnWidth: 'col-5 address',
                nonGuidedCol: 'col-12 pe-5',
            }),
            new TextboxQuestion({
                key: 'administrative_area',
                label: 'Administrative Area',
                validatorFn: (componentData: any) => {
                    const administrative_area = componentData.administrative_area;
                    const administrative_areaRegex = new RegExp(
                        'AD-..|ad-..|AE-..|ae-..|AF-..|af-..|AG-..|ag-..|AI-..|ai-..|AL-..|al-..|AM-..|am-..|AO-..|ao-..|AQ-..|aq-..|AR-..|ar-..|AS-..|as-..|AT-..|at-..|AU-..|au-..|AW-..|aw-..|AX-..|ax-..|AZ-..|az-..|BA-..|ba-..|BB-..|bb-..|BD-..|bd-..|BE-..|be-..|BF-..|bf-..|BG-..|bg-..|BH-..|bh-..|BI-..|bi-..|BJ-..|bj-..|BL-..|bl-..|BM-..|bm-..|BN-..|bn-..|BO-..|bo-..|BQ-..|bq-..|BR-..|br-..|BS-..|bs-..|BT-..|bt-..|BV-..|bv-..|BW-..|bw-..|BY-..|by-..|BZ-..|bz-..|CA-..|ca-..|CC-..|cd-..|CF-..|cf-..|CG-..|cg-..|CH-..|ch-..|CI-..|ci-..|CK-..|ck-..|CL-..|cl-..|CM-..|cm-..|CN-..|cn-..|CO-..|co-..|CR-..|cr-..|CU-..|cu-..|CV-..|cv-..|CW-..|cw-..|CX-..|cx-..|CY-..|cy-..|CZ-..|cz-..|DE-..|de-..|DJ-..|dj-..|DK-..|dk-..|DM-..|dm-..|DO-..|do-..|DZ-..|dz-..|EC-..|ec-..|EE-..|ee-..|EG-..|eg-..|EH-..|eh-..|ER-..|er-..|ES-..|es-..|ET-..|et-..|FI-..|fi-..|FJ-..|fj-..|FK-..|fk-..|FM-..|fm-..|FO-..|fo-..|FR-..|fr-..|GA-..|ga-..|GB-..|gb-..|GD-..|gd-..|GE-..|ge-..|GF-..|gf-..|GG-..|gg-..|GH-..|gh-..|GI-..|gi-..|GL-..|gl-..|GM-..|gm-..|GN-..|gn-..|GP-..|gp-..|GQ-..|gq-..|GR-..|gr-..|GS-..|gs-..|GT-..|gt-..|GU-..|gu-..|GW-..|gw-..|GY-..|gy-..|HK-..|hk-..|HM-..|hm-..|HN-..|hn-..|HR-..|hr-..|HT-..|ht-..|HU-..|hu-..|ID-..|id-..|IE-..|ie-..|IL-..|il-..|IM-..|im-..|IN-..|in-..|IO-..|io-..|IQ-..|iq-..|IR-..|ir-..|IS-..|is-..|IT-..|it-..|JE-..|je-..|JM-..|jm-..|JO-..|jo-..|JP-..|jp-..|KE-..|ke-..|KG-..|kg-..|KH-..|kh-..|KI-..|ki-..|KM-..|km-..|KN-..|kn-..|KP-..|kp-..|KR-..|kr-..|KW-..|kw-..|KY-..|ky-..|KZ-..|kz-..|LA-..|la-..|LB-..|lb-..|LC-..|lc-..|LI-..|li-..|LK-..|lk-..|LR-..|lr-..|LS-..|ls-..|LT-..|lt-..|LU-..|lu-..|LV-..|lv-..|LY-..|ly-..|MA-..|ma-..|MC-..|mc-..|MD-..|md-..|ME-..|me-..|MF-..|mf-..|MG-..|mg-..|MH-..|mh-..|MK-..|mk-..|ML-..|ml-..|MM-..|mm-..|MN-..|mn-..|MO-..|mo-..|MP-..|mp-..|MQ-..|mq-..|MR-..|mr-..|MS-..|ms-..|MT-..|mt-..|MU-..|mu-..|MV-..|mv-..|MW-..|mw-..|MX-..|mx-..|MY-..|my-..|MZ-..|mz-..|NA-..|na-..|NC-..|nc-..|NE-..|ne-..|NF-..|nf-..|NG-..|ng-..|NI-..|ni-..|NL-..|nl-..|NO-..|no-..|NP-..|np-..|NR-..|nr-..|NU-..|nu-..|NZ-..|nz-..|OM-..|om-..|PA-..|pa-..|PE-..|pe-..|PF-..|pf-..|PG-..|pg-..|PH-..|ph-..|PK-..|pk-..|PL-..|pl-..|PM-..|pm-..|PN-..|pn-..|PR-..|pr-..|PS-..|ps-..|PT-..|pt-..|PW-..|pw-..|PY-..|py-..|QA-..|qa-..|RE-..|re-..|RO-..|ro-..|RS-..|rs-..|RU-..|ru-..|RW-..|rw-..|SA-..|sa-..|SB-..|sb-..|SC-..|sc-..|SD-..|sd-..|SE-..|se-..|SG-..|sg-..|SH-..|sh-..|SI-..|si-..|SJ-..|sj-..|SK-..|sk-..|SL-..|sl-..|SM-..|sm-..|SN-..|sn-..|SO-..|so-..|SR-..|sr-..|SS-..|ss-..|ST-..|st-..|SV-..|sv-..|SX-..|sx-..|SY-..|sy-..|SZ-..|sz-..|TC-..|tc-..|TD-..|td-..|TF-..|tf-..|TG-..|tg-..|TH-..|th-..|Th-..|TJ-..|tj-..|TK-..|tk-..|TL-..|tl-..|TM-..|tm-..|TN-..|tn-..|TO-..|to-..|TR-..|tr-..|TT-..|tt-..|TV-..|tv-..|TW-..|tw-..|TZ-..|tz-..|UA-..|ua-..|UG-..|ug-..|UM-..|um-..|US-..|us-..|UY-..|uy-..|UZ-..|uz-..|VA-..|va-..|VC-..|vc-..|VE-..|ve-..|VG-..|vg-..|VI-..|vi-..|VN-..|vn-..|VU-..|vu-..|WF-..|wf-..|WS-..|ws-..|YE-..|ye-..|YT-..|yt-..|ZA-..|za-..|ZM-..|zm-..|ZW-..|zw-..'
                    );
                    if (administrative_area && !administrative_areaRegex.test(administrative_area))
                        return {
                            valid: false,
                            errorMessage: 'Should be a valid ISO 3166-2 Code ex:ad-00.',
                        };

                    return {
                        valid: true,
                    };
                },
                order: 17,
                required: false,
                columnWidth: 'col-3 area',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'city',
                label: 'City',
                order: 19,
                required: false,
                columnWidth: 'col-2 city',
                nonGuidedCol: 'col-6 pe-5',
            }),
            new TextboxQuestion({
                key: 'postal_code',
                label: 'Postal Code',
                order: 20,
                required: false,
                columnWidth: 'col-2 postal',
                nonGuidedCol: 'col-6 pe-5',
            }),
        ];

        return questions.sort((a, b) => a.order - b.order);
    }
    hasX509V3Extensions(): boolean {
        return false;
    }

    hasWindows(): boolean {
        return false;
    }
    hasContents(): boolean {
        return false;
    }

    hasExternalReferences(): boolean {
        return true;
    }

    hasGranularMarkings(): boolean {
        return true;
    }

    hasExtensions(): boolean {
        return true;
    }

    hasObjectMarkingReferences(): boolean {
        return true;
    }

    populateFromJSON(componentData: any, stixService: StixService): void {
        this.type = componentData.type;
        this.id = componentData.id;
        this.created_by_ref = componentData.created_by_ref;
        this.spec_version = componentData.spec_version;
        this.name = componentData.name;
        this.description = componentData.description;
        this.confidence = parseInt(componentData.confidence) || undefined;
        this.created = componentData.created;
        this.modified = componentData.modified;
        this.revoked = JSON.parse(componentData.revoked[0] || '""');
        this.lang = componentData.lang[0];
        this.external_references = componentData.external_references;
        this.labels = stixService.stringArrays.get('labels') || [];
        this.object_marking_refs = componentData.object_marking_refs;
        this.granular_markings = componentData.granular_markings;
        this.extensions = componentData.extensions;
        this.longitude = JSON.parse(componentData.longitude || '""');
        this.latitude = JSON.parse(componentData.latitude || '""');
        this.precision = parseInt(componentData.precision) || undefined;
        this.region = componentData.region[0];
        this.country = componentData.country[0];
        this.administrative_area = componentData.administrative_area;
        this.city = componentData.city;
        this.street_address = componentData.street_address;
        this.postal_code = componentData.postal_code;
    }
    setWindows(newWindows: Window[]): void {
        // N/a
    }

    setContents(newContents: Content[]): void {
        // N/a
    }

    setExternalReferences(newExternalReferences: ExternalReference[]): void {
        this.external_references = newExternalReferences;
    }

    setGranularMarkings(newGranularMarkings: GranularMarking[]): void {
        this.granular_markings = newGranularMarkings;
    }

    setExtensions(newExtensions: Extension[]): void {
        this.extensions = newExtensions;
    }
    setObjectMarkingRefs(newObjectMarkingRefs: string[]): void {
        this.object_marking_refs = newObjectMarkingRefs;
    }
}
