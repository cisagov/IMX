import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatImpactComponent } from './what-impact.component';

describe('WhatImpactComponent', () => {
    let component: WhatImpactComponent;
    let fixture: ComponentFixture<WhatImpactComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhatImpactComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhatImpactComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
