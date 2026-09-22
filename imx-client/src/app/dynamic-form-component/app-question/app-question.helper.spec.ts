import { describe, it, expect, beforeEach } from 'vitest';
import { AppQuestionHelper } from './app-question.helper';

describe('AppQuestionHelper', () => {
  let helper: AppQuestionHelper;
  const arrays = new Map<string, any[]>();

  beforeEach(() => {
    arrays.clear();
    helper = new AppQuestionHelper(arrays);
  });

  it('adds a new string when key not present', () => {
    helper.addString('key1', 'value');
    expect(arrays.get('key1')).toEqual(['value']);
  });

  it('does not add duplicate strings', () => {
    helper.addString('key1', 'dup');
    helper.addString('key1', 'dup');
    expect(arrays.get('key1')).toEqual(['dup']);
  });

  it('deleteString removes the specified item', () => {
    arrays.set('key2', ['a', 'b']);
    helper.deleteString('key2', 'a');
    expect(arrays.get('key2')).toEqual(['b']);
  });

  it('addString ignores currentID when adding all objects', () => {
    const currentID = 'curid';
    helper.addString('object_refs', 'obj1', currentID);
    helper.addString('object_refs', currentID, currentID);
    expect(arrays.get('object_refs')).toEqual(['obj1']);
  });
});
