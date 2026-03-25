import createStandaloneVariantsSync, {
  actionGroups,
  StandaloneVariant,
  StandaloneVariantUpdateAction,
} from '../src/standalone-variants/standalone-variants';
import {
  convertAttributeToUpdateActionShape,
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
        variants: [{ id: 1, key: 'old-key', sku: 'sku-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'new-key', sku: 'sku-1', attributes: [] }],
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
        variants: [{ id: 1, sku: 'sku-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'new-key', sku: 'sku-1', attributes: [] }],
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
        variants: [{ id: 1, key: 'old-key', sku: 'sku-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, sku: 'sku-1', attributes: [] }],
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
        variants: [{ id: 1, key: 'same-key', sku: 'sku-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'same-key', sku: 'sku-1', attributes: [] }],
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
        variants: [{ id: 1, key: 'key-1', sku: 'old-sku', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'new-sku', attributes: [] }],
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
        variants: [{ id: 1, key: 'key-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'new-sku', attributes: [] }],
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
        variants: [{ id: 1, key: 'key-1', sku: 'old-sku', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', attributes: [] }],
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
        variants: [{ id: 1, key: 'key-1', sku: 'same-sku', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'same-sku', attributes: [] }],
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
        variants: [{ id: 1, key: 'key-1', sku: 'sku-1', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAttributes',
            attributes: [{ name: 'color', value: JSON.stringify('red') }],
            staged: true,
          },
        ])
      );
    });

    test('should build `setAttributes` action when attribute value changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'blue' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAttributes',
            attributes: [{ name: 'color', value: JSON.stringify('blue') }],
            staged: true,
          },
        ])
      );
    });

    test('should build `setAttribute` action with null value when attribute is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'sku-1', attributes: [] }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAttribute',
            name: 'color',
            value: null,
            staged: true,
          },
        ])
      );
    });

    test('should not build attribute actions when attributes are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'setAttributes' }),
        ])
      );
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'setAttribute' }),
        ])
      );
    });

    test('should handle multiple attribute changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'color', value: 'red' },
              { name: 'size', value: 'M' },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'color', value: 'blue' },
              { name: 'size', value: 'L' },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      const setAttributesAction = actual.find(
        (action) => action.action === 'setAttributes'
      );
      expect(setAttributesAction).toBeDefined();
      expect(setAttributesAction?.attributes).toHaveLength(2);
    });

    test('should only include changed attribute when one attribute changes and another stays the same', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'color', value: 'red' },
              { name: 'size', value: 'M' },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'color', value: 'blue' },
              { name: 'size', value: 'M' }, // unchanged
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      const setAttributesAction = actual.find(
        (action) => action.action === 'setAttributes'
      );
      expect(setAttributesAction).toBeDefined();
      // Should only include the changed attribute, not the unchanged one
      expect(setAttributesAction?.attributes).toHaveLength(1);
      expect(setAttributesAction?.attributes).toEqual([
        { name: 'color', value: JSON.stringify('blue') },
      ]);
    });

    test('should add new attribute while preserving existing unchanged attributes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'color', value: 'red' }, // unchanged
              { name: 'size', value: 'M' }, // new attribute
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      const setAttributesAction = actual.find(
        (action) => action.action === 'setAttributes'
      );
      expect(setAttributesAction).toBeDefined();
      // Should only include the new attribute, not the unchanged one
      expect(setAttributesAction?.attributes).toHaveLength(1);
      expect(setAttributesAction?.attributes).toEqual([
        { name: 'size', value: JSON.stringify('M') },
      ]);
    });

    test('should handle complex attribute values (objects)', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'dimensions', value: { width: 10, height: 20 } },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [
              { name: 'dimensions', value: { width: 15, height: 25 } },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
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
        ])
      );
    });

    test('should handle complex attribute values (arrays)', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'tags', value: ['tag1', 'tag2'] }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'tags', value: ['tag1', 'tag3'] }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
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
        ])
      );
    });
  });

  describe('image actions', () => {
    test('should build `addExternalImage` action when image is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'addExternalImage',
            image: { url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } },
            staged: true,
          },
        ])
      );
    });

    test('should build `removeImage` action when image is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'removeImage',
            imageUrl: 'https://example.com/image.jpg',
            staged: true,
          },
        ])
      );
    });

    test('should build `setImageLabel` action when image label changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', label: 'old-label', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', label: 'new-label', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setImageLabel',
            imageUrl: 'https://example.com/image.jpg',
            label: 'new-label',
            staged: true,
          },
        ])
      );
    });

    test('should build `moveImageToPosition` action when image position changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [
              { url: 'https://example.com/image1.jpg', dimensions: { w: 100, h: 100 } },
              { url: 'https://example.com/image2.jpg', dimensions: { w: 100, h: 100 } },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [
              { url: 'https://example.com/image2.jpg', dimensions: { w: 100, h: 100 } },
              { url: 'https://example.com/image1.jpg', dimensions: { w: 100, h: 100 } },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'moveImageToPosition',
            staged: true,
          }),
        ])
      );
    });

    test('should not build image actions when images are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'addExternalImage' }),
        ])
      );
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'removeImage' }),
        ])
      );
    });

    test('should allow filtering to only image actions', () => {
      const sync = createStandaloneVariantsSync([
        { type: 'base', group: 'ignore' },
        { type: 'attributes', group: 'ignore' },
        { type: 'images', group: 'allow' },
      ]);

      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
            images: [],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
          },
        ],
      };

      const actual = sync.buildActions(now, before);

      // Should only have image action, not key/sku/attribute actions
      expect(actual).toHaveLength(1);
      expect(actual[0].action).toBe('addExternalImage');
    });
  });

  describe('asset actions', () => {
    test('should build `addAsset` action when asset is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'addAsset',
            asset: {
              id: 'asset-1',
              key: 'asset-key-1',
              name: { en: 'Asset 1' },
              sources: [{ uri: 'https://example.com/asset1.pdf' }],
            },
            position: 0,
            staged: true,
          },
        ])
      );
    });

    test('should build `removeAsset` action when asset is removed', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'removeAsset',
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `removeAsset` action using assetKey when asset has no id', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: undefined,
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'removeAsset',
            assetKey: 'asset-key-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `changeAssetOrder` action when asset order changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'changeAssetOrder',
            staged: true,
          }),
        ])
      );
    });

    test('should not build asset actions when assets are unchanged', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'addAsset' }),
        ])
      );
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'removeAsset' }),
        ])
      );
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
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
            images: [],
            assets: [],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
            images: [{ url: 'https://example.com/image.jpg', dimensions: { w: 100, h: 100 } }],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = sync.buildActions(now, before);

      // Should only have asset action, not key/sku/attribute/image actions
      expect(actual).toHaveLength(1);
      expect(actual[0].action).toBe('addAsset');
    });

    test('should build `setAssetKey` action when asset key changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'old-asset-key',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'new-asset-key',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAssetKey',
            assetKey: 'new-asset-key',
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `changeAssetName` action when asset name changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Old Asset Name' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'New Asset Name' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'changeAssetName',
            name: { en: 'New Asset Name' },
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `setAssetDescription` action when asset description changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                description: { en: 'Old description' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                description: { en: 'New description' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAssetDescription',
            description: { en: 'New description' },
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `setAssetTags` action when asset tags change', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                tags: ['tag1', 'tag2'],
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                tags: ['tag1', 'tag3'],
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAssetTags',
            tags: ['tag1', 'tag3'],
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build `setAssetSources` action when asset sources change', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/old-asset.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/new-asset.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAssetSources',
            sources: [{ uri: 'https://example.com/new-asset.pdf' }],
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build multiple asset property actions when multiple properties change', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'old-asset-key',
                name: { en: 'Old Asset Name' },
                description: { en: 'Old description' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'new-asset-key',
                name: { en: 'New Asset Name' },
                description: { en: 'New description' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'setAssetKey' }),
          expect.objectContaining({ action: 'changeAssetName' }),
          expect.objectContaining({ action: 'setAssetDescription' }),
        ])
      );
      expect(actual).toHaveLength(3);
    });

    test('should build `setAssetCustomType` action when asset custom type is added', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
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
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'custom-type-1' },
                  fields: { customField1: 'value1' },
                },
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'setAssetCustomType',
            assetId: 'asset-1',
            staged: true,
          }),
        ])
      );
    });

    test('should build `setAssetCustomType` action when asset custom type changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'old-custom-type' },
                  fields: { customField1: 'value1' },
                },
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'new-custom-type' },
                  fields: { customField1: 'value1' },
                },
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'setAssetCustomType',
            type: { typeId: 'type', id: 'new-custom-type' },
            assetId: 'asset-1',
            staged: true,
          }),
        ])
      );
    });

    test('should build `setAssetCustomField` action when asset custom field changes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'custom-type-1' },
                  fields: { customField1: 'oldValue' },
                },
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'custom-type-1' },
                  fields: { customField1: 'newValue' },
                },
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          {
            action: 'setAssetCustomField',
            name: 'customField1',
            value: 'newValue',
            assetId: 'asset-1',
            staged: true,
          },
        ])
      );
    });

    test('should build multiple `setAssetCustomField` actions when multiple custom fields change', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'custom-type-1' },
                  fields: { field1: 'value1', field2: 'value2' },
                },
              },
            ],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [],
            assets: [
              {
                id: 'asset-1',
                key: 'asset-key-1',
                name: { en: 'Asset 1' },
                sources: [{ uri: 'https://example.com/asset1.pdf' }],
                custom: {
                  type: { typeId: 'type', id: 'custom-type-1' },
                  fields: { field1: 'newValue1', field2: 'newValue2' },
                },
              },
            ],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'setAssetCustomField',
            name: 'field1',
            value: 'newValue1',
            assetId: 'asset-1',
          }),
          expect.objectContaining({
            action: 'setAssetCustomField',
            name: 'field2',
            value: 'newValue2',
            assetId: 'asset-1',
          }),
        ])
      );
      expect(actual.filter((a) => a.action === 'setAssetCustomField')).toHaveLength(2);
    });
  });

  describe('combined actions', () => {
    test('should build multiple actions when multiple fields change', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
          },
        ],
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
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'key-1',
            sku: 'sku-1',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should return empty array when variants is undefined', () => {
      const before: StandaloneVariant = {
        id: '123',
      };
      const now: StandaloneVariant = {
        id: '123',
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });

    test('should return empty array when variants is empty', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([]);
    });

    test('should handle variant with no attributes', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'old-sku' }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'new-sku' }],
      };

      const actual = standaloneVariantSync.buildActions(now, before);

      expect(actual).toEqual([{ action: 'setSku', sku: 'new-sku', staged: true }]);
    });

    test('should not mutate original objects', () => {
      const before: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
          },
        ],
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
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
          },
        ],
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
        variants: [
          {
            id: 1,
            key: 'old-key',
            sku: 'old-sku',
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [
          {
            id: 1,
            key: 'new-key',
            sku: 'new-sku',
            attributes: [{ name: 'color', value: 'blue' }],
          },
        ],
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
        variants: [{ id: 1, key: 'key-1', sku: 'old-sku', attributes: [] }],
      };
      const now: StandaloneVariant = {
        id: '123',
        variants: [{ id: 1, key: 'key-1', sku: 'new-sku', attributes: [] }],
      };

      const actual = sync.buildActions(now, before);

      // When staged is false, actions should not have staged: true
      const skuAction = actual.find((a) => a.action === 'setSku');
      expect(skuAction?.staged).toBeUndefined();
    });
  });
});
