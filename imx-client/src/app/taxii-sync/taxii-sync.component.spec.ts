import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiiSyncComponent } from './taxii-sync.component';

describe('TaxiiSyncComponent', () => {
    let component: TaxiiSyncComponent;
    let fixture: ComponentFixture<TaxiiSyncComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TaxiiSyncComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TaxiiSyncComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
