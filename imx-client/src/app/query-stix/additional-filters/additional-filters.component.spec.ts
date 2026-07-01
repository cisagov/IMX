import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalFiltersComponent } from './additional-filters.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('AdditionalFiltersComponent', () => {
    let component: AdditionalFiltersComponent;
    let fixture: ComponentFixture<AdditionalFiltersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdditionalFiltersComponent],
            imports: [FormsModule, FontAwesomeModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdditionalFiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
