import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentCoreObjectComponent } from './incident-core-object.component';

describe('IncidentCoreObjectComponent', () => {
    let component: IncidentCoreObjectComponent;
    let fixture: ComponentFixture<IncidentCoreObjectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IncidentCoreObjectComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(IncidentCoreObjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
