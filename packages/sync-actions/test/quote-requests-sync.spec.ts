import createQuoteRequestsSync, {
  actionGroups,
} from '../src/quotes-requests/quote-requests';
import { baseActionsList } from '../src/quotes-requests/quote-requests-actions';
import { Quote, QuoteUpdateAction, SyncAction } from '../src/utils/types';

describe('Exports', () => {
  test('action group list', () => {
    expect(actionGroups).toEqual(['base', 'custom']);
  });

  describe('action list', () => {
    test('should contain `changeQuoteRequestState` action', () => {
      expect(baseActionsList).toEqual(
        expect.arrayContaining([
          { action: 'changeQuoteRequestState', key: 'quoteRequestState' },
        ])
      );
    });

    test('should contain `transitionState` action', () => {
      expect(baseActionsList).toEqual(
        expect.arrayContaining([{ action: 'transitionState', key: 'state' }])
      );
    });
  });
});

describe('Actions', () => {
  let quoteRequestsSync: SyncAction<Quote, QuoteUpdateAction>;
  beforeEach(() => {
    quoteRequestsSync = createQuoteRequestsSync([], {});
  });

  test('should build `changeQuoteRequestState` action', () => {
    const before = { quoteRequestState: 'Submitted' } as Partial<Quote>;
    const now = { quoteRequestState: 'Accepted' } as Partial<Quote>;
    const actual = quoteRequestsSync.buildActions(now, before);
    const expected = [
      {
        action: 'changeQuoteRequestState',
        ...now,
      },
    ];
    expect(actual).toEqual(expected);
  });

  test('should build `transitionState` action', () => {
    const before = {
      state: {
        typeId: 'state',
        id: 'sid1',
      },
    } as Partial<Quote>;

    const now = {
      state: {
        typeId: 'state',
        id: 'sid2',
      },
    } as Partial<Quote>;

    const actual = quoteRequestsSync.buildActions(now, before);
    const expected = [
      {
        action: 'transitionState',
        ...now,
      },
    ];
    expect(actual).toEqual(expected);
  });

  test('should build `setCustomType` action', () => {
    const before = {
      custom: {
        type: {
          typeId: 'type',
          id: 'customType1',
        },
        fields: {
          customField1: true,
        },
      },
    } as Partial<Quote>;

    const now = {
      custom: {
        type: {
          typeId: 'type',
          id: 'customType2',
        },
        fields: {
          customField1: true,
        },
      },
    } as Partial<Quote>;

    const actual = quoteRequestsSync.buildActions(now, before);
    const expected = [{ action: 'setCustomType', ...now.custom }];
    expect(actual).toEqual(expected);
  });

  test('should build `setCustomField` action', () => {
    const before = {
      custom: {
        type: {
          typeId: 'type',
          id: 'customType1',
        },
        fields: {
          customField1: false,
        },
      },
    } as Partial<Quote>;

    const now = {
      custom: {
        type: {
          typeId: 'type',
          id: 'customType1',
        },
        fields: {
          customField1: true,
        },
      },
    } as Partial<Quote>;

    const actual = quoteRequestsSync.buildActions(now, before);
    const expected = [
      {
        action: 'setCustomField',
        name: 'customField1',
        value: true,
      },
    ];
    expect(actual).toEqual(expected);
  });
});
