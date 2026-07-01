import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionComponentComponent } from './submission-component.component';

describe('SubmissionComponentComponent', () => {
    let component: SubmissionComponentComponent;
    let fixture: ComponentFixture<SubmissionComponentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SubmissionComponentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SubmissionComponentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
