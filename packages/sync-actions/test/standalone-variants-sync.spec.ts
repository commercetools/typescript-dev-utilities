import createStandaloneVariantsSync, {
  actionGroups,
  StandaloneVariantUpdateAction,
} from '../src/standalone-variants/standalone-variants';
import {
  convertAttributeToUpdateActionShape,
  buildPublishAction,
  buildUnpublishAction,
  buildRemoveStagedChangesAction,
  StandaloneVariant,
} from '../src/standalone-variants/standalone-variant-actions';
import { SyncAction } from '../src/utils/types';

describe('Exports', () => {
  test('action group list', () => {
    expect(actionGroups).toEqual(['base', 'attributes', 'images', 'assets']);
  });
});

describe('convertAttributeToUpdateActionShape', () => {
  test('should convert attribute with string value', () => {
    const attribute = { name: 'color', value: 'red' };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'color',
      value: JSON.stringify('red'),
    });
  });

  test('should convert attribute with object value', () => {
    const attribute = { name: 'dimensions', value: { width: 10, height: 20 } };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'dimensions',
      value: JSON.stringify({ width: 10, height: 20 }),
    });
  });

  test('should convert attribute with array value', () => {
    const attribute = { name: 'tags', value: ['tag1', 'tag2'] };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'tags',
      value: JSON.stringify(['tag1', 'tag2']),
    });
  });

  test('should handle attribute with undefined value', () => {
    const attribute = { name: 'optional', value: undefined };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'optional',
    });
  });

  test('should convert attribute with boolean value', () => {
    const attribute = { name: 'isActive', value: true };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'isActive',
      value: JSON.stringify(true),
    });
  });

  test('should convert attribute with number value', () => {
    const attribute = { name: 'quantity', value: 42 };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'quantity',
      value: JSON.stringify(42),
    });
  });

  test('should convert attribute with null value', () => {
    const attribute = { name: 'nullable', value: null };
    const result = convertAttributeToUpdateActionShape(attribute);
    expect(result).toEqual({
      name: 'nullable',
      value: JSON.stringify(null),
    });
  });
});

describe('Actions', () => {
  let standaloneVariantSync: SyncAction<
    StandaloneVariant,
    StandaloneVariantUpdateAction
  >;

  beforeEach(() => {
    standaloneVariantSync = createStandaloneVariantsSync();
  });

  describe('setKey action', () => {
    test('should build `setKey` action when key changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'sku-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'sku-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setKey',
            key: 'new-key',
          },
        ])
      );
    });

    test('should build `setKey` action when key is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        sku: 'sku-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'sku-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setKey',
            key: 'new-key',
          },
        ])
      );
    });

    test('should build `setKey` action when key is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'sku-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        sku: 'sku-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setKey',
            key: undefined,
          },
        ])
      );
    });

    test('should not build `setKey` action when key is unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'same-key',
        sku: 'sku-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'same-key',
        sku: 'sku-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ action: 'setKey' })])
      );
    });
  });

  describe('setSku action', () => {
    test('should build `setSku` action when sku changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'old-sku',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'new-sku',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setSku',
            sku: 'new-sku',
            staged: true,
          },
        ])
      );
    });

    test('should build `setSku` action when sku is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'new-sku',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setSku',
            sku: 'new-sku',
            staged: true,
          },
        ])
      );
    });

    test('should build `setSku` action when sku is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'old-sku',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setSku',
            sku: undefined,
            staged: true,
          },
        ])
      );
    });

    test('should not build `setSku` action when sku is unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'same-sku',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'same-sku',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ action: 'setSku' })])
      );
    });
  });

  describe('setAttributes action', () => {
    test('should build `setAttributes` action when attribute is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [{ name: 'color', value: JSON.stringify('red') }],
          staged: true,
        },
      ]);
    });

    test('should build `setAttributes` action when attribute value changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'blue' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [{ name: 'color', value: JSON.stringify('blue') }],
          staged: true,
        },
      ]);
    });

    test('should build `setAttributes` action with empty array when all attributes are removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [],
          staged: true,
        },
      ]);
    });

    test('should not build attribute actions when attributes are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });

    test('should handle multiple attribute changes with full replacement', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [
          { name: 'color', value: 'red' },
          { name: 'size', value: 'M' },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [
          { name: 'color', value: 'blue' },
          { name: 'size', value: 'L' },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [
            { name: 'color', value: JSON.stringify('blue') },
            { name: 'size', value: JSON.stringify('L') },
          ],
          staged: true,
        },
      ]);
    });

    test('should include all new attributes in setAttributes action', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [
          { name: 'color', value: 'red' },
          { name: 'size', value: 'M' },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [
            { name: 'color', value: JSON.stringify('red') },
            { name: 'size', value: JSON.stringify('M') },
          ],
          staged: true,
        },
      ]);
    });

    test('should handle complex attribute values (objects)', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'dimensions', value: { width: 10, height: 20 } }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'dimensions', value: { width: 15, height: 25 } }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [
            {
              name: 'dimensions',
              value: JSON.stringify({ width: 15, height: 25 }),
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should handle complex attribute values (arrays)', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'tags', value: ['tag1', 'tag2'] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'tags', value: ['tag1', 'tag3'] }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [
            {
              name: 'tags',
              value: JSON.stringify(['tag1', 'tag3']),
            },
          ],
          staged: true,
        },
      ]);
    });
  });

  describe('setImages action', () => {
    test('should build `setImages` action when image is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setImages',
          images: [
            {
              url: 'https://example.com/image.jpg',
              dimensions: { w: 100, h: 100 },
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should build `setImages` action with empty array when image is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setImages',
          images: [],
          staged: true,
        },
      ]);
    });

    test('should build `setImages` action when image label changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            label: 'old-label',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            label: 'new-label',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setImages',
          images: [
            {
              url: 'https://example.com/image.jpg',
              label: 'new-label',
              dimensions: { w: 100, h: 100 },
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should build `setImages` action when image position changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image1.jpg',
            dimensions: { w: 100, h: 100 },
          },
          {
            url: 'https://example.com/image2.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image2.jpg',
            dimensions: { w: 100, h: 100 },
          },
          {
            url: 'https://example.com/image1.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setImages',
          images: [
            {
              url: 'https://example.com/image2.jpg',
              dimensions: { w: 100, h: 100 },
            },
            {
              url: 'https://example.com/image1.jpg',
              dimensions: { w: 100, h: 100 },
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should not build image actions when images are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });

    test('should allow filtering to only image actions', () => {
      const sync = createStandaloneVariantsSync([
        { type: 'base', group: 'ignore' },
        { type: 'attributes', group: 'ignore' },
        { type: 'images', group: 'allow' },
      ]);

      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
        images: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
      };

      const actual = sync.buildActions(now, before);

      // Should only have setImages action, not key/sku/attribute actions
      expect(actual).toHaveLength(1);
      expect(actual[0].action).toBe('setImages');
    });
  });

  describe('setAssets action', () => {
    test('should build `setAssets` action when asset is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAssets',
          assets: [
            {
              id: 'asset-1',
              key: 'asset-key-1',
              name: { en: 'Asset 1' },
              sources: [{ uri: 'https://example.com/asset1.pdf' }],
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should build `setAssets` action with empty array when asset is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAssets',
          assets: [],
          staged: true,
        },
      ]);
    });

    test('should build `setAssets` action when asset order changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
          {
            id: 'asset-2',
            key: 'asset-key-2',
            name: { en: 'Asset 2' },
            sources: [{ uri: 'https://example.com/asset2.pdf' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-2',
            key: 'asset-key-2',
            name: { en: 'Asset 2' },
            sources: [{ uri: 'https://example.com/asset2.pdf' }],
          },
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAssets',
          assets: [
            {
              id: 'asset-2',
              key: 'asset-key-2',
              name: { en: 'Asset 2' },
              sources: [{ uri: 'https://example.com/asset2.pdf' }],
            },
            {
              id: 'asset-1',
              key: 'asset-key-1',
              name: { en: 'Asset 1' },
              sources: [{ uri: 'https://example.com/asset1.pdf' }],
            },
          ],
          staged: true,
        },
      ]);
    });

    test('should not build asset actions when assets are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });

    test('should allow filtering to only asset actions', () => {
      const sync = createStandaloneVariantsSync([
        { type: 'base', group: 'ignore' },
        { type: 'attributes', group: 'ignore' },
        { type: 'images', group: 'ignore' },
        { type: 'assets', group: 'allow' },
      ]);

      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
        images: [],
        assets: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
        images: [
          {
            url: 'https://example.com/image.jpg',
            dimensions: { w: 100, h: 100 },
          },
        ],
        assets: [
          {
            id: 'asset-1',
            key: 'asset-key-1',
            name: { en: 'Asset 1' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };

      const actual = sync.buildActions(now, before);

      // Should only have setAssets action, not key/sku/attribute/image actions
      expect(actual).toHaveLength(1);
      expect(actual[0].action).toBe('setAssets');
    });

    test('should build `setAssets` action when asset properties change', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'old-asset-key',
            name: { en: 'Old Asset Name' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [],
        assets: [
          {
            id: 'asset-1',
            key: 'new-asset-key',
            name: { en: 'New Asset Name' },
            sources: [{ uri: 'https://example.com/asset1.pdf' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAssets',
          assets: [
            {
              id: 'asset-1',
              key: 'new-asset-key',
              name: { en: 'New Asset Name' },
              sources: [{ uri: 'https://example.com/asset1.pdf' }],
            },
          ],
          staged: true,
        },
      ]);
    });
  });

  describe('combined actions', () => {
    test('should build multiple actions when multiple fields change', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          { action: 'setKey', key: 'new-key' },
          { action: 'setSku', sku: 'new-sku', staged: true },
          {
            action: 'setAttributes',
            attributes: [{ name: 'color', value: JSON.stringify('blue') }],
            staged: true,
          },
        ])
      );
    });

    test('should return empty array when nothing changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'sku-1',
        attributes: [{ name: 'color', value: 'red' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should handle variant with no attributes', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'old-sku',
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'new-sku',
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([
        { action: 'setSku', sku: 'new-sku', staged: true },
      ]);
    });

    test('should not mutate original objects', () => {
      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
      };

      const beforeCopy = JSON.parse(JSON.stringify(before));
      const nowCopy = JSON.parse(JSON.stringify(now));

      standaloneVariantSync.buildActions(now, before);

      expect(before).toEqual(beforeCopy);
      expect(now).toEqual(nowCopy);
    });
  });

  describe('action groups', () => {
    test('should allow filtering to only base actions', () => {
      const sync = createStandaloneVariantsSync([
        { type: 'base', group: 'allow' },
        { type: 'attributes', group: 'ignore' },
      ]);

      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
      };

      const actual = sync.buildActions(now, before);

      expect(actual).toEqual([
        { action: 'setKey', key: 'new-key' },
        { action: 'setSku', sku: 'new-sku', staged: true },
      ]);
    });

    test('should allow filtering to only attribute actions', () => {
      const sync = createStandaloneVariantsSync([
        { type: 'base', group: 'ignore' },
        { type: 'attributes', group: 'allow' },
      ]);

      const before: StandaloneVariant = {
        id: '123',
        key: 'old-key',
        sku: 'old-sku',
        attributes: [{ name: 'color', value: 'red' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'new-key',
        sku: 'new-sku',
        attributes: [{ name: 'color', value: 'blue' }],
      };

      const actual = sync.buildActions(now, before);

      expect(actual).toEqual([
        {
          action: 'setAttributes',
          attributes: [{ name: 'color', value: JSON.stringify('blue') }],
          staged: true,
        },
      ]);
    });
  });

  describe('configuration options', () => {
    test('should respect staged: false in config', () => {
      const sync = createStandaloneVariantsSync([], { staged: false });

      const before: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'old-sku',
        attributes: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        key: 'key-1',
        sku: 'new-sku',
        attributes: [],
      };

      const actual = sync.buildActions(now, before);

      // When staged is false, actions should not have staged: true
      const skuAction = actual.find((a) => a.action === 'setSku');
      expect(skuAction?.staged).toBeUndefined();
    });
  });
});

describe('Lifecycle actions', () => {
  describe('buildPublishAction', () => {
    test('should build publish action', () => {
      const action = buildPublishAction();
      expect(action).toEqual({ action: 'publish' });
    });
  });

  describe('buildUnpublishAction', () => {
    test('should build unpublish action', () => {
      const action = buildUnpublishAction();
      expect(action).toEqual({ action: 'unpublish' });
    });
  });

  describe('buildRemoveStagedChangesAction', () => {
    test('should build removeStagedChanges action', () => {
      const action = buildRemoveStagedChangesAction();
      expect(action).toEqual({ action: 'removeStagedChanges' });
    });
  });
});
