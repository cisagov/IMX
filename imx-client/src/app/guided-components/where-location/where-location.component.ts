import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { faGlobe, faMapPin, faBan, faCheck, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { COUNTRIES } from 'src/app/models/countries';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-where-location',
    templateUrl: './where-location.component.html',
    styleUrls: ['./where-location.component.css'],
    standalone: false,
})
export class WhereLocationComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Input() patternBuilderEvent: EventEmitter<string>;
    @Output() changePage = new EventEmitter<any>();

    component: string = 'where-location';

    private cartSubscriptions: Subscription[] = [];

    faMapPin = faMapPin;
    faBan = faBan;
    faCheck = faCheck;
    faInfoCircle = faInfoCircle;
    faGlobe = faGlobe;
    faQuestionCircle = faQuestionCircle;

    activeTab: string = null;

    modalRef: NgbModalRef;

    target = {
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        street_address: '',
        administrative_area: '',
        city: '',
        postal_code: '',
        description: '',
    };

    attacker = {
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        street_address: '',
        administrative_area: '',
        city: '',
        postal_code: '',
        description: '',
    };

    currentTarget = '';
    currentAttacker = '';

    longError: string = '';
    latError: string = '';
    areaError: string = '';

    //isFormEnabled: boolean;
    isTargetTabEnabled = true;
    isAttackerTabEnabled = true;
    isOptionalEnabled: boolean = false;
    editMode = false;

    regionOptions: any[] = [
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
    ];
    countryOptions: any[] = COUNTRIES;

    constructor(
        public guidedService: GuidedService,
        private stixService: StixService,
        private clearCartDialog: NgbModal
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    addCartItem(event) {
        if (event === true) {
            this.reset();
            return;
        }

        let location = {
            type: 'location',
            description: this.activeTab,
        };
        let temp: any = {};

        switch (this.activeTab) {
            case 'target':
                temp = this.target;
                break;
            case 'attacker':
                temp = this.attacker;
                break;
        }

        for (let field in temp) {
            switch (field) {
                case 'longitude':
                case 'latitude':
                    if (temp[field] !== null) {
                        location[field] = temp[field];
                    }
                    break;
                default:
                    if (temp[field] !== '') {
                        location[field] = temp[field];
                    }
            }
        }

        location['id'] = `${location.type}--${this.stixService.getUUIDFrIdContributingProperties(location)}`;

        if (this.currentTarget) {
            location['id_loc'] = this.currentTarget;
            this.currentTarget = '';
        }

        if (this.currentAttacker) {
            location['ta_loc'] = this.currentAttacker;
            this.currentAttacker = '';
        }

        let emitObj = {
            mode: 'where-location',
            push: [location],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    addComponent() {
        if (this.guidedService.cartLengths[this.component] === 0) {
            this.reset();
            return;
        }
        let types = [];
        let data = [];

        this.guidedService.locations = [];
        this.guidedService.locations = JSON.parse(JSON.stringify([...this.guidedService.cart[this.component].Location]));

        for (let type in this.guidedService.cart[this.component]) {
            let objects = this.guidedService.cart[this.component][type];
            // types.push(objects[0].type);

            for (let obj of objects) {
                types.push(obj.type);

                if (obj.region) {
                    for (let region of this.regionOptions) {
                        if (obj.region === region.value) {
                            obj.region = region.key;
                        }
                    }
                }

                if (obj.country) {
                    for (let country of this.countryOptions) {
                        if (obj.country === country.value) {
                            obj.country = country.key;
                        }
                    }
                }

                if (obj.flag) delete obj.flag;
                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.reset();
    }

    editCartItem(event) {
        this.activeTab = event.description;
        if (this.activeTab === 'target') {
            this.isTargetTabEnabled = true;
            this.isAttackerTabEnabled = false;
        }
        if (this.activeTab === 'attacker') {
            this.isTargetTabEnabled = false;
            this.isAttackerTabEnabled = true;
        }
        this.reset();

        this.editMode = true;
        let temp: any = {};

        switch (this.activeTab) {
            case 'target':
                temp = this.target;
                break;
            case 'attacker':
                temp = this.attacker;
                break;
        }

        for (let field in event) {
            switch (field) {
                case 'flag':
                case 'type':
                    continue;
                default:
                    temp[field] = event[field];
            }
        }

        this.currentTarget = event.id_loc;
        this.currentAttacker = event.ta_loc;

        this.isEnabled();
    }

    isAreaValid(temp) {
        let regex = new RegExp(
            'AD-..|ad-..|AE-..|ae-..|AF-..|af-..|AG-..|ag-..|AI-..|ai-..|AL-..|al-..|AM-..|am-..|AO-..|ao-..|AQ-..|aq-..|AR-..|ar-..|AS-..|as-..|AT-..|at-..|AU-..|au-..|AW-..|aw-..|AX-..|ax-..|AZ-..|az-..|BA-..|ba-..|BB-..|bb-..|BD-..|bd-..|BE-..|be-..|BF-..|bf-..|BG-..|bg-..|BH-..|bh-..|BI-..|bi-..|BJ-..|bj-..|BL-..|bl-..|BM-..|bm-..|BN-..|bn-..|BO-..|bo-..|BQ-..|bq-..|BR-..|br-..|BS-..|bs-..|BT-..|bt-..|BV-..|bv-..|BW-..|bw-..|BY-..|by-..|BZ-..|bz-..|CA-..|ca-..|CC-..|cd-..|CF-..|cf-..|CG-..|cg-..|CH-..|ch-..|CI-..|ci-..|CK-..|ck-..|CL-..|cl-..|CM-..|cm-..|CN-..|cn-..|CO-..|co-..|CR-..|cr-..|CU-..|cu-..|CV-..|cv-..|CW-..|cw-..|CX-..|cx-..|CY-..|cy-..|CZ-..|cz-..|DE-..|de-..|DJ-..|dj-..|DK-..|dk-..|DM-..|dm-..|DO-..|do-..|DZ-..|dz-..|EC-..|ec-..|EE-..|ee-..|EG-..|eg-..|EH-..|eh-..|ER-..|er-..|ES-..|es-..|ET-..|et-..|FI-..|fi-..|FJ-..|fj-..|FK-..|fk-..|FM-..|fm-..|FO-..|fo-..|FR-..|fr-..|GA-..|ga-..|GB-..|gb-..|GD-..|gd-..|GE-..|ge-..|GF-..|gf-..|GG-..|gg-..|GH-..|gh-..|GI-..|gi-..|GL-..|gl-..|GM-..|gm-..|GN-..|gn-..|GP-..|gp-..|GQ-..|gq-..|GR-..|gr-..|GS-..|gs-..|GT-..|gt-..|GU-..|gu-..|GW-..|gw-..|GY-..|gy-..|HK-..|hk-..|HM-..|hm-..|HN-..|hn-..|HR-..|hr-..|HT-..|ht-..|HU-..|hu-..|ID-..|id-..|IE-..|ie-..|IL-..|il-..|IM-..|im-..|IN-..|in-..|IO-..|io-..|IQ-..|iq-..|IR-..|ir-..|IS-..|is-..|IT-..|it-..|JE-..|je-..|JM-..|jm-..|JO-..|jo-..|JP-..|jp-..|KE-..|ke-..|KG-..|kg-..|KH-..|kh-..|KI-..|ki-..|KM-..|km-..|KN-..|kn-..|KP-..|kp-..|KR-..|kr-..|KW-..|kw-..|KY-..|ky-..|KZ-..|kz-..|LA-..|la-..|LB-..|lb-..|LC-..|lc-..|LI-..|li-..|LK-..|lk-..|LR-..|lr-..|LS-..|ls-..|LT-..|lt-..|LU-..|lu-..|LV-..|lv-..|LY-..|ly-..|MA-..|ma-..|MC-..|mc-..|MD-..|md-..|ME-..|me-..|MF-..|mf-..|MG-..|mg-..|MH-..|mh-..|MK-..|mk-..|ML-..|ml-..|MM-..|mm-..|MN-..|mn-..|MO-..|mo-..|MP-..|mp-..|MQ-..|mq-..|MR-..|mr-..|MS-..|ms-..|MT-..|mt-..|MU-..|mu-..|MV-..|mv-..|MW-..|mw-..|MX-..|mx-..|MY-..|my-..|MZ-..|mz-..|NA-..|na-..|NC-..|nc-..|NE-..|ne-..|NF-..|nf-..|NG-..|ng-..|NI-..|ni-..|NL-..|nl-..|NO-..|no-..|NP-..|np-..|NR-..|nr-..|NU-..|nu-..|NZ-..|nz-..|OM-..|om-..|PA-..|pa-..|PE-..|pe-..|PF-..|pf-..|PG-..|pg-..|PH-..|ph-..|PK-..|pk-..|PL-..|pl-..|PM-..|pm-..|PN-..|pn-..|PR-..|pr-..|PS-..|ps-..|PT-..|pt-..|PW-..|pw-..|PY-..|py-..|QA-..|qa-..|RE-..|re-..|RO-..|ro-..|RS-..|rs-..|RU-..|ru-..|RW-..|rw-..|SA-..|sa-..|SB-..|sb-..|SC-..|sc-..|SD-..|sd-..|SE-..|se-..|SG-..|sg-..|SH-..|sh-..|SI-..|si-..|SJ-..|sj-..|SK-..|sk-..|SL-..|sl-..|SM-..|sm-..|SN-..|sn-..|SO-..|so-..|SR-..|sr-..|SS-..|ss-..|ST-..|st-..|SV-..|sv-..|SX-..|sx-..|SY-..|sy-..|SZ-..|sz-..|TC-..|tc-..|TD-..|td-..|TF-..|tf-..|TG-..|tg-..|TH-..|th-..|Th-..|TJ-..|tj-..|TK-..|tk-..|TL-..|tl-..|TM-..|tm-..|TN-..|tn-..|TO-..|to-..|TR-..|tr-..|TT-..|tt-..|TV-..|tv-..|TW-..|tw-..|TZ-..|tz-..|UA-..|ua-..|UG-..|ug-..|UM-..|um-..|US-..|us-..|UY-..|uy-..|UZ-..|uz-..|VA-..|va-..|VC-..|vc-..|VE-..|ve-..|VG-..|vg-..|VI-..|vi-..|VN-..|vn-..|VU-..|vu-..|WF-..|wf-..|WS-..|ws-..|YE-..|ye-..|YT-..|yt-..|ZA-..|za-..|ZM-..|zm-..|ZW-..|zw-..'
        );

        if (regex.test(temp.administrative_area)) {
            this.areaError = '';
            return true;
        }

        this.areaError = 'Should be a valid ISO 3166-2 Code ex:ad-00.';
        return false;
    }

    isEnabled() {
        let isValid = false;
        let isEnable = false;

        let temp: any = {};

        if (this.activeTab === 'target') {
            temp = this.target;
        } else {
            temp = this.attacker;
        }

        if (temp.longitude !== null && temp.latitude === null) {
            this.latError = 'If Longitude entered, Latitude is required';
        } else if (temp.latitude !== null && temp.longitude === null) {
            this.longError = 'If Longitude entered, Latitude is required';
        } else {
            this.longError = '';
            this.latError = '';

            if (temp.administrative_area !== '') {
                isValid = this.isAreaValid(temp);
            } else {
                isValid = temp.region !== '' || temp.country !== '' || (temp.latitude !== null && temp.longitude !== null);
            }

            if (temp.longitude !== null && temp.latitude !== null) {
                isEnable = true;
            } else if (temp.region !== '' || temp.country !== '') {
                isEnable = true;
            }
        }

        this.guidedService.cartDisabled$.next(!isValid);
        this.isOptionalEnabled = isEnable;
    }

    reset() {
        switch (this.activeTab) {
            case 'target':
                this.target = {
                    region: '',
                    country: '',
                    latitude: null,
                    longitude: null,
                    street_address: '',
                    administrative_area: '',
                    city: '',
                    postal_code: '',
                    description: '',
                };
                break;
            case 'attacker':
                this.attacker = {
                    region: '',
                    country: '',
                    latitude: null,
                    longitude: null,
                    street_address: '',
                    administrative_area: '',
                    city: '',
                    postal_code: '',
                    description: '',
                };
                break;
        }

        this.longError = '';
        this.latError = '';
        this.areaError = '';

        this.isOptionalEnabled = false;
        this.editMode = false;
    }

    redirectCart(event) {
        if (event.component !== this.component) {
            this.changePage.emit(event);
        } else {
            this.guidedService.getEditItemTrigger$.next(event);
        }
    }

    syncCart(event) {
        if (event === this.component) {
            this.guidedService.syncCartTrigger$.next();
        }
    }

    setTab(target) {
        if (!this.isTargetTabEnabled && !this.isAttackerTabEnabled) return;

        if (this.editMode === true && target === 'target') {
            this.target = this.attacker;
        } else if (this.editMode === true && target === 'attacker') {
            this.attacker = this.target;
        }

        this.activeTab = target;
        this.isEnabled();
    }

    setFormEnabled(isLocationPinnned: string, modal: TemplateRef<any>): void {
        if (isLocationPinnned === 'yes') {
            this.isTargetTabEnabled = true;
            this.isAttackerTabEnabled = true;
            this.isEnabled();
        } else {
            if (this.guidedService.cartLengths[this.component] > 0) {
                this.modalRef = this.clearCartDialog.open(modal, { centered: true });
            } else {
                this.isTargetTabEnabled = false;
                this.isAttackerTabEnabled = false;
                this.guidedService.cartDisabled$.next(true);
            }
        }
    }

    onX() {
        this.clearCartDialog.dismissAll();
    }

    onConfirm() {
        this.isTargetTabEnabled = false;
        this.isAttackerTabEnabled = false;
        this.guidedService.clearCartTrigger$.next();
        this.guidedService.cartDisabled$.next(true);
        this.clearCartDialog.dismissAll();
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    getTargets() {
        if (Object.keys(this.guidedService.cart).length !== 0 && this.guidedService.cart['who-individual'])
            return [
                ...this.stixService.bundle.objects.filter((obj) => obj.type == 'identity'),
                ...(this.guidedService.cart['who-individual']['Identity'] ?? []),
            ];
        else return this.stixService.bundle.objects.filter((obj) => obj.type == 'identity');
    }

    getAttackers() {
        if (Object.keys(this.guidedService.cart).length !== 0 && this.guidedService.cart['who-individual'])
            return [
                ...this.stixService.bundle.objects.filter((obj) => obj.type == 'identity'),
                ...(this.guidedService.cart['who-individual']['Threat Actor'] ?? []),
            ];
        else return this.stixService.bundle.objects.filter((obj) => obj.type == 'threat-actor');
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}
