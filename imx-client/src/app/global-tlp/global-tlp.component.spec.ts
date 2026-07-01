import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalTlpComponent } from './global-tlp.component';

describe('GlobalTlpComponent', () => {
    let component: GlobalTlpComponent;
    let fixture: ComponentFixture<GlobalTlpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GlobalTlpComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GlobalTlpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
