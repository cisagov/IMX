import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizerModalComponent } from './visualizer-modal.component';

describe('VisualizerModalComponent', () => {
    let component: VisualizerModalComponent;
    let fixture: ComponentFixture<VisualizerModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VisualizerModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VisualizerModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
