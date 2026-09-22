import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { CustomizeColumnsComponent } from './customize-columns.component';

class MockStixService {
    private subject = new BehaviorSubject<any>({ data: null });
    getData() { return this.subject.asObservable(); }
    sendData(data: any) { this.sent = data; }
    sent: any;
    trigger(data: any) { this.subject.next(data); }
}

class MockNgbActiveModal {}

describe('CustomizeColumnsComponent', () => {
    let component: CustomizeColumnsComponent;
    let stixService: MockStixService;
    let activeModal: MockNgbActiveModal;

    beforeEach(() => {
        stixService = new MockStixService();
        activeModal = new MockNgbActiveModal();
        component = new CustomizeColumnsComponent(stixService as any, activeModal as any);
    });

    it('subscribes to stixService and sets columns on init', () => {
        component.ngOnInit();
        stixService.trigger({ data: ['col1', 'col2'] });
        expect(component.columns).toEqual(['col1', 'col2']);
    });

    it('sends data via stixService on closeModal', () => {
        component.columns = ['colA'];
        component.closeModal();
        expect(stixService.sent).toEqual({ data: ['colA'] });
    });

    it('unsubscribes on destroy', () => {
        component.ngOnInit();
        const sub = component.customizeColumnsSubscription;
        const unsubscribeSpy = vi.spyOn(sub, 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });
});
