import clone from '../src/utils-ts/clone';
import createSyncTypes, { actionGroups } from '../src/types/types';
import { baseActionsList } from '../src/types/types-actions';
import { Type, TypeUpdateAction } from '@commercetools/platform-sdk';
import { SyncAction } from '../src/utils-ts/types';

describe('Exports', () => {
  test('action group list', () => {
    expect(actionGroups).toEqual(['base', 'fieldDefinitions']);
  });

  test('correctly define base actions list', () => {
    expect(baseActionsList).toEqual([
      { action: 'changeKey', key: 'key' },
      { action: 'changeName', key: 'name' },
      { action: 'setDescription', key: 'description' },
    ]);
  });
});

describe('Actions', () => {
  let typesSync: SyncAction<Type, TypeUpdateAction>;
  let updateActions: TypeUpdateAction[];
  let before: object;
  let now: object;
  beforeEach(() => {
    typesSync = createSyncTypes([], {});
  });
  describe('mutation', () => {
    test('should ensure given objects are not mutated', () => {
      before = {
        name: 'Orwell',
        key: 'War-is-Peace',
      };
      now = {
        name: 'Orwell',
        key: 'Freedom-is-slavery',
      };
      typesSync.buildActions(now, before);
      expect(before).toEqual(clone(before));
      expect(now).toEqual(clone(now));
    });
  });
  describe('with name change', () => {
    beforeEach(() => {
      before = {
        name: 'Orwell',
      };
      now = {
        name: 'Ignorance-is-Strength',
      };
      updateActions = typesSync.buildActions(now, before);
    });
    test('should return `changeName` update-action', () => {
      expect(updateActions).toEqual([
        {
          action: 'changeName',
          name: 'Ignorance-is-Strength',
        },
      ]);
    });
  });
  describe('with key change', () => {
    beforeEach(() => {
      before = {
        key: 'orwell-key',
      };
      now = {
        key: 'huxley-key',
      };
      updateActions = typesSync.buildActions(now, before);
    });
    test('should return `changeKey` update-action', () => {
      expect(updateActions).toEqual([
        {
          action: 'changeKey',
          key: 'huxley-key',
        },
      ]);
    });
  });
  describe('with empty key change (shouldOmitEmptyString=false)', () => {
    beforeEach(() => {
      before = {
        key: null,
      };
      now = {
        key: '',
      };
      updateActions = typesSync.buildActions(now, before);
    });
    test('should return `changeKey` update-action', () => {
      expect(updateActions).toEqual([
        {
          action: 'changeKey',
          key: '',
        },
      ]);
    });
  });
  describe('with description change', () => {
    beforeEach(() => {
      before = {
        description: 'orwell-description',
      };
      now = {
        description: 'huxley-description',
      };
      updateActions = typesSync.buildActions(now, before);
    });
    test('should return `setDescription` update-action', () => {
      expect(updateActions).toEqual([
        {
          action: 'setDescription',
          description: 'huxley-description',
        },
      ]);
    });
  });
});
