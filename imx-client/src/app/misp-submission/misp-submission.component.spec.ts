import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MispSubmissionComponent } from './misp-submission.component';

describe('MispSubmissionComponent', () => {
    let component: MispSubmissionComponent;
    let fixture: ComponentFixture<MispSubmissionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MispSubmissionComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MispSubmissionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
