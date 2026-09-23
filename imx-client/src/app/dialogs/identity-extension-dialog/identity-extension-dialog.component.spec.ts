import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { IdentityExtensionDialogComponent, EmailAddressEntry, PhoneNumberEntry, SocialMediaEntry } from './identity-extension-dialog.component';

class MockDialogRef {
    closedWith: any;
    close(value: any) { this.closedWith = value; }
}

class MockStixService {
    guidedUI = true;
    guidedEditing = false;
    bundle = { objects: [] };
}

function createComponent(data: any) {
    const stix = new MockStixService();
    const dialog = new MockDialogRef();
    return new IdentityExtensionDialogComponent(stix as any, dialog as any, data as any);
}

describe('IdentityExtensionDialogComponent', () => {
    it('initializes state for Email Address with entry', () => {
        const entry: EmailAddressEntry = {
            email_address_ref: 'addr-1',
            digital_contact_type: 'work',
            description: 'desc',
            classified: true,
        };
        const data = { type: 'Email Address', entry };
        const comp = createComponent(data);
        comp.ngOnInit();
        expect(comp.contact_info).toBe('addr-1');
        expect(comp.contact_type).toBe('work');
        expect(comp.contact_description).toBe('desc');
        expect(comp.contact_classified).toBe(true);
    });

    it('constructs email entry onConfirm', () => {
        const stix = new MockStixService();
        stix.guidedUI = true;
        const dialog = new MockDialogRef();
        const comp = new IdentityExtensionDialogComponent(stix as any, dialog as any, { type: 'Email Address' });
        comp.ngOnInit();
        comp.contact_info = 'user@example.com';
        comp.contact_type = 'personal';
        comp.contact_description = 'a';
        comp.contact_classified = false;
        comp.onConfirm();
        const sent = dialog.closedWith;
        expect(sent).toEqual({
            email_address_ref: 'user@example.com',
            digital_contact_type: 'personal',
            description: 'a',
            classified: false,
        });
    });

    it('validates phone number and sets error', () => {
        const comp = createComponent({ type: 'Phone Number' });
        comp.ngOnInit();
        comp.contact_info = 'invalid';
        comp.validateContactInfo('Phone Number');
        expect(comp.contactError).toBe(true);
        expect(comp.contactErrorMessage).toContain('Phone Number must be valid.');
    });
});