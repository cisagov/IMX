import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCertComponent } from './user-cert.component';

describe('UserCertComponent', () => {
    let component: UserCertComponent;
    let fixture: ComponentFixture<UserCertComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserCertComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UserCertComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
