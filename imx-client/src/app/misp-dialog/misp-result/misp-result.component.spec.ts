import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MispResultComponent } from './misp-result.component';

describe('MispResultComponent', () => {
    let component: MispResultComponent;
    let fixture: ComponentFixture<MispResultComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MispResultComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MispResultComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
