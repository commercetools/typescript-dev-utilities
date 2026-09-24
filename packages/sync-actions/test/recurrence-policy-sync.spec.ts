import recurrencePolicySyncFn, {
  actionGroups,
} from '../src/recurrence-policy/recurrence-policy';
import { baseActionsList } from '../src/recurrence-policy/recurrence-policy-actions';
import {
  RecurrencePolicy,
  RecurrencePolicyUpdateAction,
  SyncAction,
} from '../src';

describe('Recurrence Policy Exports', () => {
  test('action group list', () => {
    expect(actionGroups).toEqual(['base']);
  });

  describe('action list', () => {
    test('should contain `setName` action', () => {
      expect(baseActionsList).toEqual(
        expect.arrayContaining([{ action: 'setName', key: 'name' }])
      );
    });

    test('should contain `setDescription` action', () => {
      expect(baseActionsList).toEqual(
        expect.arrayContaining([
          { action: 'setDescription', key: 'description' },
        ])
      );
    });

    test('should contain `setKey` action', () => {
      expect(baseActionsList).toEqual(
        expect.arrayContaining([
          {
            action: 'setKey',
            key: 'key',
          },
        ])
      );
    });
  });
});

describe('Recurrence Policy Actions', () => {
  let recurrencePolicy: SyncAction<
    RecurrencePolicy,
    RecurrencePolicyUpdateAction
  >;
  beforeEach(() => {
    recurrencePolicy = recurrencePolicySyncFn([]);
  });

  test('should build the `setName` action', () => {
    const before: Partial<RecurrencePolicy> = {
      name: { en: 'en-name-before', de: 'de-name-before' },
    };

    const now: Partial<RecurrencePolicy> = {
      name: { en: 'en-name-now', de: 'de-name-now' },
    };

    const expected = [
      {
        action: 'setName',
        name: { en: 'en-name-now', de: 'de-name-now' },
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });

  test('should build the `setDescription` action', () => {
    const before: Partial<RecurrencePolicy> = {
      description: { en: 'en-description-before', de: 'de-description-before' },
    };

    const now: Partial<RecurrencePolicy> = {
      description: { en: 'en-description-now', de: 'de-description-now' },
    };

    const expected = [
      {
        action: 'setDescription',
        description: { en: 'en-description-now', de: 'de-description-now' },
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });

  test('should build the `setKey` action', () => {
    const before: Partial<RecurrencePolicy> = {
      key: 'foo-key',
    };

    const now: Partial<RecurrencePolicy> = {
      key: 'bar-key',
    };

    const expected = [
      {
        action: 'setKey',
        key: 'bar-key',
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });

  test('should build the `setSchedule` action for schedule standard', () => {
    const before: Partial<RecurrencePolicy> = {
      schedule: { type: 'standard', intervalUnit: 'Days', value: 1 },
    };

    const now: Partial<RecurrencePolicy> = {
      schedule: { type: 'standard', intervalUnit: 'Days', value: 2 },
    };

    const expected = [
      {
        action: 'setSchedule',
        schedule: { type: 'standard', intervalUnit: 'Days', value: 2 },
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });

  test('should build the `setSchedule` action for schedule dayOfMonth', () => {
    const before: Partial<RecurrencePolicy> = {
      schedule: { type: 'dayOfMonth', day: 1 },
    };

    const now: Partial<RecurrencePolicy> = {
      schedule: { type: 'dayOfMonth', day: 2 },
    };

    const expected = [
      {
        action: 'setSchedule',
        schedule: { type: 'dayOfMonth', day: 2 },
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });

  test('should build the `setSchedule` action for schedule change', () => {
    const before: Partial<RecurrencePolicy> = {
      schedule: { type: 'standard', intervalUnit: 'Days', value: 1 },
    };

    const now: Partial<RecurrencePolicy> = {
      schedule: { type: 'dayOfMonth', day: 2 },
    };

    const expected = [
      {
        action: 'setSchedule',
        schedule: { type: 'dayOfMonth', day: 2 },
      },
    ];
    const actual = recurrencePolicy.buildActions(now, before);
    expect(actual).toEqual(expected);
  });
});
