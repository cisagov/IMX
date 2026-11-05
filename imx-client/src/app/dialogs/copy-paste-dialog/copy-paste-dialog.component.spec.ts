import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CopyPasteDialogComponent } from './copy-paste-dialog.component';

// mock services
class NgbActiveModalMock {
  dismiss() {}
  close() {}
}
class IdentifyStixServiceMock {
  postIdentifyStix = vi.fn();
  postIdentifyStixFile = vi.fn();
  validateUploadSize = vi.fn().mockReturnValue(null);
  dedupeObjects = vi.fn((objects) => objects);
}
class MispStixServiceMock {
  async mispToStix(_: any) { return { status: 200, data: { objects: [{ id: 't1', type: 'file', name: 'test.txt' }] } }; }
}
class AnnouncementServiceMock {
  show() {}
}
class EnvServiceMock {
  env = { imxServer: { url: 'http://localhost', user: 'u', pass: 'p' } };
}
class StixServiceMock {
  bundle = { objects: [] };
}

describe('CopyPasteDialogComponent', () => {
  let component: CopyPasteDialogComponent;

  beforeEach(() => {
    component = new CopyPasteDialogComponent(
      new NgbActiveModalMock(),
      new IdentifyStixServiceMock(),
      new StixServiceMock(),
      new AnnouncementServiceMock(),
      new EnvServiceMock(),
      new MispStixServiceMock()
    );
  });

  it('should toggle disableParse when tab set to copy-paste based on textBody', () => {
    component.setTab('copy-paste');
    expect(component.disableParse).toBe(true);
    component.textBody = 'data';
    component.setTab('copy-paste');
    expect(component.disableParse).toBe(false);
  });

  it('should update disableParse based on text and misp bodies', () => {
    component.tab = 'copy-paste';
    component.textBody = '';
    component.mispBody = '';
    component.textBodyChange();
    expect(component.disableParse).toBe(true);
    component.textBody = 'x';
    component.textBodyChange();
    expect(component.disableParse).toBe(false);
  });

  it('onFileChanged should set formData and toggle disableParse', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;
    component.onFileChanged(event);
    expect(component.selectedFiles.length).toBe(1);
    expect(component.formData.get('file')).toBeInstanceOf(File);
    expect(component.disableParse).toBe(false);
  });

  it('onParse copy-paste processes objects and sets flags', async () => {
    const mockService = component['identifyStix'] as IdentifyStixServiceMock;
    mockService.postIdentifyStix.mockResolvedValue({ objects: [{ id: 'obj1', type: 'file', name: 'a.txt' }] });
    component.tab = 'copy-paste';
    component.textBody = 'sample';
    await component.onParse();
    expect(component.isParsed).toBe(true);
    expect(component.allObjects.length).toBe(1);
    expect(component.parsedObjects['file'][0].name).toBe('a.txt');
  });

  it('updateSelectAll toggles selection', () => {
    component.allObjects = [{ id: '1' }, { id: '2' }];
    component.updateSelectAll();
    expect([...component.selectedObjects]).toEqual(['1', '2']);
    expect(component.selectAll).toBe(true); // toggled to true after selecting
  });

  it('getComponentDisplay returns correct string for various types', () => {
    const fileComponent = { type: 'file', name: 'foo.txt' };
    const artifactComp = { type: 'artifact', url: 'http://example.com' };
    const nsx = { type: 'windows-registry-key', key: 'HKLM\\Software' };
    expect(component.getComponentDisplay(fileComponent)).toBe('foo.txt');
    expect(component.getComponentDisplay(artifactComp)).toBe('http://example.com');
    expect(component.getComponentDisplay(nsx)).toBe('HKLM\\Software');
  });
});
