import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';


import { MultipartDialogComponent } from './multipart-dialog.component';

class MockDialogRef {
    closedWith: any;
    close(val?: any) { this.closedWith = val; }
}

class MockStixService {
    bundle = { objects: [] };
}

function createComponent(data:any) {
    const dialog = new MockDialogRef();
    const comp = new MultipartDialogComponent(new MockStixService() as any, dialog as any, data as any);
    return { comp, dialog };
}

describe('MultipartDialogComponent', () => {
    it('initializes fields from data', () => {
        const data = {
            allowedRefs: ['id1','id2'],
            mode: 'raw',
            body: 'the body',
            body_raw_ref: 'artifact--abcd',
            content_type: 'text/plain',
            content_disposition: 'inline',
        };
        const { comp } = createComponent(data);
        expect(comp.ref_options).toEqual(['id1','id2']);
        expect(comp.mode).toBe('raw');
        expect(comp.body).toBe('the body');
        expect(comp.body_raw_ref).toBe('artifact--abcd');
        expect(comp.content_type).toBe('text/plain');
        expect(comp.content_disposition).toBe('inline');
    });

    it('getObjDisplayName for artifact', () => {
        const { comp } = createComponent({ allowedRefs: [], mode: '', body: '', body_raw_ref: '', content_type: '', content_disposition: '' });
        const opt = { type: 'artifact', url: 'http://example.com', payload_bin: 'data', id: 'artifact--1234' };
        const result = comp.getObjDisplayName(opt);
        expect(result).toBe('http://example.comdata | artifact--1234');
    });

    it('onAdd closes dialog with proper payload', () => {
        const { comp, dialog } = createComponent({ allowedRefs: [], mode: '', body: '', body_raw_ref: '', content_type: '', content_disposition: '' });
        comp.body = 'body content';
        comp.content_type = 'application/json';
        comp.content_disposition = 'attachment';
        comp.onAdd();
        expect(dialog.closedWith).toEqual({ body: 'body content', content_type: 'application/json', content_disposition: 'attachment' });
    });

    it('cancelModal closes without args', () => {
        const { comp, dialog } = createComponent({ allowedRefs: [], mode: '', body: '', body_raw_ref: '', content_type: '', content_disposition: '' });
        comp.cancelModal();
        expect(dialog.closedWith).toBeUndefined();
    });

    it('isModalAddEnabled validates body_raw_ref id', () => {
        const { comp } = createComponent({ allowedRefs: [], mode: '', body: '', body_raw_ref: '', content_type: '', content_disposition: '' });
        // invalid id
        comp.body_raw_ref = 'invalid--id';
        comp.isModalAddEnabled();
        expect(comp.body_ref_error).toBe('Must be a valid Artifact or File ID');
        expect(comp.addEnabled).toBe(false);
    });
});
