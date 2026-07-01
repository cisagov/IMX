import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faQuestionCircle, faPlus, faEdit, faTrash, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-why-attacker',
    templateUrl: './why-attacker.component.html',
    styleUrls: ['./why-attacker.component.css'],
    standalone: false,
})
export class WhyAttackerComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'why-attacker';

    private cartSubscriptions: Subscription[] = [];

    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;

    faPlus = faPlus;
    faEdit = faEdit;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faPuzzle = faPuzzlePiece;

    currentAttackerName = '';
    currentAttackerRoles = [];
    currentAttackerMotivation = '';
    types = [];
    data = [];
    actionMode = 'add';
    nameToUpdate = '';
    errorMessage = '';

    editMode: boolean = false;
    cartIds: number[] = [];

    objectSelection = null;

    attackerOptions = [];

    roleOptions: any[] = [
        { key: 'agent', value: 'Agent' },
        { key: 'director', value: 'Director' },
        { key: 'independent', value: 'Independent' },
        { key: 'infrastructure-architect', value: 'Infrastructure Architect' },
        { key: 'infrastructure-operator', value: 'Infrastructure Operator' },
        { key: 'malware-author', value: 'Malware Author' },
        { key: 'private-sector', value: 'Private Sector' },
        { key: 'sponsor', value: 'Sponsor' },
    ];

    motivationOptions: any[] = [
        { key: 'accidental', value: 'Accidental' },
        { key: 'coercion', value: 'Coercion' },
        { key: 'dominance', value: 'Dominance' },
        { key: 'ideology', value: 'Ideology' },
        { key: 'notoriety', value: 'Notoriety' },
        { key: 'organizational-gain', value: 'Organizational Gain' },
        { key: 'personal-gain', value: 'Personal Gain' },
        { key: 'personal-satisfaction', value: 'Personal Satisfaction' },
        { key: 'revenge', value: 'Revenge' },
        { key: 'unpredictable', value: 'Unpredictable' },
    ];

    addedObjects = false;

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {}

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data))
        );
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'threat-actor');
        this.nameToUpdate = '';
        this.attackerOptions = this.guidedService.attackers;

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.checkCart();
            return;
        }

        let threatActorObject = {
            type: 'threat-actor',
            name: this.currentAttackerName,
        };

        if (this.currentAttackerMotivation !== '') {
            threatActorObject['primary_motivation'] = this.currentAttackerMotivation;
        }

        if (this.currentAttackerRoles.length !== 0) {
            threatActorObject['roles'] = this.currentAttackerRoles;
        }

        threatActorObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

        let emitObj = {
            mode: this.component,
            push: [threatActorObject],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    addComponents() {
        if (this.guidedService.cartLengths[this.component] === 0) {
            this.reset();
            return;
        }
        let types = [];
        let data = [];

        for (let type in this.guidedService.cart[this.component]) {
            let objects = this.guidedService.cart[this.component][type];

            for (let obj of objects) {
                types.push(obj.type);

                if (obj.display_name) delete obj.display_name;
                if (obj.cartId) delete obj.cartId;
                if (obj.linkId) delete obj.linkId;

                data.push(obj);
            }
        }

        this.guidedService.addComponents(types, data);
        this.reset();

        if (this.guidedService.autoGenRelationships) {
            setTimeout(() => {
                let targetLocations: any = this.guidedService.locations.filter((l) => l.flag === 'target');
                let attackerLocations: any = this.guidedService.locations.filter((l) => l.flag === 'attacker');
                let attackers = this.guidedService.observablesWithAlignment.filter((o) => o.alignment === 'Attacker');

                this.guidedService.findPreviouslyAddedObjects('threat-actor', 'threat-actor-attacker');
                this.guidedService.addedObjects.subscribe((addedObjects) => {
                    if (
                        addedObjects.eventType === 'threat-actor-attacker' &&
                        addedObjects.objects &&
                        addedObjects.objects.length > 0 &&
                        !this.addedObjects
                    ) {
                        this.addedObjects = true;
                        let threatActors = addedObjects.objects;

                        if (targetLocations.length > 0 || attackerLocations.length > 0) {
                            attackerLocations.forEach((attackerLocation) => {
                                threatActors.forEach((o) => {
                                    this.guidedService.createRelationships('located-at', o.id, attackerLocation.id);
                                });
                            });

                            targetLocations.forEach((targetLocation) => {
                                threatActors.forEach((o) => {
                                    this.guidedService.createRelationships('targets', o.id, targetLocation.id);
                                });
                            });
                        }

                        if (attackers.length > 0) {
                            let threatActorCounter = 0;
                            threatActors.forEach((i) => {
                                if (attackers.length > 0 && attackers[threatActorCounter]) {
                                    this.guidedService.createRelationships('related-to', attackers[threatActorCounter].id, i.id);
                                }

                                ++threatActorCounter;
                            });
                        }
                    }
                });
            }, 300);
        }
    }

    checkCart() {
        if (this.currentAttackerName !== '') {
            this.guidedService.cartDisabled$.next(false);
            return;
        }

        this.guidedService.cartDisabled$.next(true);
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;

        this.cartIds = [event.cartId];

        this.currentAttackerName = event.name;

        if (event.primary_motivation) {
            this.currentAttackerMotivation = event.primary_motivation;
        }

        if (event.roles) {
            this.currentAttackerRoles = event.roles;
        }

        this.checkCart();
    }

    reset() {
        this.currentAttackerName = '';
        this.currentAttackerRoles = [];
        this.currentAttackerMotivation = '';

        this.nameToUpdate = '';
        this.errorMessage = '';

        this.editMode = false;
        this.cartIds = [];
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

    showAssistanceTrigger() {
        this.showAssistance.emit();
    }

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}
