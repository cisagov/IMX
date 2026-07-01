import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonModalComponent } from './json-modal.component';

describe('JsonModalComponent', () => {
    let component: JsonModalComponent;
    let fixture: ComponentFixture<JsonModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(JsonModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
