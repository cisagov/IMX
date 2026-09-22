import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { faHammer } from '@fortawesome/free-solid-svg-icons';
import { GuidedService } from 'src/app/guided.service';
import { faQuestionCircle, faInfoCircle, faChess, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { StixService } from 'src/app/stix-service.service';
import all_schemas from '../../bundle/schemas.json';

@Component({
    selector: 'app-how-ttp',
    templateUrl: './how-ttp.component.html',
    styleUrls: ['./how-ttp.component.css'],
    standalone: false,
})
export class HowTtpComponent implements OnInit, OnDestroy {
    //For parent
    @Input() deciderToolEvent: EventEmitter<any>;
    @Output() updateContinue: EventEmitter<boolean>;
    @Output() disableDecider: EventEmitter<boolean>;
    @Output() triggerDecider = new EventEmitter<void>();
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'how-ttp';

    private cartSubscriptions: Subscription[] = [];

    faQuestionCircle = faQuestionCircle;
    faInfoCircle = faInfoCircle;
    faChess = faChess;
    faPlus = faPlus;
    faTrash = faTrash;

    name: string = '';
    indexNumbers: string = '';
    tacticNumbers: string = '';
    selectedSco: string[] = [];
    currentSelectedSco: string | null = null;
    currentSelectedIndicator: string | null = null;
    selectedIndicator: string[] = [];
    scoSize = 1;
    indicatorSize = 1;

    faWeapon = faHammer;

    addedObject1 = false;
    addedObject2 = false;

    cartIds: number[] = [];

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.updateContinue = new EventEmitter<boolean>();
        this.disableDecider = new EventEmitter<boolean>();
    }

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        this.subscribeToParent();

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.disableContinue();

            return;
        }

        let today = new Date();

        let attackPatternObject = {
            type: 'attack-pattern',
            name: this.name !== '' ? this.name : `attack-pattern-generated-${today.toISOString()}`,
            kill_chain_phases: [],
            external_references: [],
        };

        let indexArr = this.indexNumbers.split(',');
        let tacticArr = this.tacticNumbers.split(',');

        for (let ind of indexArr) {
            ind.replace(' ', '');
        }
        for (let tac of tacticArr) {
            tac.replace(' ', '');
        }

        for (let i in tacticArr) {
            let tactic = tacticArr[i];

            let tempKillChain = {
                kill_chain_name: 'mitre-attack',
                phase_name: tactic,
            };

            attackPatternObject.kill_chain_phases.push(tempKillChain);
        }

        for (let i in indexArr) {
            let index = indexArr[i].replace(' ', '');
            let indexSplit = index.split('.');

            let tempExtRef = {
                external_id: index.replace(' ', ''),
                source_name: 'mitre-attack',
                url: `https://attack.mitre.org/techniques/${indexSplit.join('/')}`,
            };

            attackPatternObject.external_references.push(tempExtRef);
        }

        if (this.selectedSco.includes('')) this.selectedSco = [];

        if (this.selectedIndicator.includes('')) this.selectedIndicator = [];

        attackPatternObject['sco_ttp'] = this.selectedSco;
        attackPatternObject['ind_ttp'] = this.selectedIndicator;

        attackPatternObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;
        console.info(attackPatternObject);
        let emitObj = {
            mode: this.component,
            push: [attackPatternObject],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    editCartItem(event) {
        this.reset();

        this.cartIds = [event.cartId];

        this.name = event.name;

        for (let i = 0; i < event.kill_chain_phases.length; i++) {
            let current = event.kill_chain_phases[i];

            if (i === event.kill_chain_phases.length - 1) {
                this.tacticNumbers += `${current.phase_name}`;
            } else {
                this.tacticNumbers += `${current.phase_name}, `;
            }
        }

        for (let i = 0; i < event.external_references.length; i++) {
            let current = event.external_references[i];

            if (i === event.external_references.length - 1) {
                this.indexNumbers += `${current.external_id}`;
            } else {
                this.indexNumbers += `${current.external_id}, `;
            }
        }

        this.selectedSco = event['sco_ttp'];
        this.selectedIndicator = event['ind_ttp'];

        this.disableContinue();
    }

    reset() {
        this.name = '';
        this.indexNumbers = '';
        this.tacticNumbers = '';
        this.selectedSco = [];
        this.selectedIndicator = [];

        this.cartIds = [];
    }

    addComponents() {
        if (this.indexNumbers === '' || this.tacticNumbers === '') {
            this.resetSlide();
            return;
        }

        let types = ['attack-pattern'];
        let data = [];

        let indexArr = this.indexNumbers.split(',');
        let tacticArr = this.tacticNumbers.split(',');

        for (let ind of indexArr) {
            ind.replace(' ', '');
        }
        for (let tac of tacticArr) {
            tac.replace(' ', '');
        }

        let tempObject = {
            type: 'attack-pattern',
            kill_chain_phases: [],
        };

        for (let i in indexArr) {
            let index = indexArr[i];
            let tactic = tacticArr[i];

            let tempKillChain = {
                kill_chain_name: tactic,
                phase_name: index,
            };

            tempObject.kill_chain_phases.push(tempKillChain);
        }

        data.push(tempObject);

        this.guidedService.addComponents(types, data);
        this.resetSlide();

        if (this.guidedService.autoGenRelationships) {
            // Indicator --- Attack Pattern
            setTimeout(() => {
                this.guidedService.findPreviouslyAddedObjects('indicator', 'indicator-ttp');
                this.guidedService.addedObjects.subscribe((addedObjects1) => {
                    if (
                        addedObjects1.eventType === 'indicator-ttp' &&
                        addedObjects1.objects &&
                        addedObjects1.objects.length > 0 &&
                        !this.addedObject1
                    ) {
                        this.addedObject1 = true;
                        let indicator = addedObjects1;

                        this.guidedService.findPreviouslyAddedObjects('attack-pattern', 'attack-pattern-ttp');
                        this.guidedService.addedObjects.subscribe((addedObjects) => {
                            if (
                                addedObjects.eventType === 'attack-pattern-ttp' &&
                                addedObjects.objects &&
                                addedObjects.objects.length > 0 &&
                                !this.addedObject2
                            ) {
                                this.addedObject2 = true;

                                this.guidedService.createRelationships('indicates', 'indicator', addedObjects.objects[0].id);
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    get availableObservableOptions() {
        const scos = this.getScos();
        return scos.filter((sco) => !this.selectedSco.includes(sco.id));
    }

    addObservable(observable: string) {
        if (!this.selectedSco.includes(observable)) {
            this.selectedSco.push(observable);
        }

        // Clear select
        this.currentSelectedSco = null;
    }

    deleteObservable(key: string) {
        this.selectedSco = this.selectedSco.filter((s) => s !== key);
    }

    disableContinue() {
        let disable = false;

        if (
            (this.indexNumbers === '' && this.tacticNumbers === '') ||
            (this.indexNumbers === '' && this.tacticNumbers !== '') ||
            (this.tacticNumbers === '' && this.indexNumbers !== '')
        ) {
            disable = true;
        }

        this.guidedService.cartDisabled$.next(disable);
    }

    resetSlide() {
        this.indexNumbers = '';
        this.tacticNumbers = '';
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

    subscribeToParent() {
        this.deciderToolEvent.subscribe((data: any) => {
            this.indexNumbers = '';
            this.tacticNumbers = '';
            for (let curr of data) {
                if (this.indexNumbers === '') {
                    this.tacticNumbers = `${curr.kill_chain_phase.phase_name}`;
                    this.indexNumbers = `${curr.external_reference.external_id}`;
                    continue;
                }

                if (!this.tacticNumbers.includes(curr.kill_chain_phase.phase_name)) {
                    this.tacticNumbers = `${this.tacticNumbers}, ${curr.kill_chain_phase.phase_name}`;
                }
                this.indexNumbers = `${this.indexNumbers}, ${curr.external_reference.external_id}`;
            }
        });
        this.disableContinue();
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    getDisplay(obj) {
        if(obj.type === 'network-traffic') {
            const src = obj.src_ref ? this.getNetworkRefLabel(obj.src_ref) : null;
            const dst = obj.dst_ref ? this.getNetworkRefLabel(obj.dst_ref) : null;
                if(src && dst) {
                    return `${src} to ${dst}`;
                } else if(src) {
                    return src;
                } else if (dst) {
                    return dst;
                } else {
                    return obj.id;
                }
        }

        return obj.display_name || obj.name || obj.value || obj.id;
    }

    getScos() {
        let scos = [];
        if (Object.keys(this.guidedService.cart).length !== 0 && this.guidedService.cart['how-observable']) {
            for (let type in this.guidedService.cart['how-observable']) {
                for (let obj of this.guidedService.cart['how-observable'][type])
                    //scos.push(type + ': ' + obj['display_name']);
                    scos.push(obj);
            }
        }
        this.stixService.bundle.objects.forEach((obj) => {
            if (all_schemas.SCOs.includes(obj.type)) scos.push(obj);
        });
        this.scoSize = scos.length > 8 ? 8 : scos.length === 0 ? 1 : scos.length;
        return scos;
    }

    getIndicators() {
        let indicators = [];
        if (Object.keys(this.guidedService.cart).length !== 0 && this.guidedService.cart['how-pattern-builder']) {
            indicators = this.guidedService.cart['how-pattern-builder']['Indicator'];
        }
        this.stixService.bundle.objects.forEach((obj) => {
            if (obj.type == 'indicator') indicators.push(obj);
        });
        this.indicatorSize = indicators.length > 8 ? 8 : indicators.length === 0 ? 1 : indicators.length;
        return indicators;
    }

    checkSelectObs() {
        if (this.selectedSco.includes('')) this.selectedSco = [''];
    }

    checkSelectDet() {
        if (this.selectedIndicator.includes('')) this.selectedIndicator = [''];
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }

    get availableIndicatorOptions() {
        const indicators = this.getIndicators();
        return indicators.filter(
            (ind) => !this.selectedIndicator.includes(ind.id) // might be wrong
        );
    }

    addIndicator(indicator: string) {
        if (!indicator) return;

        if (!this.selectedIndicator.includes(indicator)) {
            this.selectedIndicator.push(indicator);
        }

        // Clear select
        this.currentSelectedIndicator = null;
    }

    deleteIndicator(indicator: string) {
        this.selectedIndicator = this.selectedIndicator.filter((m) => m !== indicator);
    }

    getScoDisplayName(id: string): string {
        const match = this.getScos().find((s) => s.id === id);

        if(match){
            if(match.type === 'network-traffic') {
                const src = match.src_ref ? this.getNetworkRefLabel(match.src_ref) : null;
                const dst = match.dst_ref ? this.getNetworkRefLabel(match.dst_ref) : null;
                    if(src && dst) {
                        return `${match.type}: ${src} to ${dst}`;
                    } else if(src) {
                        return `${match.type}: ${src}`;
                    } else if (dst) {
                        return `${match.type}: ${dst}`;
                    } else {
                        return `${match.type}: ${match.id}`;
                    }
            }
            return `${match.type}: ${match.display_name || match.name || match.value || match.id}`;
        }
        return id;
    }

    getIndicatorDisplayName(id: string): string {
        const indicators = this.getIndicators() || [];
        const match = indicators.find((i) => i.id === id);
        return match ? match.pattern : id;
    }

    getNetworkRefLabel(id: string): string {

        const cart = this.guidedService.cart?.['how-observable'];
        const bundle = this.stixService.bundle.objects;

        if (!cart && !bundle) {
            return id;
        }

        for (const type in cart) {
            const match = cart[type].find((o) => o.id === id);
            if (match) {
                return match.display_name || match.name || match.value;
            }
        }

        for (const object of bundle) {
            if (object.id === id) {
                return object.name || object.value || object.id;
            }
        }

        // fallback
        return id;
    }
}
