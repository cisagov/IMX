import { Component, Output, EventEmitter, Input } from '@angular/core';
import { GuidedService } from 'src/app/guided.service';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { GuidedCartModalComponent } from '../guided-cart/guided-cart-modal/guided-cart-modal.component';

@Component({
    selector: 'app-total-guided-cart',
    templateUrl: './total-guided-cart.component.html',
    styleUrls: ['./total-guided-cart.component.css'],
    standalone: false,
})
export class TotalGuidedCartComponent {
    @Output() redirectCart = new EventEmitter<any>();
    @Output() syncCart = new EventEmitter<any>();

    @Input() editModeEvent: EventEmitter<boolean>;

    faCart = faShoppingCart;

    constructor(
        public cartModalDialog: MatDialog,
        public guidedService: GuidedService
    ) {}

    editFromCart(key, index) {
        let component: string = '';

        for (let page in this.guidedService.cart) {
            if (this.guidedService.cart[page][key]) {
                component = page;

                break;
            }
        }

        let event = {
            component: component === 'Incident' ? 'how-event-detection' : component,
            key: key,
            index: index,
            item: this.guidedService.cart[component][key][index],
            specialFlag: component === 'Incident' ? true : false,
        };

        this.redirectCart.emit(event);
    }

    deleteFromCart(key, index, search) {
        let tempObject: any = {};
        let component: string = '';

        for (let page in this.guidedService.cart) {
            if (this.guidedService.cart[page][key]) {
                tempObject = this.guidedService.cart[page][key][index];
                component = page;

                this.guidedService.cart[page][key].splice(index, 1);

                if (this.guidedService.cart[page][key].length === 0) delete this.guidedService.cart[page][key];
                this.guidedService.syncCart(page);
                break;
            }
        }

        if (search === true) {
            switch (component) {
                case 'how-pattern-builder':
                case 'how-observable':
                    if (this.guidedService.cart[component]['Sighting']) {
                        for (let i in this.guidedService.cart[component]['Sighting']) {
                            let sighting = this.guidedService.cart[component]['Sighting'][i];

                            if (sighting.sighting_of_ref === tempObject.id) {
                                this.deleteFromCart('Sighting', i, false);
                                break;
                            }
                        }
                    }
                    if (this.guidedService.cart[component]['Observed Data']) {
                        for (let i in this.guidedService.cart[component]['Observed Data']) {
                            let sighting = this.guidedService.cart[component]['Observed Data'][i];

                            if (sighting.object_refs.includes(tempObject.id)) {
                                this.deleteFromCart('Observed Data', i, false);
                                break;
                            }
                        }
                    }
            }
        }

        this.syncCart.emit(component);
    }

    countCartLength() {
        let length = 0;

        for (const page in this.guidedService.cart) {
            if (page == 'relationships') continue;

            for (const type in this.guidedService.cart[page]) {
                if (type == 'Observed Data') continue;

                length += this.guidedService.cart[page][type].length;
            }
        }

        return length;
    }

    openCart() {
        let cart = {};

        for (let page in this.guidedService.cart) {
            for (let type in this.guidedService.cart[page]) {
                if (cart[type]) {
                    cart[type] = cart[type].concat(this.guidedService.cart[page][type]);
                } else {
                    cart[type] = this.guidedService.cart[page][type];
                }
            }
        }

        const dialogRef = this.cartModalDialog.open(GuidedCartModalComponent, {
            data: { cart: cart, editMode: this.guidedService.cartEditMode, currentMode: 'Total' },
            height: `${window.innerHeight / 1.75}px`,
            width: `${window.innerWidth / 3}px`,
            maxWidth: '95vw',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                if (result.mode === 'edit') {
                    this.editFromCart(result.key, result.index);
                } else if (result.mode === 'delete') {
                    this.deleteFromCart(result.key, result.index, result.search);
                }
            }
        });
    }
}
