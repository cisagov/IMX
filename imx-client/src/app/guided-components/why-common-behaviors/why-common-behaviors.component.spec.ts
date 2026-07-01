import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyCommonBehaviorsComponent } from './why-common-behaviors.component';

describe('WhyCommonBehaviorsComponent', () => {
    let component: WhyCommonBehaviorsComponent;
    let fixture: ComponentFixture<WhyCommonBehaviorsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WhyCommonBehaviorsComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WhyCommonBehaviorsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
