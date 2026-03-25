import forEach from 'lodash.foreach';
import intersection from 'lodash.intersection';
import without from 'lodash.without';
import * as diffpatcher from '../utils/diffpatcher';
import findMatchingPairs from '../utils/find-matching-pairs';
import extractMatchingPairs from '../utils/extract-matching-pairs';
import { buildBaseAttributesActions } from '../utils/common-actions';
import actionsMapCustom from '../utils/action-map-custom';
import {
  Asset,
  AssetSource,
  Attribute,
  Delta,
  Image,
  LocalizedString,
  ProductVariant,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';
import {
  REGEX_NUMBER,
  REGEX_UNDERSCORE_NUMBER,
  getIsAddAction,
  getIsUpdateAction,
  getIsRemoveAction,
  getIsItemMovedAction,
} from '../utils/array-actions-utils';

export const baseAssetActionsList: Array<UpdateAction> = [
  { action: 'setAssetKey', key: 'key', actionKey: 'assetKey' },
  { action: 'changeAssetName', key: 'name' },
  { action: 'setAssetDescription', key: 'description' },
  { action: 'setAssetTags', key: 'tags' },
  { action: 'setAssetSources', key: 'sources' },
];

export type StandaloneVariantAction = {
  action: string;
  key?: string;
  sku?: string;
  name?: string;
  value?: string | null;
  attributes?: Array<{ name: string; value?: string }>;
  staged?: boolean;
  // Image action fields
  image?: Image;
  imageUrl?: string;
  label?: string;
  position?: number;
  // Asset action fields
  asset?: Asset;
  assetId?: string;
  assetKey?: string;
  assetOrder?: string[];
  // Asset property action fields
  description?: LocalizedString;
  tags?: string[];
  sources?: AssetSource[];
  // Asset custom field action fields
  type?: { typeId: string; id?: string; key?: string };
  fields?: Record<string, unknown>;
};

function _buildKeyAction(
  variantDiff: Delta,
  oldVariant: ProductVariant
): StandaloneVariantAction | null {
  if ({}.hasOwnProperty.call(variantDiff, 'key')) {
    // getDeltaValue is typed as `object` but returns primitives at runtime,
    // requiring the cast through `unknown`
    const newValue = diffpatcher.getDeltaValue(variantDiff.key) as unknown as string | undefined;
    if (!newValue && !oldVariant.key) return null;

    return {
      action: 'setKey',
      key: newValue || undefined,
    };
  }
  return null;
}

function _buildSkuAction(
  variantDiff: Delta,
  oldVariant: ProductVariant,
  config: SyncActionConfig = {}
): StandaloneVariantAction | null {
  if ({}.hasOwnProperty.call(variantDiff, 'sku')) {
    // getDeltaValue is typed as `object` but returns primitives at runtime,
    // requiring the cast through `unknown`
    const newValue = diffpatcher.getDeltaValue(variantDiff.sku) as unknown as string | undefined;
    if (!newValue && !oldVariant.sku) return null;

    const action: StandaloneVariantAction = {
      action: 'setSku',
      sku: newValue || undefined,
    };

    if (config.staged !== false) {
      action.staged = true;
    }

    return action;
  }
  return null;
}

export function convertAttributeToUpdateActionShape(attribute: Attribute): {
  name: string;
  value?: string;
} {
  const { name, value } = attribute;
  return {
    name,
    ...(typeof value !== 'undefined'
      ? {
        value: JSON.stringify(value),
      }
      : {}),
  };
}

type ModifiedAttribute = { name: string; value: unknown };

/**
 * Processes a numeric key from the diff, indicating an added or modified attribute.
 * Returns the modified attribute or null if not applicable.
 */
function _processAddedOrModifiedAttribute(
  diffValue: Attribute | Array<unknown>,
  key: string,
  newAttributes: Attribute[]
): ModifiedAttribute | null {
  if (Array.isArray(diffValue)) {
    const attr = diffpatcher.getDeltaValue(diffValue) as Attribute;
    if (attr && attr.name) {
      return { name: attr.name, value: attr.value };
    }
  } else if (diffValue && typeof diffValue === 'object') {
    const attr = newAttributes[parseInt(key, 10)];
    if (attr && attr.name) {
      return { name: attr.name, value: attr.value };
    }
  }
  return null;
}

/**
 * Processes an underscore-prefixed key from the diff, indicating a removed attribute.
 * Returns the removed attribute (with null value) or null if not applicable.
 */
function _processRemovedAttribute(
  diffValue: Array<unknown>,
  newAttributes: Attribute[]
): ModifiedAttribute | null {
  if (!Array.isArray(diffValue)) return null;

  // Skip array moves (value[2] === 3)
  if (diffValue.length === 3 && (diffValue[2] as number) === 3) return null;

  const removedAttr = diffValue[0] as Attribute;
  if (removedAttr && removedAttr.name) {
    const existsInNew = newAttributes.some(
      (a) => a && a.name === removedAttr.name
    );
    if (!existsInNew) {
      return { name: removedAttr.name, value: null };
    }
  }
  return null;
}

/**
 * Collects all modified attributes from the diff by iterating through
 * numeric keys (added/modified) and underscore-prefixed keys (removed).
 */
function _collectModifiedAttributes(
  attributesDiff: Delta,
  newAttributes: Attribute[]
): ModifiedAttribute[] {
  const modifiedAttributes: ModifiedAttribute[] = [];

  forEach(
    attributesDiff,
    (value: Attribute | Array<unknown>, key: string) => {
      if (REGEX_NUMBER.test(key)) {
        const modified = _processAddedOrModifiedAttribute(value, key, newAttributes);
        if (modified) {
          modifiedAttributes.push(modified);
        }
      } else if (REGEX_UNDERSCORE_NUMBER.test(key)) {
        const removed = _processRemovedAttribute(value as Array<unknown>, newAttributes);
        if (removed) {
          modifiedAttributes.push(removed);
        }
      }
    }
  );

  return modifiedAttributes;
}

/**
 * Creates a setAttributes action for attributes that have been added or modified.
 */
function _createSetAttributesAction(
  modifiedAttributes: ModifiedAttribute[],
  config: SyncActionConfig
): StandaloneVariantAction | null {
  const attributesToSet = modifiedAttributes
    .filter((attr) => attr.value !== null)
    .map((attr) => convertAttributeToUpdateActionShape(attr as Attribute));

  if (attributesToSet.length === 0) return null;

  const action: StandaloneVariantAction = {
    action: 'setAttributes',
    attributes: attributesToSet,
  };

  if (config.staged !== false) {
    action.staged = true;
  }

  return action;
}

/**
 * Creates setAttribute actions for attributes that have been removed (value: null).
 */
function _createUnsetAttributeActions(
  modifiedAttributes: ModifiedAttribute[],
  config: SyncActionConfig
): StandaloneVariantAction[] {
  const attributesToUnset = modifiedAttributes.filter(
    (attr) => attr.value === null
  );

  return attributesToUnset.map((attr) => {
    const action: StandaloneVariantAction = {
      action: 'setAttribute',
      name: attr.name,
      value: null,
    };

    if (config.staged !== false) {
      action.staged = true;
    }

    return action;
  });
}

/**
 * Builds update actions for attribute changes on standalone variants.
 * Generates setAttributes for added/modified attributes and setAttribute for removed attributes.
 */
function _buildAttributesActions(
  attributesDiff: Delta,
  _oldVariant: ProductVariant,
  newVariant: ProductVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  if (!attributesDiff) return [];

  const newAttributes = newVariant.attributes || [];
  const modifiedAttributes = _collectModifiedAttributes(attributesDiff, newAttributes);

  if (modifiedAttributes.length === 0) return [];

  const actions: Array<StandaloneVariantAction> = [];

  // Add setAttributes action for modified/added attributes
  const setAttributesAction = _createSetAttributesAction(modifiedAttributes, config);
  if (setAttributesAction) {
    actions.push(setAttributesAction);
  }

  // Add setAttribute actions for removed attributes
  const unsetActions = _createUnsetAttributeActions(modifiedAttributes, config);
  actions.push(...unsetActions);

  return actions;
}

/**
 * Builds image actions for a standalone variant.
 * Handles addExternalImage, removeImage, moveImageToPosition, and setImageLabel.
 */
function _buildVariantImagesAction(
  diffedImages: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const actions: Array<StandaloneVariantAction> = [];

  if (!diffedImages) return actions;

  const oldImages = oldVariant.images || [];
  const newImages = newVariant.images || [];

  // Generate a hashMap to be able to reference the right image from both ends
  const matchingImagePairs = findMatchingPairs(
    diffedImages,
    oldImages,
    newImages,
    'url'
  );

  forEach(diffedImages, (image: Image | Array<unknown>, key: string) => {
    const { oldObj, newObj } = extractMatchingPairs(
      matchingImagePairs,
      key,
      oldImages,
      newImages
    );

    if (REGEX_NUMBER.test(key)) {
      // New image added
      if (Array.isArray(image) && image.length) {
        const action: StandaloneVariantAction = {
          action: 'addExternalImage',
          image: diffpatcher.getDeltaValue(image) as Image,
        };
        if (config.staged !== false) {
          action.staged = true;
        }
        actions.push(action);
      } else if (typeof image === 'object') {
        // Image URL changed - remove old, add new
        if (
          {}.hasOwnProperty.call(image, 'url') &&
          Array.isArray((image as Delta).url) &&
          (image as Delta).url.length === 2
        ) {
          const removeAction: StandaloneVariantAction = {
            action: 'removeImage',
            imageUrl: (oldObj as Image)?.url,
          };
          if (config.staged !== false) {
            removeAction.staged = true;
          }
          actions.push(removeAction);

          const addAction: StandaloneVariantAction = {
            action: 'addExternalImage',
            image: newObj as Image,
          };
          if (config.staged !== false) {
            addAction.staged = true;
          }
          actions.push(addAction);
        } else if (
          // Image label changed
          {}.hasOwnProperty.call(image, 'label') &&
          Array.isArray((image as Delta).label) &&
          ((image as Delta).label.length === 1 || (image as Delta).label.length === 2)
        ) {
          const action: StandaloneVariantAction = {
            action: 'setImageLabel',
            imageUrl: (oldObj as Image)?.url,
            label: diffpatcher.getDeltaValue((image as Delta).label) as unknown as string,
          };
          if (config.staged !== false) {
            action.staged = true;
          }
          actions.push(action);
        }
      }
    } else if (REGEX_UNDERSCORE_NUMBER.test(key)) {
      if (Array.isArray(image) && image.length === 3) {
        if (Number(image[2]) === 3) {
          // Image position changed (array move)
          const action: StandaloneVariantAction = {
            action: 'moveImageToPosition',
            imageUrl: (oldObj as Image)?.url,
            position: Number(image[1]),
          };
          if (config.staged !== false) {
            action.staged = true;
          }
          actions.push(action);
        } else if (Number(image[2]) === 0) {
          // Image removed
          const action: StandaloneVariantAction = {
            action: 'removeImage',
            imageUrl: (oldObj as Image)?.url,
          };
          if (config.staged !== false) {
            action.staged = true;
          }
          actions.push(action);
        }
      }
    }
  });

  return actions;
}

/**
 * Maps base actions (setKey, setSku) for standalone variants.
 * Analyzes the diff between old and new variant and generates appropriate actions.
 */
export function actionsMapBase(
  diff: Delta,
  oldObj: { variants?: ProductVariant[] },
  newObj: { variants?: ProductVariant[] },
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const actions: Array<StandaloneVariantAction> = [];

  // Standalone variants are stored in variants[0]
  const oldVariant = oldObj?.variants?.[0];
  const newVariant = newObj?.variants?.[0];

  if (!oldVariant || !newVariant) {
    return actions;
  }

  // Check if variants array has changed
  const variantsDiff = diff?.variants;
  if (!variantsDiff) {
    return actions;
  }

  // Get the diff for the first variant (index 0)
  const variantDiff = variantsDiff['0'] || variantsDiff[0];
  if (!variantDiff || Array.isArray(variantDiff)) {
    return actions;
  }

  // Build key action
  const keyAction = _buildKeyAction(variantDiff, oldVariant);
  if (keyAction) {
    actions.push(keyAction);
  }

  // Build sku action
  const skuAction = _buildSkuAction(variantDiff, oldVariant, config);
  if (skuAction) {
    actions.push(skuAction);
  }

  return actions;
}

/**
 * Maps attribute actions for standalone variants.
 * Generates setAttributes and setAttribute actions for modified attributes.
 */
export function actionsMapAttributes(
  diff: Delta,
  oldObj: { variants?: ProductVariant[] },
  newObj: { variants?: ProductVariant[] },
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const actions: Array<StandaloneVariantAction> = [];

  // Standalone variants are stored in variants[0]
  const oldVariant = oldObj?.variants?.[0];
  const newVariant = newObj?.variants?.[0];

  if (!oldVariant || !newVariant) {
    return actions;
  }

  // Check if variants array has changed
  const variantsDiff = diff?.variants;
  if (!variantsDiff) {
    return actions;
  }

  // Get the diff for the first variant (index 0)
  const variantDiff = variantsDiff['0'] || variantsDiff[0];
  if (!variantDiff || Array.isArray(variantDiff)) {
    return actions;
  }

  // Build attributes actions if attributes have changed
  if (variantDiff.attributes) {
    const attributeActions = _buildAttributesActions(
      variantDiff.attributes,
      oldVariant,
      newVariant,
      config
    );
    actions.push(...attributeActions);
  }

  return actions;
}

/**
 * Maps image actions for standalone variants.
 * Generates addExternalImage, removeImage, moveImageToPosition, and setImageLabel actions.
 */
export function actionsMapImages(
  diff: Delta,
  oldObj: { variants?: ProductVariant[] },
  newObj: { variants?: ProductVariant[] },
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  // Standalone variants are stored in variants[0]
  const oldVariant = oldObj?.variants?.[0];
  const newVariant = newObj?.variants?.[0];

  if (!oldVariant || !newVariant) {
    return [];
  }

  // Check if variants array has changed
  const variantsDiff = diff?.variants;
  if (!variantsDiff) {
    return [];
  }

  // Get the diff for the first variant (index 0)
  const variantDiff = variantsDiff['0'] || variantsDiff[0];
  if (!variantDiff || Array.isArray(variantDiff)) {
    return [];
  }

  // Build image actions if images have changed
  if (variantDiff.images) {
    return _buildVariantImagesAction(
      variantDiff.images,
      oldVariant,
      newVariant,
      config
    );
  }

  return [];
}

/**
 * Returns the asset identifier (assetId or assetKey) for an asset.
 */
function _toAssetIdentifier(
  asset: Asset
): { assetId: string } | { assetKey: string } {
  return asset.id ? { assetId: asset.id } : { assetKey: asset.key };
}

/**
 * Builds changeAssetOrder action when assets have been reordered.
 */
function _buildVariantChangeAssetOrderAction(
  diffAssets: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const isAssetOrderChanged = Object.entries(diffAssets).find((entry) =>
    getIsItemMovedAction(entry[0], entry[1])
  );
  if (!isAssetOrderChanged) {
    return [];
  }

  const oldAssets = oldVariant.assets || [];
  const newAssets = newVariant.assets || [];

  const assetIdsBefore = oldAssets.map((_) => _.id);
  const assetIdsCurrent = newAssets
    .map((_) => _.id)
    .filter((_) => _ !== undefined);
  const assetIdsToKeep = intersection(assetIdsCurrent, assetIdsBefore);
  const assetIdsToRemove = without(assetIdsBefore, ...assetIdsToKeep);

  const action: StandaloneVariantAction = {
    action: 'changeAssetOrder',
    assetOrder: assetIdsToKeep.concat(assetIdsToRemove),
  };

  if (config.staged !== false) {
    action.staged = true;
  }

  return [action];
}

/**
 * Builds asset actions for a standalone variant.
 * Handles addAsset, removeAsset, and changeAssetOrder.
 */
function _buildVariantAssetsActions(
  diffAssets: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const assetActions: Array<StandaloneVariantAction> = [];

  if (!diffAssets) return assetActions;

  const oldAssets = oldVariant.assets || [];
  const newAssets = newVariant.assets || [];

  // Generate a hashMap to be able to reference the right asset from both ends
  const matchingAssetPairs = findMatchingPairs(
    diffAssets,
    oldAssets,
    newAssets
  );

  forEach(diffAssets, (asset: Asset | Array<unknown>, key: string) => {
    const { oldObj: oldAsset, newObj: newAsset } = extractMatchingPairs(
      matchingAssetPairs,
      key,
      oldAssets,
      newAssets
    );

    if (getIsAddAction(key, asset)) {
      const action: StandaloneVariantAction = {
        action: 'addAsset',
        asset: diffpatcher.getDeltaValue(asset) as Asset,
        position: Number(key),
      };
      if (config.staged !== false) {
        action.staged = true;
      }
      assetActions.push(action);
      return;
    }

    if (getIsUpdateAction(key, asset)) {
      // Build property change actions using buildBaseAttributesActions
      const basicActions = buildBaseAttributesActions({
        actions: baseAssetActionsList,
        diff: asset as Delta,
        oldObj: oldAsset as Asset,
        newObj: newAsset as Asset,
      }).map((action) => {
        const baseAction: StandaloneVariantAction = {
          ...action,
        } as StandaloneVariantAction;

        // For setAssetKey, use only assetId as identifier
        if (action.action === 'setAssetKey') {
          baseAction.assetId = (oldAsset as Asset).id;
        } else {
          // For other actions, use assetId or assetKey
          Object.assign(baseAction, _toAssetIdentifier(oldAsset as Asset));
        }

        if (config.staged !== false) {
          baseAction.staged = true;
        }

        return baseAction;
      });

      assetActions.push(...basicActions);

      // Handle custom field changes
      if ((asset as Delta).custom) {
        const customActions = actionsMapCustom(
          asset as Delta,
          newAsset,
          oldAsset,
          {
            actions: {
              setCustomType: 'setAssetCustomType',
              setCustomField: 'setAssetCustomField',
            },
            ..._toAssetIdentifier(oldAsset as Asset),
          }
        ).map((action) => {
          const customAction: StandaloneVariantAction = {
            ...action,
          } as StandaloneVariantAction;

          if (config.staged !== false) {
            customAction.staged = true;
          }

          return customAction;
        });

        assetActions.push(...customActions);
      }

      return;
    }

    if (getIsRemoveAction(key, asset)) {
      const action: StandaloneVariantAction = {
        action: 'removeAsset',
        ..._toAssetIdentifier(oldAsset as Asset),
      };
      if (config.staged !== false) {
        action.staged = true;
      }
      assetActions.push(action);
    }
  });

  // Handle changeAssetOrder action
  const changedAssetOrderAction = _buildVariantChangeAssetOrderAction(
    diffAssets,
    oldVariant,
    newVariant,
    config
  );

  return [...changedAssetOrderAction, ...assetActions];
}

/**
 * Maps asset actions for standalone variants.
 * Generates addAsset, removeAsset, and changeAssetOrder actions.
 */
export function actionsMapAssets(
  diff: Delta,
  oldObj: { variants?: ProductVariant[] },
  newObj: { variants?: ProductVariant[] },
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  // Standalone variants are stored in variants[0]
  const oldVariant = oldObj?.variants?.[0];
  const newVariant = newObj?.variants?.[0];

  if (!oldVariant || !newVariant) {
    return [];
  }

  // Check if variants array has changed
  const variantsDiff = diff?.variants;
  if (!variantsDiff) {
    return [];
  }

  // Get the diff for the first variant (index 0)
  const variantDiff = variantsDiff['0'] || variantsDiff[0];
  if (!variantDiff || Array.isArray(variantDiff)) {
    return [];
  }

  // Build asset actions if assets have changed
  if (variantDiff.assets) {
    return _buildVariantAssetsActions(
      variantDiff.assets,
      oldVariant,
      newVariant,
      config
    );
  }

  return [];
}
