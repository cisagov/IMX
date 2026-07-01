import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AddComponentComponent } from 'src/app/add-component/add-component.component';
import { GuidedService } from 'src/app/guided.service';
import { StixService } from 'src/app/stix-service.service';
import {
    faExclamationTriangle,
    faAngleDoubleDown,
    faAngleDown,
    faAngleUp,
    faQuestionCircle,
    faPlus,
    faEdit,
    faTrash,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-how-cwe',
    templateUrl: './how-cwe.component.html',
    styleUrls: ['./how-cwe.component.css'],
    standalone: false,
})
export class HowCweComponent implements OnInit, OnDestroy {
    //With Parent
    @Output() showAssistance = new EventEmitter<any>();
    @Output() changePage = new EventEmitter<any>();

    component: string = 'how-cwe';

    private cartSubscriptions: Subscription[] = [];
    private cveInput$ = new Subject<string>();

    @ViewChild('appAddComponent', { static: false }) appAddComponent: AddComponentComponent;

    faAngleDoubleDown = faAngleDoubleDown;
    faAngleDown = faAngleDown;
    faAngleUp = faAngleUp;
    faPlus = faPlus;
    faEdit = faEdit;
    faTrash = faTrash;
    faQuestionCircle = faQuestionCircle;
    faExclamationTriangle = faExclamationTriangle;
    faInfoCircle = faInfoCircle;

    answer = 'Y';
    currentWeakness = '';
    currentTtp = '';
    currentControl = [];
    currentCveId = '';
    types = [];
    data = [];
    editMode: boolean = false;
    cartIds: number[] = [];
    nameToUpdate = '';
    message = '';
    errorMessage = '';
    cveValid = false;
    isValidating = false;
    private cveRequestId = 0;

    previousControl = [];

    objectSelection = null;

    angleDownWks = true;
    angleDownTtp = true;
    angleDownCtl = false;
    angleDownVul = false;

    weaknessOptions: any[] = [
        { key: 'CWE-20', value: 'CWE-20: Improper Input Validation' },
        { key: 'CWE-74', value: "CWE-74: Improper Neutralization of Special Elements in Output Used by a Downstream Component ('Injection')" },
        { key: 'CWE-116', value: 'CWE-116: Improper Encoding or Escaping of Output' },
        { key: 'CWE-119', value: 'CWE-119: Improper Restriction of Operations within the Bounds of a Memory Buffer' },
        { key: 'CWE-200', value: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor' },
        { key: 'CWE-269', value: 'CWE-269: Improper Privilege Management' },
        { key: 'CWE-287', value: 'CWE-287: Improper Authentication' },
        { key: 'CWE-311', value: 'CWE-311: Missing Encryption of Sensitive Data' },
        { key: 'CWE-326', value: 'CWE-326: Inadequate Encryption Strength' },
        { key: 'CWE-327', value: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm' },
        { key: 'CWE-330', value: 'CWE-330: Use of Insufficiently Random Values' },
        { key: 'CWE-345', value: 'CWE-345: Insufficient Verification of Data Authenticity' },
        { key: 'CWE-362', value: "CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')" },
        { key: 'CWE-400', value: 'CWE-400: Uncontrolled Resource Consumption' },
        { key: 'CWE-404', value: 'CWE-404: Improper Resource Shutdown or Release' },
        { key: 'CWE-407', value: 'CWE-407: Inefficient Algorithmic Complexity' },
        { key: 'CWE-436', value: 'CWE-436: Interpretation Conflict' },
        { key: 'CWE-610', value: 'CWE-610: Externally Controlled Reference to a Resource in Another Sphere' },
        { key: 'CWE-662', value: 'CWE-662: Improper Synchronization' },
        { key: 'CWE-665', value: 'CWE-665: Improper Initialization' },
        { key: 'CWE-668', value: 'CWE-668: Exposure of Resource to Wrong Sphere' },
        { key: 'CWE-669', value: 'CWE-669: Incorrect Resource Transfer Between Spheres' },
        { key: 'CWE-670', value: 'CWE-670: Always-Incorrect Control Flow Implementation' },
        { key: 'CWE-672', value: 'CWE-672: Operation on a Resource after Expiration or Release' },
        { key: 'CWE-674', value: 'CWE-674: Uncontrolled Recursion' },
        { key: 'CWE-682', value: 'CWE-682: Incorrect Calculation' },
        { key: 'CWE-697', value: 'CWE-697: Incorrect Comparison' },
        { key: 'CWE-704', value: 'CWE-704: Incorrect Type Conversion or Cast' },
        { key: 'CWE-706', value: 'CWE-706: Use of Incorrectly-Resolved Name or Reference' },
        { key: 'CWE-732', value: 'CWE-732: Incorrect Permission Assignment for Critical Resource' },
        { key: 'CWE-754', value: 'CWE-754: Improper Check for Unusual or Exceptional Conditions' },
        { key: 'CWE-755', value: 'CWE-755: Improper Handling of Exceptional Conditions' },
        { key: 'CWE-834', value: 'CWE-834: Excessive Iteration' },
        { key: 'CWE-862', value: 'CWE-862: Missing Authorization' },
        { key: 'CWE-863', value: 'CWE-863: Incorrect Authorization' },
        { key: 'CWE-913', value: 'CWE-913: Improper Control of Dynamically-Managed Code Resources' },
        { key: 'CWE-922', value: 'CWE-922: Insecure Storage of Sensitive Information' },
    ];

    selectedControlOption: string | null = null;
    controlOptions: any[] = [
        'Control Access',
        'Harden Credentials',
        'Log Management',
        'Antivirus Solutions',
        'Detection Tools',
        'Network Security Configuration',
        'Software Update',
    ];

    constructor(
        public guidedService: GuidedService,
        public stixService: StixService
    ) {
        this.showAssistance = new EventEmitter();
    }

    ngOnInit(): void {
        this.cartSubscriptions.push(
            this.guidedService.addItemClicked$.subscribe((cancel) => this.addCartItem(cancel)),
            this.guidedService.updateItemClicked$.subscribe((data) => this.editCartItem(data)),
            this.cveInput$.pipe(debounceTime(500)).subscribe(() => this.isCveValid())
        );
        this.objectSelection = this.guidedService.allIOCObjects.find((o) => o.routeName === 'vulnerability');
        this.nameToUpdate = '';

        const editCartTimeout = setTimeout(() => {
            if (this.guidedService.editCartObject.component && this.guidedService.editCartObject.component === this.component) {
                this.guidedService.getEditItemTrigger$.next(this.guidedService.editCartObject);
            }
        }, 100);
    }

    toggleAnswer(event) {
        if (this.answer === 'Y') {
            this.angleDownCtl = true;
            for (let control of this.previousControl) {
                this.currentControl.push(control);
            }

            this.previousControl = [];
        } else {
            this.angleDownCtl = false;
            for (let control of this.currentControl) {
                this.previousControl.push(control);
            }

            this.currentControl = [];
        }

        this.checkCart();
    }

    addCartItem(cancel) {
        if (cancel) {
            this.reset();
            this.checkCart();
            return;
        }

        let vulnerabiltiyObject = {
            type: 'vulnerability',
            name: this.currentWeakness,
        };

        if (this.currentControl.length > 0) {
            vulnerabiltiyObject['description'] = this.currentControl.join();
        }

        if (this.currentTtp) {
            vulnerabiltiyObject['ttp'] = this.currentTtp;
        }

        if (this.currentCveId !== '') {
            vulnerabiltiyObject['external_references'] = [
                {
                    source_name: 'cve',
                    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
                    external_id: this.currentCveId,
                },
            ];
        }

        vulnerabiltiyObject['cartId'] = this.cartIds[0] ? this.cartIds[0] : null;

        let emitObj = {
            mode: this.component,
            push: [vulnerabiltiyObject],
        };

        this.guidedService.newCartItem$.next(emitObj);
        this.guidedService.cartDisabled$.next(true);
        this.reset();
    }

    async checkCart() {
        if (this.currentWeakness !== '') {
            this.changeWeakness();
        } else {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        if (this.currentCveId !== '' && !this.cveValid) {
            this.guidedService.cartDisabled$.next(!this.cveValid);
            return;
        }

        if (this.answer === 'Y' && this.currentControl.length === 0) {
            this.guidedService.cartDisabled$.next(true);
            return;
        }

        this.guidedService.cartDisabled$.next(false);
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
                this.guidedService.findPreviouslyAddedObjects('attack-pattern', 'attack-pattern-cwe');
                this.guidedService.addedObjects.subscribe((addedObjects) => {
                    if (addedObjects.eventType === 'attack-pattern-cwe' && addedObjects.objects && addedObjects.objects.length > 0) {
                        let ap = addedObjects;

                        this.guidedService.findPreviouslyAddedObjects('vulnerability', 'vulnerability-cwe');
                        this.guidedService.addedObjects.subscribe((addedObjects) => {
                            if (addedObjects.eventType === 'vulnerability-cwe' && addedObjects.objects && addedObjects.objects.length > 0) {
                                this.guidedService.createRelationships('targets', ap.objects[0].id, 'vulnerability');
                            }
                        });
                    }
                });
            }, 300);
        }
    }

    changeWeakness() {
        if (this.currentWeakness) {
            this.angleDownVul = true;
        }
    }

    editCartItem(event) {
        this.reset();
        this.editMode = true;

        this.cartIds = [event.cartId];

        this.currentWeakness = event.name;
        this.angleDownCtl = false;
        this.angleDownVul = false;

        if (event.description) {
            this.currentControl = event.description.split(',');
            if (this.currentControl.length !== 0) {
                this.answer = 'Y';
                this.angleDownCtl = true;
            }
        }

        this.currentTtp = event.ttp ? event.ttp : '';

        if (event.external_references) {
            this.currentCveId = event.external_references[0].external_id;
            this.angleDownVul = true;
        }

        this.checkCart();
    }

    getTtps() {
        if (Object.keys(this.guidedService.cart).length !== 0 && this.guidedService.cart['how-ttp'])
            return [
                ...this.stixService.bundle.objects.filter((obj) => obj.type == 'attack-pattern'),
                ...this.guidedService.cart['how-ttp']['Attack Pattern'],
            ];
        else return [...this.stixService.bundle.objects.filter((obj) => obj.type == 'attack-pattern')];
    }

    onCveInputChange() {
        this.currentCveId = this.currentCveId.toUpperCase();
        this.message = '';
        this.errorMessage = '';
        this.cveInput$.next(this.currentCveId);
    }

    async isCveValid() {
        this.isValidating = true;
        const requestId = ++this.cveRequestId;
        const cveRegex = new RegExp('^CVE-[0-9]{4}-[0-9]{4,}$');

        if (!cveRegex.test(this.currentCveId)) {
            this.errorMessage = 'CVE must be in format CVE-[4 digit year]-[4 or more digit ID]';
            this.message = '';
            this.isValidating = false;
            this.cveValid = false;
            this.checkCart();
            return false;
        }

        try {
            this.guidedService.cartDisabled$.next(true);
            let response = await this.guidedService.validateCveId(this.currentCveId);

            if (requestId !== this.cveRequestId) return false;

            if (response.totalResults === 1) {
                this.cveValid = true;
                this.message = 'Valid CVE';
                this.errorMessage = '';
                this.isValidating = false;
                this.checkCart();
                return true;
            } else {
                this.cveValid = false;
                this.errorMessage = 'Invalid CVE: will not accept {CVE-ID} for vulnerabilities not yet published in the NVD.';
                this.message = '';
                this.isValidating = false;
                this.checkCart();
                return false;
            }
        } catch (e) {
            if (requestId !== this.cveRequestId) return false;
            this.errorMessage = 'Unable to validate due to service interruption... Please try again.';
            this.message = '';
            this.isValidating = false;
            this.cveValid = false;
            this.checkCart();
            return false;
        }
    }

    reset() {
        this.currentWeakness = '';
        this.currentControl = [];
        this.previousControl = [];
        this.currentTtp = '';
        this.currentCveId = '';

        this.angleDownCtl = false;
        this.angleDownTtp = true;
        this.angleDownWks = true;
        this.angleDownVul = false;
        this.editMode = false;

        this.message = '';
        this.errorMessage = '';

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
    get availableControlOptions() {
        return this.controlOptions.filter(
            (control) => !this.currentControl.includes(control) // might be wrong
        );
    }

    addCommonControl(control: string) {
        if (!control) return;
        if (!this.currentControl.includes(control)) {
            this.currentControl.push(control);
        }

        this.selectedControlOption = null;
        this.checkCart();
    }

    deleteCommonControl(control: string) {
        this.currentControl = this.currentControl.filter((m) => m !== control);
        this.checkCart();
    }
}
