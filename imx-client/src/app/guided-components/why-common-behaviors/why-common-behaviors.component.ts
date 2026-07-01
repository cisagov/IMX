import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { faQuestionCircle, faPlus, faEdit, faTrash, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-why-common-behaviors',
    templateUrl: './why-common-behaviors.component.html',
    styleUrls: ['./why-common-behaviors.component.css'],
    standalone: false,
})
export class WhyCommonBehaviorsComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'why-common-behaviors';

    private cartSubscriptions: Subscription[] = [];

    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;

    faPlus = faPlus;
    faEdit = faEdit;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faPuzzle = faPuzzlePiece;

    currentName = '';
    currentResourceLevel = '';
    currentPrimaryMotivation = '';
    currentSecondaryMotivations = [];
    currentAliases = '';
    currentGoals = '';

    types = [];
    data = [];
    nameToUpdate = '';
    errorMessage = '';

    editMode: boolean = false;
    cartIds: number[] = [];

    objectSelection = null;

    resourceLevelOptions: any[] = [
        { key: 'individual', value: 'Individual' },
        { key: 'club', value: 'Club' },
        { key: 'contest', value: 'Contest' },
        { key: 'team', value: 'Team' },
        { key: 'organization', value: 'Organization' },
        { key: 'government', value: 'Government' },
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
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'intrusion-set');
        this.nameToUpdate = '';

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

        let intrusionObject = {
            type: 'intrusion-set',
            name: this.currentName,
        };

        if (this.currentResourceLevel !== '') {
            intrusionObject['resource_level'] = this.currentResourceLevel;
        }

        if (this.currentPrimaryMotivation !== '') {
            intrusionObject['primary_motivation'] = this.currentPrimaryMotivation;
        }

        if (this.currentSecondaryMotivations.length !== 0) {
            intrusionObject['secondary_motivations'] = this.currentSecondaryMotivations;
        }

        if (this.currentAliases !== '') {
            intrusionObject['aliases'] = this.currentAliases.split(',').map((element) => element.trim());
        }

        if (this.currentGoals !== '') {
            intrusionObject['goals'] = this.currentGoals.split(',').map((element) => element.trim());
        }

        intrusionObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

        let emitObj = {
            mode: this.component,
            push: [intrusionObject],
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
            // Build relationship: Intrusion Set --- Location (map all Intrusion Set to each target and attacker Location, many to many)
            setTimeout(() => {
                let targetLocations: any = this.guidedService.locations.filter((l) => l.flag === 'target');
                let attackerLocations: any = this.guidedService.locations.filter((l) => l.flag === 'attacker');

                if (targetLocations.length > 0 || attackerLocations.length > 0) {
                    this.guidedService.findPreviouslyAddedObjects('intrusion-set', 'intrusion-set-common-behavior');
                    this.guidedService.addedObjects.subscribe((addedObjects) => {
                        if (
                            addedObjects.eventType === 'intrusion-set-common-behavior' &&
                            addedObjects.objects &&
                            addedObjects.objects.length > 0 &&
                            !this.addedObjects
                        ) {
                            this.addedObjects = true;

                            attackerLocations.forEach((attackerLocation) => {
                                addedObjects.objects.forEach((o) => {
                                    this.guidedService.createRelationships('originates-from', o.id, attackerLocation.id);
                                });
                            });

                            targetLocations.forEach((targetLocation) => {
                                addedObjects.objects.forEach((o) => {
                                    this.guidedService.createRelationships('targets', o.id, targetLocation.id);
                                });
                            });
                        }
                    });
                }
            }, 300);
        }
    }

    checkCart() {
        if (this.currentName !== '') {
            this.guidedService.cartDisabled$.next(false);
            return;
        }

        this.guidedService.cartDisabled$.next(true);
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;

        this.cartIds = [event.cartId];

        this.currentName = event.name;

        if (event.resource_level) {
            this.currentResourceLevel = event.resource_level;
        }

        if (event.primary_motivation) {
            this.currentPrimaryMotivation = event.primary_motivation;
        }

        if (event.secondary_motivations) {
            this.currentSecondaryMotivations = event.secondary_motivations;
        }

        if (event.aliases) {
            this.currentAliases = event.aliases.join(',');
        }

        if (event.goals) {
            this.currentGoals = event.goals.join(',');
        }

        this.checkCart();
    }

    reset() {
        this.currentName = '';
        this.currentResourceLevel = '';
        this.currentPrimaryMotivation = '';
        this.currentSecondaryMotivations = [];
        this.currentAliases = '';
        this.currentGoals = '';

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
