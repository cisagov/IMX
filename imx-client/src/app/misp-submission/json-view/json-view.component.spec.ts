import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonViewComponent } from './json-view.component';

describe('JsonViewComponent', () => {
    let component: JsonViewComponent;
    let fixture: ComponentFixture<JsonViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonViewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(JsonViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
