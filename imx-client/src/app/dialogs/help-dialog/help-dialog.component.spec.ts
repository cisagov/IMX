import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HelpDialogComponent } from './help-dialog.component';

class MockNgbActiveModal {
  close = vi.fn();
}

describe('HelpDialogComponent', () => {
  let component: HelpDialogComponent;
  let modal: MockNgbActiveModal;

  beforeEach(() => {
    modal = new MockNgbActiveModal() as unknown as any;
    component = new HelpDialogComponent(modal as unknown as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit sets default buttons when none provided', () => {
    component.messageObj = { menu: 'main' } as any;
    component.buttonsToShow = [];
    component.ngOnInit();
    expect(component.buttonsToShow).toEqual(['cancel', 'ok']);
    expect(component.menuSelection).toBe('main');
  });

  it('showButton returns true for existing button and false otherwise', () => {
    component.buttonsToShow = ['cancel', 'ok'];
    expect(component.showButton('cancel')).toBe(true);
    expect(component.showButton('ok')).toBe(true);
    expect(component.showButton('delete')).toBe(false);
  });

  it('showTextOnly returns true when index present', () => {
    component.messageObj = { textOnlyIndex: [1, 3] } as any;
    expect(component.showTextOnly(1)).toBe(true);
    expect(component.showTextOnly(2)).toBe(false);
  });

  it('close() triggers activeModal.close with cancel', () => {
    component.close();
    expect(modal.close).toHaveBeenCalledWith('cancel');
  });

  it('confirm() triggers activeModal.close with confirm', () => {
    component.confirm();
    expect(modal.close).toHaveBeenCalledWith('confirm');
  });
});
