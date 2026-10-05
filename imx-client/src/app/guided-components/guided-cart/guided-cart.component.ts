import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { faCartPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import { db } from 'src/app/db.service';
import { Subscription } from 'rxjs';
import { SCO_LIST } from '../../models/sco_list';

@Component({
    selector: 'app-guided-cart',
    templateUrl: './guided-cart.component.html',
    styleUrls: ['./guided-cart.component.css'],
    standalone: false,
})
export class GuidedCartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() currentComponent: string;

    faCartPlus = faCartPlus;
    faBan = faBan;

    currentMode: string = '';

    isCartDisabled: boolean = true;
    showCart: boolean = false;
    editMode: boolean = false;

    cart: any;
    cartLength: number;

    cartId: number = 0;

    editObjects = [];

    private subscriptions: Subscription[] = [];

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.cart = {};
        this.cartLength = 0;
    }

    ngOnInit(): void {
        this.subscribeToService();
        this.syncCart();
        this.initCartId();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentComponent'] && !changes['currentComponent'].firstChange) {
            this.syncCart();
            this.editMode = false;
            this.guidedService.cartEditMode = false;
            this.isCartDisabled = true;
            this.editObjects = [];
            this.initCartId();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    private initCartId(): void {
        let largest = 0;
        for (let type in this.cart) {
            for (let object of this.cart[type]) {
                if (object.cartId > largest) largest = object.cartId;
            }
        }
        this.cartId = largest;
    }

    addCartItem(data) {
        switch (this.currentMode) {
            case '':
                break;
            default:
                if (this.cartLength === 0) this.cart = {};

                let editObjFound = [];
                for (let i in this.editObjects) {
                    editObjFound.push(false);
                }

                for (let i in data.push) {
                    let obj = data.push[i];

                    let name = this.guidedService.getObjectTypeName(obj.type);

                    if (this.cart[name] && obj.cartId) { // Existing Object
                        let objFound = false;

                        for (let j in this.editObjects) {
                            if (this.editObjects[j].cartId === obj.cartId) {
                                objFound = true;
                                editObjFound[j] = true;

                                for (let k in this.cart[name]) {
                                    if (this.cart[name][k].cartId === obj.cartId) {
                                        obj['display_name'] = this.getDisplayName(obj, this.cart[name].length, this.cart[name][k].display_name);
                                        obj.id = this.getStixId(obj, name);
                                        this.cart[name][k] = obj;
                                        break;
                                    }
                                }
                            }
                        }

                        if (objFound === false) {
                            this.cartId++;
                            obj.cartId = this.cartId;
                            this.cartLength++;

                            if (!obj.id) {
                                obj.id = this.getStixId(obj, name);
                            }

                            obj['display_name'] = this.getDisplayName(obj, this.cart[name].length, '');
                            this.cart[name].push(obj);
                        }
                    } else if (this.cart[name]) { // Existing Object, no ID
                        this.cartId++;
                        obj.cartId = this.cartId;

                        if (!obj.id) {
                            obj.id = this.getStixId(obj, name);
                        }

                        obj['display_name'] = this.getDisplayName(obj, this.cart[name].length, '');
                        this.cart[name].push(obj);

                        this.cartLength++;
                    } else { // Fresh new STIX Object
                        this.cartId++;
                        obj.cartId = this.cartId;

                        if (!obj.id) {
                            obj.id = this.getStixId(obj, name);
                        }

                        obj['display_name'] = this.getDisplayName(obj, 0, '');
                        this.cart[name] = [obj];

                        this.cartLength++;
                    }
                }

                if (editObjFound.includes(false)) {
                    for (let i in editObjFound) {
                        if (editObjFound[i] === false) {
                            let name = this.guidedService.getObjectTypeName(this.editObjects[i].type);

                            for (let j in this.cart[name]) {
                                if (this.cart[name][j].cartId === this.editObjects[i].cartId) {
                                    this.cart[name].splice(j, 1);
                                    this.cartLength--;
                                    break;
                                }
                            }
                        }
                    }
                }
        }

        this.guidedService.syncCart(this.currentMode, this.cart);

        this.editMode = false;
        this.guidedService.cartEditMode = false;
        this.editObjects = [];
    }

    getStixId(object, typeName) {

        // If its an SCO, generate a new id
        let scos = SCO_LIST.slice(); //Can only be an SDO or custom (not any other object type)
        if(scos.includes(object.type)){
            return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
        }

        // If its not an SCO, try to preserve id during edits
        if(this.guidedService.cart && this.guidedService.cart[this.currentMode] && this.guidedService.cart[this.currentMode][typeName]){
            for (let oldObject of this.guidedService.cart[this.currentMode][typeName]) {
                if (oldObject.cartId === object.cartId) {
                    return oldObject.id;
                }
            }
        }

        // Fallback: new object or edit not found
        return `${object.type}--${this.stixService.getUUIDFrIdContributingProperties(object)}`;
    }

    addToCart() {
        this.guidedService.addItemClicked$.next(false);
    }

    cancelUpdate() {
        this.editMode = false;
        this.guidedService.cartEditMode = false;
        this.isCartDisabled = true;
        this.editObjects = [];

        this.guidedService.addItemClicked$.next(true);
    }

    clearCart() {
        this.cart = {};
        this.cartLength = 0;
        this.guidedService.syncCart(this.currentMode, this.cart);
    }

    deleteFromCart(key, index, search) {
        switch (this.currentMode) {
            default:
                let tempObject = this.cart[key][index];
                this.cart[key].splice(index, 1);

                if (this.cart[key].length === 0) delete this.cart[key];

                if (search === true) {
                    switch (this.currentMode) {
                        case 'how-pattern-builder':
                        case 'how-observable':
                            if (this.cart['Sighting']) {
                                for (let i in this.cart['Sighting']) {
                                    let sighting = this.cart['Sighting'][i];

                                    if (sighting.sighting_of_ref === tempObject.id) {
                                        this.deleteFromCart('Sighting', i, false);
                                        break;
                                    }
                                }
                            }
                            if (this.cart['Observed Data']) {
                                for (let i in this.cart['Observed Data']) {
                                    let sighting = this.cart['Observed Data'][i];

                                    if (sighting.object_refs.includes(tempObject.id)) {
                                        this.deleteFromCart('Observed Data', i, false);
                                        break;
                                    }
                                }
                            }
                    }
                }
        }

        this.guidedService.syncCart(this.currentMode, this.cart);

        this.cartLength--;
        if (this.cartLength === 0) this.showCart = false;
    }

    public async editFromCart(key, index) {
        if (!this.cart[key]) {
            this.editMode = true;
            this.guidedService.cartEditMode = true;
            this.showCart = false;
            return;
        }

        this.editObjects = [];

        switch (this.currentMode) {
            default:
                let tempObject = this.cart[key][index];
                this.editObjects.push(tempObject);

                let found = false;

                switch (tempObject.type) {
                    case 'sighting':
                        let splitArr = tempObject.sighting_of_ref.split('--');
                        let type = this.guidedService.getObjectTypeName(splitArr[0]);

                        if (this.cart[type]) {
                            for (let i in this.cart[type]) {
                                let object = this.cart[type][i];
                                if (tempObject.sighting_of_ref === object.id) {
                                    found = true;

                                    let emitObj = {
                                        main: object,
                                        observed: tempObject,
                                    };

                                    this.editObjects.push(object);

                                    this.guidedService.updateItemClicked$.next(emitObj);
                                    break;
                                }
                            }
                        }

                        if (found === false) this.guidedService.updateItemClicked$.next(tempObject);
                        break;
                    case 'observed-data':
                        let split = tempObject.object_refs[0].split('--');
                        let objType = this.guidedService.getObjectTypeName(split[0]);

                        if (this.cart[objType]) {
                            for (let i in this.cart[objType]) {
                                let object = this.cart[objType][i];
                                if (tempObject.object_refs.includes(object.id)) {
                                    found = true;

                                    let emitObj = {
                                        main: object,
                                        observed: tempObject,
                                    };

                                    this.editObjects.push(object);
                                    this.guidedService.updateItemClicked$.next(emitObj);
                                    break;
                                }
                            }
                        }

                        if (found === false) this.guidedService.updateItemClicked$.next(tempObject);
                        break;
                    case 'identity':
                        if (tempObject.type === 'threat-actor') {
                            this.editObjects = [];
                            let objType = this.guidedService.getObjectTypeName(tempObject.type);

                            let emitObj = {
                                arr: [],
                            };

                            for (let i in this.cart[objType]) {
                                let object = this.cart[objType][i];

                                if (object.linkId === tempObject.linkId) {
                                    this.editObjects.push(object);
                                    emitObj.arr.push(object);
                                }
                            }

                            this.guidedService.updateItemClicked$.next(emitObj);
                        } else {
                            this.guidedService.updateItemClicked$.next(tempObject);
                        }
                        break;
                    default:
                        if (this.cart['Observed Data']) {
                            for (let i in this.cart['Observed Data']) {
                                let observed = this.cart['Observed Data'][i];

                                if (observed.object_refs.includes(tempObject.id)) {
                                    found = true;

                                    let emitObj = {
                                        main: tempObject,
                                        observed: observed,
                                    };

                                    this.editObjects.push(observed);

                                    this.guidedService.updateItemClicked$.next(emitObj);
                                    break;
                                }
                            }
                        }

                        if (found === false) this.guidedService.updateItemClicked$.next(tempObject);
                        break;
                }

                break;
        }

        this.editMode = true;
        this.guidedService.cartEditMode = true;
        this.showCart = false;
        await db.clearItemBeingEdited();
    }

    getDisplayName(opt, index, prev) {
        let displayString = '';
        switch (opt.type) {
            case 'impact':
                displayString = `${opt.impact_category}`;
                break;
            case 'malware-analysis':
                break;

            case 'artifact':
                displayString = (opt.url ? opt.url : '') + (opt.payload_bin ? opt.payload_bin : '');
                break;

            case 'autonomous-system':
                if (opt.name) {
                    displayString = opt.number + (opt.name ? ' (' + opt.name + ')' : '');
                } else {
                    displayString = opt.number;
                }
                break;

            case 'directory':
                displayString = opt.path;
                break;

            case 'email-message':
                displayString = opt.subject ? opt.subject : '';
                break;

            case 'file':
                if (opt.name) displayString = opt.name;
                else if (opt.hashes) {
                    for (let key in opt.hashes) {
                        displayString = `${key}:${opt.hashes[key]}`;
                        break;
                    }
                } else displayString = '';
                break;

            case 'domain-name':
            case 'email-addr':
            case 'ipv4-addr':
            case 'ipv6-addr':
            case 'mac-addr':
            case 'url':
                displayString = opt.value;
                break;

            case 'process':
                if (opt.pid) displayString = opt.pid;
                else if (opt.cwd) displayString = opt.cwd;
                else displayString = '';
                break;

            case 'user-account':
                if (opt.user_id) displayString = opt.user_id;
                else if (opt.account_login) displayString = opt.account_login;
                else if (opt.display_name) displayString = opt.display_name;
                else displayString = '';
                break;

            case 'windows-registry-key':
                if (opt.key) displayString = opt.key;
                else displayString = '';
                break;

            case 'x509-certificate':
                if (opt.subject) displayString = opt.subject;
                else if (opt.serial_number) displayString = opt.serial_number;
                else if (opt.hashes) displayString = Object.keys(opt.hashes)[0] + ': ' + opt.hashes[Object.keys(opt.hashes)[0]];
                else if (opt.issuer) displayString = opt.issuer;
                else displayString = '';
                break;
            case 'network-traffic':
                const src = opt.src_ref ? this.getNetworkRefLabel(opt.src_ref) : null;
                const dst = opt.dst_ref ? this.getNetworkRefLabel(opt.dst_ref) : null;

                if(src && dst) {
                    displayString = `${src} to ${dst}`;
                } else if(src) {
                    displayString = src;
                } else if (dst) {
                    displayString = dst;
                } else {
                    displayString = opt.id;
                }
                break;
            case 'attack-pattern':
            case 'campaign':
            case 'course-of-action':
            case 'grouping':
            case 'identity':
            case 'incident':
            case 'indicator':
            case 'infrastructure':
            case 'intrusion-set':
            case 'location':
            case 'malware':
            case 'note':
            case 'observed-data':
            case 'opinion':
            case 'report':
            case 'threat-actor':
            case 'tool':
            case 'vulnerability':
            case 'sighting':
            case 'mutex':
            case 'network-traffic':
            case 'software':
            case 'language-content':
            case 'marking-definition':
            case 'extension-definition':
            case 'event':
            case 'cyber-threat-detection':
                displayString = opt.name;
                break;

            default:
                if (prev !== '') {
                    displayString = prev;
                    break;
                }

                displayString = `${opt.type} ${Number(index) + 1}`;
        }
        const displayStr = String(displayString ?? '');
        if (displayStr.length > 100) displayString = `${displayStr.substring(0, 97) + '...'}`;
        if (displayString !== null && displayString !== undefined && displayString !== '') {
            return displayString;
        } else {
            if (this.editMode === true) {
                let ind = '';
                for (let i in this.editObjects) {
                    if (this.editObjects[i].type === opt.type) {
                        ind = this.editObjects[i].display_name.charAt(this.editObjects[i].display_name.length - 1);
                    }
                }
                if (prev !== '') return prev;

                return `${opt.type} ${Number(ind)}`;
            } else {
                if (prev !== '') return prev;

                return `${opt.type} ${Number(index) + 1}`;
            }
        }
    }

    getName(value) {
        return value.display_name;
    }

    private subscribeToService() {
        this.subscriptions.push(
            this.guidedService.cartDisabled$.subscribe((data: boolean) => {
                this.isCartDisabled = data;
            })
        );

        this.subscriptions.push(
            this.guidedService.editModeChange$.subscribe((data: boolean) => {
                if (this.editMode === true) this.editMode = false;
            })
        );

        this.subscriptions.push(
            this.guidedService.newCartItem$.subscribe((data: any) => {
                this.currentMode = data.mode;
                this.addCartItem(data);
            })
        );

        this.subscriptions.push(
            this.guidedService.syncCartTrigger$.subscribe((data: any) => {
                this.syncCart();
            })
        );

        this.subscriptions.push(
            this.guidedService.clearCartTrigger$.subscribe((data: any) => {
                this.clearCart();
            })
        );

        this.subscriptions.push(
            this.guidedService.getEditItemTrigger$.subscribe((data: any) => {
                this.editFromCart(data.key, data.index);
                this.guidedService.editCartObject = {};
            })
        );
    }

    syncCart() {
        this.cartLength = 0;
        if (this.guidedService.cart[this.currentComponent]) {
            this.cart = this.guidedService.cart[this.currentComponent];

            for (let type in this.cart) {
                this.cartLength += this.cart[type].length;
            }
        }
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
