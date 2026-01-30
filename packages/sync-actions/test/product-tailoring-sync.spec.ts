import clone from '../src/utils/clone';
import productTailoringSyncFn, {
  actionGroups,
} from '../src/product-tailoring/product-tailoring';
import {
  baseActionsList,
  metaActionsList,
} from '../src/product-tailoring/product-tailoring-actions';
import {
  ProductTailoring,
  ProductTailoringData,
  ProductTailoringUpdateAction,
  SyncAction,
} from '../src/utils/types';

describe('Exports', () => {
  test('action group list', () => {
    expect(actionGroups).toEqual([
      'base',
      'meta',
      'images',
      'assets',
      'attributes',
      'variants',
    ]);
  });

  test('correctly define base actions list', () => {
    expect(baseActionsList).toEqual([
      { action: 'setName', key: 'name' },
      { action: 'setSlug', key: 'slug' },
      { action: 'setDescription', key: 'description' },
    ]);
  });

  test('correctly define meta actions list', () => {
    expect(metaActionsList).toEqual([
      { action: 'setMetaTitle', key: 'metaTitle' },
      { action: 'setMetaDescription', key: 'metaDescription' },
      { action: 'setMetaKeywords', key: 'metaKeywords' },
    ]);
  });
});

describe('Actions', () => {
  let productTailoringSync: SyncAction<
    ProductTailoring | ProductTailoringData,
    ProductTailoringUpdateAction
  >;

  beforeEach(() => {
    productTailoringSync = productTailoringSyncFn([]);
  });

  test('should ensure given objects are not mutated', () => {
    const before = {
      name: { en: 'Original Name' },
      description: { en: 'Original Description' },
      variants: [
        { id: 1, images: [], assets: [] },
        { id: 2, images: [], assets: [] },
      ],
    };
    const now = {
      name: { en: 'Tailored Name' },
      description: { en: 'Tailored Description' },
      variants: [
        { id: 1, images: [], assets: [] },
        { id: 2, images: [], assets: [] },
      ],
    };
    productTailoringSync.buildActions(now, before);
    expect(before).toEqual(clone(before));
    expect(now).toEqual(clone(now));
  });

  describe('base actions', () => {
    test('should build `setName` action', () => {
      const before = { name: { en: 'Original Name' } };
      const now = { name: { en: 'Tailored Name', de: 'Angepasster Name' } };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });

    test('should build `setDescription` action', () => {
      const before = { description: { en: 'Original description' } };
      const now = {
        description: {
          en: 'Tailored description',
          de: 'Angepasste Beschreibung',
        },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setDescription', description: now.description },
      ]);
    });

    test('should build `setSlug` action', () => {
      const before = { slug: { en: 'original-slug' } };
      const now = { slug: { en: 'tailored-slug', de: 'angepasster-slug' } };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setSlug', slug: now.slug }]);
    });

    test('should not build action when name is omitted without config', () => {
      const before = { name: { en: 'Tailored Name' } };
      const now = {};

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([]);
    });

    test('should build `setName` action to remove name with shouldUnsetOmittedProperties', () => {
      const before = { name: { en: 'Tailored Name' } };
      const now = {};

      const actions = productTailoringSync.buildActions(now, before, {
        shouldUnsetOmittedProperties: true,
      });
      expect(actions).toEqual([{ action: 'setName', name: undefined }]);
    });

    test('should build `setDescription` action to remove description with shouldUnsetOmittedProperties', () => {
      const before = { description: { en: 'Tailored description' } };
      const now = {};

      const actions = productTailoringSync.buildActions(now, before, {
        shouldUnsetOmittedProperties: true,
      });
      expect(actions).toEqual([
        { action: 'setDescription', description: undefined },
      ]);
    });

    test('should build `setSlug` action to remove slug with shouldUnsetOmittedProperties', () => {
      const before = { slug: { en: 'tailored-slug' } };
      const now = {};

      const actions = productTailoringSync.buildActions(now, before, {
        shouldUnsetOmittedProperties: true,
      });
      expect(actions).toEqual([{ action: 'setSlug', slug: undefined }]);
    });
  });

  describe('meta actions', () => {
    test('should build `setMetaTitle` action', () => {
      const before = { metaTitle: { en: 'Original Meta Title' } };
      const now = {
        metaTitle: { en: 'Tailored Meta Title', de: 'Angepasster Meta-Titel' },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setMetaTitle', metaTitle: now.metaTitle },
      ]);
    });

    test('should build `setMetaDescription` action', () => {
      const before = { metaDescription: { en: 'Original meta description' } };
      const now = {
        metaDescription: {
          en: 'Tailored meta description',
          de: 'Angepasste Meta-Beschreibung',
        },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setMetaDescription', metaDescription: now.metaDescription },
      ]);
    });

    test('should build `setMetaKeywords` action', () => {
      const before = { metaKeywords: { en: 'original, keywords' } };
      const now = {
        metaKeywords: {
          en: 'tailored, keywords, seo',
          de: 'angepasst, schlüsselwörter',
        },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setMetaKeywords', metaKeywords: now.metaKeywords },
      ]);
    });

    test('should build `setMetaTitle` action to remove metaTitle with shouldUnsetOmittedProperties', () => {
      productTailoringSync = productTailoringSyncFn([], {
        shouldUnsetOmittedProperties: true,
      });
      const before = { metaTitle: { en: 'Tailored Meta Title' } };
      const now = {};

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setMetaTitle', metaTitle: undefined },
      ]);
    });
  });

  describe('staged flag', () => {
    test('should add staged: false when publish is true', () => {
      const before = { name: { en: 'Original' } };
      const now = { name: { en: 'Updated' }, publish: true };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setName', name: now.name, staged: false },
      ]);
    });

    test('should add staged: false when staged is false', () => {
      const before = { name: { en: 'Original' } };
      const now = { name: { en: 'Updated' }, staged: false };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setName', name: now.name, staged: false },
      ]);
    });

    test('should not add staged when neither publish nor staged flag is set', () => {
      const before = { name: { en: 'Original' } };
      const now = { name: { en: 'Updated' } };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });

    test('should not add staged when staged is true', () => {
      const before = { name: { en: 'Original' } };
      const now = { name: { en: 'Updated' }, staged: true };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });

    test('should not add staged when publish is false', () => {
      const before = { name: { en: 'Original' } };
      const now = { name: { en: 'Updated' }, publish: false };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });
  });

  describe('variant actions', () => {
    test('should build `addVariant` action', () => {
      const before = {
        variants: [{ id: 1, images: [], assets: [] }],
      };
      const now = {
        variants: [
          { id: 1, images: [], assets: [] },
          {
            id: 2,
            images: [{ url: '//newimage.jpg', dimensions: { w: 100, h: 100 } }],
            assets: [],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'addVariant',
          id: 2,
          images: [{ url: '//newimage.jpg', dimensions: { w: 100, h: 100 } }],
          assets: [],
        },
      ]);
    });

    test('should build `removeVariant` action', () => {
      const before = {
        variants: [
          { id: 1, images: [], assets: [] },
          { id: 2, images: [], assets: [] },
        ],
      };
      const now = {
        variants: [{ id: 1, images: [], assets: [] }],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'removeVariant', id: 2 }]);
    });
  });

  describe('image actions', () => {
    test('should build `addExternalImage` action', () => {
      const before = {
        variants: [{ id: 1, images: [], assets: [] }],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [{ url: '//newimage.jpg', dimensions: { w: 400, h: 300 } }],
            assets: [],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'addExternalImage',
          variantId: 1,
          image: { url: '//newimage.jpg', dimensions: { w: 400, h: 300 } },
        },
      ]);
    });

    test('should build `removeImage` action', () => {
      const before = {
        variants: [
          {
            id: 1,
            images: [{ url: '//oldimage.jpg', dimensions: { w: 400, h: 300 } }],
            assets: [],
          },
        ],
      };
      const now = {
        variants: [{ id: 1, images: [], assets: [] }],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'removeImage',
          variantId: 1,
          imageUrl: '//oldimage.jpg',
        },
      ]);
    });

    test('should build `setImageLabel` action', () => {
      const before = {
        variants: [
          {
            id: 1,
            images: [
              {
                url: '//image.jpg',
                dimensions: { w: 400, h: 300 },
                label: 'old label',
              },
            ],
            assets: [],
          },
        ],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [
              {
                url: '//image.jpg',
                dimensions: { w: 400, h: 300 },
                label: 'new label',
              },
            ],
            assets: [],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'setImageLabel',
          variantId: 1,
          imageUrl: '//image.jpg',
          label: 'new label',
        },
      ]);
    });

    test('should build `moveImageToPosition` action', () => {
      const before = {
        variants: [
          {
            id: 1,
            images: [
              { url: '//image1.jpg', dimensions: { w: 400, h: 300 } },
              { url: '//image2.jpg', dimensions: { w: 400, h: 300 } },
            ],
            assets: [],
          },
        ],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [
              { url: '//image2.jpg', dimensions: { w: 400, h: 300 } },
              { url: '//image1.jpg', dimensions: { w: 400, h: 300 } },
            ],
            assets: [],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toContainEqual({
        action: 'moveImageToPosition',
        variantId: 1,
        imageUrl: '//image2.jpg',
        position: 0,
      });
    });
  });

  describe('asset actions', () => {
    test('should build `addAsset` action', () => {
      const before = {
        variants: [{ id: 1, images: [], assets: [] }],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [{ key: 'asset-1', name: { en: 'Asset 1' }, sources: [] }],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'addAsset',
          variantId: 1,
          asset: { key: 'asset-1', name: { en: 'Asset 1' }, sources: [] },
          position: 0,
        },
      ]);
    });

    test('should build `removeAsset` action', () => {
      const before = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [
              {
                id: 'asset-id-1',
                key: 'asset-1',
                name: { en: 'Asset 1' },
                sources: [],
              },
            ],
          },
        ],
      };
      const now = {
        variants: [{ id: 1, images: [], assets: [] }],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'removeAsset',
          variantId: 1,
          assetId: 'asset-id-1',
        },
      ]);
    });

    test('should build `changeAssetName` action', () => {
      const before = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [
              {
                id: 'asset-id-1',
                key: 'asset-1',
                name: { en: 'Old Name' },
                sources: [],
              },
            ],
          },
        ],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [
              {
                id: 'asset-id-1',
                key: 'asset-1',
                name: { en: 'New Name' },
                sources: [],
              },
            ],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'changeAssetName',
          variantId: 1,
          assetId: 'asset-id-1',
          name: { en: 'New Name' },
        },
      ]);
    });
  });

  describe('product attribute actions', () => {
    test('should build `setProductAttribute` action for new attribute', () => {
      const before = {
        attributes: [],
      };
      const now = {
        attributes: [{ name: 'tailoredAttr', value: 'tailored value' }],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'setProductAttribute',
          name: 'tailoredAttr',
          value: 'tailored value',
        },
      ]);
    });

    test('should build `setProductAttribute` action for changed attribute', () => {
      const before = {
        attributes: [{ name: 'tailoredAttr', value: 'old value' }],
      };
      const now = {
        attributes: [{ name: 'tailoredAttr', value: 'new value' }],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'setProductAttribute',
          name: 'tailoredAttr',
          value: 'new value',
        },
      ]);
    });

    test('should build `setProductAttribute` action to remove attribute', () => {
      const before = {
        attributes: [{ name: 'tailoredAttr', value: 'value' }],
      };
      const now = {
        attributes: [],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'setProductAttribute',
          name: 'tailoredAttr',
          value: undefined,
        },
      ]);
    });
  });

  describe('variant attribute actions', () => {
    test('should build `setAttribute` action for variant attribute', () => {
      const before = {
        variants: [{ id: 1, images: [], assets: [], attributes: [] }],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [],
            attributes: [{ name: 'variantAttr', value: 'variant value' }],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        {
          action: 'setAttribute',
          variantId: 1,
          name: 'variantAttr',
          value: 'variant value',
        },
      ]);
    });

    test('should build `setAttributeInAllVariants` action for SameForAll attribute', () => {
      const before = {
        variants: [{ id: 1, images: [], assets: [], attributes: [] }],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [],
            assets: [],
            attributes: [{ name: 'sameForAllAttr', value: 'shared value' }],
          },
        ],
      };

      const actions = productTailoringSync.buildActions(now, before, {
        sameForAllAttributeNames: ['sameForAllAttr'],
      });
      expect(actions).toEqual([
        {
          action: 'setAttributeInAllVariants',
          name: 'sameForAllAttr',
          value: 'shared value',
        },
      ]);
    });
  });

  describe('multiple actions', () => {
    test('should build multiple actions when multiple fields change', () => {
      const before = {
        name: { en: 'Original Name' },
        description: { en: 'Original Description' },
        slug: { en: 'original-slug' },
      };
      const now = {
        name: { en: 'Tailored Name' },
        description: { en: 'Tailored Description' },
        slug: { en: 'tailored-slug' },
        metaTitle: { en: 'New Meta Title' },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual(
        expect.arrayContaining([
          { action: 'setName', name: now.name },
          { action: 'setDescription', description: now.description },
          { action: 'setSlug', slug: now.slug },
          { action: 'setMetaTitle', metaTitle: now.metaTitle },
        ])
      );
      expect(actions).toHaveLength(4);
    });
  });

  describe('edge cases', () => {
    test('should return empty array when no changes', () => {
      const before = {
        name: { en: 'Product Name' },
        description: { en: 'Description' },
      };
      const now = {
        name: { en: 'Product Name' },
        description: { en: 'Description' },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([]);
    });

    test('should handle empty objects', () => {
      const before = {};
      const now = {};

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([]);
    });

    test('should handle partial localized strings', () => {
      const before = {
        name: { en: 'English Name', de: 'German Name' },
      };
      const now = {
        name: {
          en: 'English Name',
          de: 'Updated German Name',
          fr: 'French Name',
        },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });

    test('should handle long diff text', () => {
      const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Nunc ultricies fringilla tortor eu egestas.
        Praesent rhoncus molestie libero, eu tempor sapien placerat id.`;

      const before = {
        name: { en: longText },
        description: { en: longText },
      };
      const now = {
        name: { en: `Hello, ${longText}` },
        description: { en: `Hello, ${longText}` },
      };

      const actions = productTailoringSync.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setName', name: now.name },
        { action: 'setDescription', description: now.description },
      ]);
    });
  });

  describe('action groups', () => {
    test('should ignore base actions when base group is set to ignore', () => {
      const productTailoringSyncWithIgnore = productTailoringSyncFn([
        { type: 'base', group: 'ignore' },
        { type: 'meta', group: 'allow' },
      ]);

      const before = {
        name: { en: 'Original' },
        metaTitle: { en: 'Original Meta' },
      };
      const now = {
        name: { en: 'Updated' },
        metaTitle: { en: 'Updated Meta' },
      };

      const actions = productTailoringSyncWithIgnore.buildActions(now, before);
      expect(actions).toEqual([
        { action: 'setMetaTitle', metaTitle: now.metaTitle },
      ]);
    });

    test('should ignore meta actions when meta group is set to ignore', () => {
      const productTailoringSyncWithIgnore = productTailoringSyncFn([
        { type: 'meta', group: 'ignore' },
        { type: 'base', group: 'allow' },
      ]);

      const before = {
        name: { en: 'Original' },
        metaTitle: { en: 'Original Meta' },
      };
      const now = {
        name: { en: 'Updated' },
        metaTitle: { en: 'Updated Meta' },
      };

      const actions = productTailoringSyncWithIgnore.buildActions(now, before);
      expect(actions).toEqual([{ action: 'setName', name: now.name }]);
    });

    test('should ignore image actions when images group is set to ignore', () => {
      const productTailoringSyncWithIgnore = productTailoringSyncFn([
        { type: 'images', group: 'ignore' },
      ]);

      const before = {
        variants: [{ id: 1, images: [], assets: [] }],
      };
      const now = {
        variants: [
          {
            id: 1,
            images: [{ url: '//newimage.jpg', dimensions: { w: 400, h: 300 } }],
            assets: [],
          },
        ],
      };

      const actions = productTailoringSyncWithIgnore.buildActions(now, before);
      expect(actions).toEqual([]);
    });
  });
});
