import { Component, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { GuidedService } from 'src/app/guided.service';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-how-event',
    templateUrl: './how-event.component.html',
    styleUrls: ['./how-event.component.css'],
    standalone: false,
})
export class HowEventComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'how-event';

    private cartSubscriptions: Subscription[] = [];

    faQuestionCircle = faQuestionCircle;

    details = '';
    name = '';
    goal = '';

    editMode: boolean = false;
    cartIds: number[] = [];

    constructor(public guidedService: GuidedService) {}

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

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.checkCart();
            return;
        }

        let eventObject = {
            type: 'event',
            name: this.name,
        };

        if (this.details) {
            eventObject['description'] = this.details.trim();
        }

        if (this.goal) {
            eventObject['goal'] = this.goal;
        }

        eventObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

        let emitObj = {
            mode: this.component,
            push: [eventObject],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    checkCart() {
        if (this.name !== '') {
            this.guidedService.cartDisabled$.next(false);
            return;
        }

        this.guidedService.cartDisabled$.next(true);
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;

        this.cartIds = [event.cartId];

        this.name = event.name;

        if (event.description) {
            this.details = event.description;
        }

        if (event.goal) {
            this.goal = event.goal;
        }

        this.checkCart();
    }

    reset() {
        this.name = '';
        this.details = '';
        this.goal = '';

        this.editMode = false;
        this.cartIds = [];
    }

    showAssistanceTrigger() {
        this.showAssistance.emit();
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
                if (obj.type) delete obj.type;

                data.push(obj);
            }
        }

        this.guidedService.addEventMethod(types, data);
        this.reset();
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

    ngOnDestroy(): void {
        this.cartSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}
