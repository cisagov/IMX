import { describe, it, expect, beforeEach } from 'vitest';
import { MessageDialogComponent } from './message-dialog.component';

class MockActiveModal {
    closedWith: string;
    close(val: string) { this.closedWith = val; }
}

function createComponent(messageObj?: any) {
    const modal = new MockActiveModal();
    const comp = new MessageDialogComponent(modal as any);
    comp.messageObj = messageObj;
    return { comp, modal };
}

describe('MessageDialogComponent', () => {
    it('calls close on close()', () => {
        const { comp, modal } = createComponent();
        comp.close();
        expect(modal.closedWith).toBe('cancel');
    });

    it('calls confirm on confirm()', () => {
        const { comp, modal } = createComponent();
        comp.confirm();
        expect(modal.closedWith).toBe('confirm');
    });

    it('autoConfirms when messageObj.autoConfirm is true', () => {
        const { comp, modal } = createComponent({ autoConfirm: true });
        comp.ngOnInit();
        expect(modal.closedWith).toBe('confirm');
    });
});
