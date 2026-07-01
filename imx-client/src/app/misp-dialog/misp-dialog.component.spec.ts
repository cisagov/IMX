import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MispDialogComponent } from './misp-dialog.component';

describe('MispDialogComponent', () => {
    let component: MispDialogComponent;
    let fixture: ComponentFixture<MispDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MispDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MispDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
