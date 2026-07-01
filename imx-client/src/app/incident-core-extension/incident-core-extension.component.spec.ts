import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentCoreExtensionComponent } from './incident-core-extension.component';

describe('IncidentCoreExtensionComponent', () => {
    let component: IncidentCoreExtensionComponent;
    let fixture: ComponentFixture<IncidentCoreExtensionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IncidentCoreExtensionComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(IncidentCoreExtensionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
