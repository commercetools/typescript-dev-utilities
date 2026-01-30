import forEach from 'lodash.foreach';
import uniqWith from 'lodash.uniqwith';
import intersection from 'lodash.intersection';
import without from 'lodash.without';

import * as diffpatcher from '../utils/diffpatcher';
import extractMatchingPairs from '../utils/extract-matching-pairs';
import actionsMapCustom from '../utils/action-map-custom';
import { buildBaseAttributesActions } from '../utils/common-actions';
import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
} from '../utils/create-build-array-actions';
import findMatchingPairs from '../utils/find-matching-pairs';
import {
  Asset,
  Attribute,
  Delta,
  Image,
  ProductTailoringData,
  ProductVariantTailoring,
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

export const baseActionsList: Array<UpdateAction> = [
  { action: 'setName', key: 'name' },
  { action: 'setSlug', key: 'slug' },
  { action: 'setDescription', key: 'description' },
];

export const metaActionsList: Array<UpdateAction> = [
  { action: 'setMetaTitle', key: 'metaTitle' },
  { action: 'setMetaDescription', key: 'metaDescription' },
  { action: 'setMetaKeywords', key: 'metaKeywords' },
];

export const baseAssetActionsList: Array<UpdateAction> = [
  { action: 'setAssetKey', key: 'key', actionKey: 'assetKey' },
  { action: 'changeAssetName', key: 'name' },
  { action: 'setAssetDescription', key: 'description' },
  { action: 'setAssetTags', key: 'tags' },
  { action: 'setAssetSources', key: 'sources' },
];

/**
 * HELPER FUNCTIONS
 */

function _buildAttributeValue(
  diffedValue: Delta,
  oldAttributeValue: Attribute,
  newAttributeValue
) {
  let value: object;

  if (Array.isArray(diffedValue))
    value = diffpatcher.getDeltaValue(diffedValue, oldAttributeValue);
  else if (typeof diffedValue === 'string')
    value = diffpatcher.getDeltaValue(diffedValue, oldAttributeValue);
  else if (diffedValue.centAmount || diffedValue.currencyCode)
    value = {
      centAmount: diffedValue.centAmount
        ? diffpatcher.getDeltaValue(diffedValue.centAmount)
        : newAttributeValue.centAmount,
      currencyCode: diffedValue.currencyCode
        ? diffpatcher.getDeltaValue(diffedValue.currencyCode)
        : newAttributeValue.currencyCode,
    };
  else if (diffedValue.key) value = diffpatcher.getDeltaValue(diffedValue.key);
  else if (typeof diffedValue === 'object')
    if ({}.hasOwnProperty.call(diffedValue, '_t') && diffedValue._t === 'a') {
      value = newAttributeValue;
    } else {
      const updatedValue = Object.keys(diffedValue).reduce(
        (acc, lang) => {
          const patchedValue = diffpatcher.getDeltaValue(
            diffedValue[lang],
            acc[lang]
          );
          return Object.assign(acc, { [lang]: patchedValue });
        },
        { ...oldAttributeValue }
      );
      value = updatedValue;
    }

  return value;
}

function _buildNewSetAttributeAction(
  variantId: number,
  attr: Attribute,
  sameForAllAttributeNames: Array<string>
) {
  const attributeName = attr && attr.name;
  if (!attributeName) return undefined;

  let action = {
    action: 'setAttribute',
    variantId,
    name: attributeName,
    value: attr.value,
  };

  if (sameForAllAttributeNames.indexOf(attributeName) !== -1) {
    action = { ...action, action: 'setAttributeInAllVariants' };
    delete action.variantId;
  }

  return action;
}

function _buildSetAttributeAction(
  diffedValue: Delta,
  oldVariant: ProductVariantTailoring,
  attribute: Attribute,
  sameForAllAttributeNames: Array<string>
) {
  if (!attribute || !diffedValue) return undefined;

  let action = {
    action: 'setAttribute',
    variantId: oldVariant.id,
    name: attribute.name,
    value: null,
  };

  const oldAttribute = (oldVariant.attributes || []).find(
    (a) => a.name === attribute.name
  );

  if (sameForAllAttributeNames.indexOf(attribute.name) !== -1) {
    action = { ...action, action: 'setAttributeInAllVariants' };
    delete action.variantId;
  }

  action.value = _buildAttributeValue(
    diffedValue,
    oldAttribute?.value,
    attribute.value
  );

  return action;
}

function _buildNewSetProductAttributeAction(attr: Attribute) {
  const attributeName = attr && attr.name;
  if (!attributeName) return undefined;

  return {
    action: 'setProductAttribute',
    name: attributeName,
    value: attr.value,
  };
}

function _buildSetProductAttributeAction(
  diffedValue: Delta,
  oldProductData: ProductTailoringData,
  newAttribute: Attribute
) {
  if (!newAttribute || !diffedValue) return undefined;

  const action = {
    action: 'setProductAttribute',
    name: newAttribute.name,
    value: null,
  };

  const oldAttribute = ((oldProductData.attributes || []).find(
    (a) => a.name === newAttribute.name
  ) || {}) as Attribute;

  action.value = _buildAttributeValue(
    diffedValue,
    oldAttribute.value,
    newAttribute.value
  );

  return action;
}

function _buildVariantImagesAction(
  diffedImages: Delta,
  oldVariant = {} as ProductVariantTailoring,
  newVariant = {} as ProductVariantTailoring
) {
  const actions = [];
  const matchingImagePairs = findMatchingPairs(
    diffedImages,
    oldVariant.images,
    newVariant.images,
    'url'
  );

  forEach(diffedImages, (image: Image, key: string) => {
    const { oldObj, newObj } = extractMatchingPairs(
      matchingImagePairs,
      key,
      oldVariant.images,
      newVariant.images
    );

    if (REGEX_NUMBER.test(key)) {
      if (Array.isArray(image) && image.length)
        actions.push({
          action: 'addExternalImage',
          variantId: oldVariant.id,
          image: diffpatcher.getDeltaValue(image),
        });
      else if (typeof image === 'object')
        if (
          {}.hasOwnProperty.call(image, 'url') &&
          (image as Image).url.length === 2
        ) {
          actions.push({
            action: 'removeImage',
            variantId: oldVariant.id,
            imageUrl: oldObj.url,
          });
          actions.push({
            action: 'addExternalImage',
            variantId: oldVariant.id,
            image: newObj,
          });
        } else if (
          {}.hasOwnProperty.call(image, 'label') &&
          (image.label.length === 1 || image.label.length === 2)
        )
          actions.push({
            action: 'setImageLabel',
            variantId: oldVariant.id,
            imageUrl: oldObj.url,
            label: diffpatcher.getDeltaValue(image.label),
          });
    } else if (REGEX_UNDERSCORE_NUMBER.test(key))
      if (Array.isArray(image) && image.length === 3) {
        if (Number(image[2]) === 3)
          actions.push({
            action: 'moveImageToPosition',
            variantId: oldVariant.id,
            imageUrl: oldObj.url,
            position: Number(image[1]),
          });
        else if (Number(image[2]) === 0)
          actions.push({
            action: 'removeImage',
            variantId: oldVariant.id,
            imageUrl: oldObj.url,
          });
      }
  });

  return actions;
}

function toAssetIdentifier(asset: Asset) {
  return asset.id ? { assetId: asset.id } : { assetKey: asset.key };
}

function toVariantIdentifier(variant: ProductVariantTailoring) {
  const { id, sku } = variant as ProductVariantTailoring & { sku?: string };
  return id ? { variantId: id } : { sku };
}

function _buildVariantChangeAssetOrderAction(
  diffAssets: Delta,
  oldVariant: ProductVariantTailoring,
  newVariant: ProductVariantTailoring
) {
  const isAssetOrderChanged = Object.entries(diffAssets).find((entry) =>
    getIsItemMovedAction(entry[0], entry[1])
  );
  if (!isAssetOrderChanged) return [];

  const assetIdsBefore = (oldVariant.assets || []).map((_) => _.id);
  const assetIdsCurrent = (newVariant.assets || [])
    .map((_) => _.id)
    .filter((_) => _ !== undefined);
  const assetIdsToKeep = intersection(assetIdsCurrent, assetIdsBefore);
  const assetIdsToRemove = without(assetIdsBefore, ...assetIdsToKeep);

  return [
    {
      action: 'changeAssetOrder',
      assetOrder: assetIdsToKeep.concat(assetIdsToRemove),
      ...toVariantIdentifier(oldVariant),
    },
  ];
}

function _buildVariantAssetsActions(
  diffAssets: Delta,
  oldVariant: ProductVariantTailoring,
  newVariant: ProductVariantTailoring
) {
  const assetActions = [];
  const matchingAssetPairs = findMatchingPairs(
    diffAssets,
    oldVariant.assets,
    newVariant.assets
  );

  forEach(diffAssets, (asset: Asset, key: string) => {
    const { oldObj: oldAsset, newObj: newAsset } = extractMatchingPairs(
      matchingAssetPairs,
      key,
      oldVariant.assets,
      newVariant.assets
    );

    if (getIsAddAction(key, asset)) {
      assetActions.push({
        action: 'addAsset',
        asset: diffpatcher.getDeltaValue(asset),
        ...toVariantIdentifier(newVariant),
        position: Number(key),
      });
      return;
    }

    if (getIsUpdateAction(key, asset)) {
      const basicActions = buildBaseAttributesActions({
        actions: baseAssetActionsList,
        diff: asset,
        oldObj: oldAsset,
        newObj: newAsset,
      }).map((action) => {
        if (action.action === 'setAssetKey') {
          return {
            ...action,
            ...toVariantIdentifier(oldVariant),
            assetId: oldAsset.id,
          };
        }
        return {
          ...action,
          ...toVariantIdentifier(oldVariant),
          ...toAssetIdentifier(oldAsset),
        };
      });
      assetActions.push(...basicActions);

      if (asset.custom) {
        const customActions = actionsMapCustom(asset, newAsset, oldAsset, {
          actions: {
            setCustomType: 'setAssetCustomType',
            setCustomField: 'setAssetCustomField',
          },
          ...toVariantIdentifier(oldVariant),
          ...toAssetIdentifier(oldAsset),
        });
        assetActions.push(...customActions);
      }
      return;
    }

    if (getIsRemoveAction(key, asset)) {
      assetActions.push({
        action: 'removeAsset',
        ...toAssetIdentifier(oldAsset),
        ...toVariantIdentifier(oldVariant),
      });
    }
  });

  const changedAssetOrderAction = _buildVariantChangeAssetOrderAction(
    diffAssets,
    oldVariant,
    newVariant
  );
  return [...changedAssetOrderAction, ...assetActions];
}

function _buildVariantAttributesActions(
  attributes: Attribute,
  oldVariant: ProductVariantTailoring,
  newVariant: ProductVariantTailoring,
  sameForAllAttributeNames: Array<string>
) {
  const actions = [];
  if (!attributes) return actions;

  forEach(attributes, (value: Attribute, key: string) => {
    if (REGEX_NUMBER.test(key)) {
      if (Array.isArray(value)) {
        const { id } = oldVariant;
        const deltaValue = diffpatcher.getDeltaValue(value) as Attribute;
        const setAction = _buildNewSetAttributeAction(
          id,
          deltaValue,
          sameForAllAttributeNames
        );
        if (setAction) actions.push(setAction);
      } else if (newVariant.attributes) {
        const setAction = _buildSetAttributeAction(
          value.value,
          oldVariant,
          newVariant.attributes[key],
          sameForAllAttributeNames
        );
        if (setAction) actions.push(setAction);
      }
    } else if (REGEX_UNDERSCORE_NUMBER.test(key))
      if (Array.isArray(value)) {
        if (value.length === 3 && value[2] === 3) return;

        const { id } = oldVariant;
        let deltaValue = diffpatcher.getDeltaValue(value) as Partial<Attribute>;
        if (!deltaValue)
          if (value[0] && value[0].name) deltaValue = { name: value[0].name };
          else deltaValue = undefined;

        const setAction = _buildNewSetAttributeAction(
          id,
          deltaValue as Attribute,
          sameForAllAttributeNames
        );
        if (setAction) actions.push(setAction);
      } else {
        const index = key.substring(1);
        if (newVariant.attributes) {
          const setAction = _buildSetAttributeAction(
            value.value,
            oldVariant,
            newVariant.attributes[index],
            sameForAllAttributeNames
          );
          if (setAction) actions.push(setAction);
        }
      }
  });

  return actions;
}

function _buildProductAttributesActions(
  diffedAttributes: Delta,
  oldProductData: ProductTailoringData,
  newProductData: ProductTailoringData
) {
  const actions = [];
  if (!diffedAttributes) return actions;

  forEach(diffedAttributes, (value: object | Array<object>, key: string) => {
    if (REGEX_NUMBER.test(key)) {
      if (Array.isArray(value)) {
        const setAction = _buildNewSetProductAttributeAction(
          diffpatcher.getDeltaValue(value)
        );
        if (setAction) actions.push(setAction);
      } else if (newProductData.attributes) {
        const setAction = _buildSetProductAttributeAction(
          value['value'],
          oldProductData,
          newProductData.attributes[key]
        );
        if (setAction) actions.push(setAction);
      }
    } else if (REGEX_UNDERSCORE_NUMBER.test(key)) {
      if (Array.isArray(value)) {
        if (value.length === 3 && value[2] === 3) return;

        let deltaValue = diffpatcher.getDeltaValue(value) as Partial<Attribute>;
        if (!deltaValue)
          if (value[0] && value[0].name) deltaValue = { name: value[0].name };
          else deltaValue = undefined;

        const setAction = _buildNewSetProductAttributeAction(
          deltaValue as Attribute
        );
        if (setAction) actions.push(setAction);
      } else {
        const index = key.substring(1);
        if (newProductData.attributes) {
          const setAction = _buildSetProductAttributeAction(
            value['value'],
            oldProductData,
            newProductData.attributes[index]
          );
          if (setAction) actions.push(setAction);
        }
      }
    }
  });

  return actions;
}

/**
 * SYNC FUNCTIONS
 */

export function actionsMapBase(
  diff: Delta,
  oldObj: object,
  newObj: object,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: baseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
  });
}

export function actionsMapMeta<T extends object>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: metaActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
  });
}

export function actionsMapAddVariants<T extends object>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const handler = createBuildArrayActions('variants', {
    [ADD_ACTIONS]: (newObject: ProductVariantTailoring) => ({
      ...newObject,
      action: 'addVariant',
    }),
  });
  return handler(diff, oldObj, newObj);
}

export function actionsMapRemoveVariants<T extends object>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const handler = createBuildArrayActions('variants', {
    [REMOVE_ACTIONS]: ({ id, sku }) => ({
      action: 'removeVariant',
      ...(id ? { id } : { sku }),
    }),
  });
  return handler(diff, oldObj, newObj);
}

export function actionsMapImages<T extends object = ProductTailoringData>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  variantHashMap: object
): Array<UpdateAction> {
  let actions = [];
  const { variants } = diff;

  if (variants)
    forEach(variants, (variant, key) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        (oldObj as ProductTailoringData).variants,
        (newObj as ProductTailoringData).variants
      );

      if (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key)) {
        const vActions = _buildVariantImagesAction(
          variant.images,
          oldVariant,
          newVariant
        );
        actions = actions.concat(vActions);
      }
    });

  return actions;
}

export function actionsMapAssets<T extends ProductTailoringData>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  variantHashMap: object
): Array<UpdateAction> {
  let allAssetsActions = [];
  const { variants } = diff;

  if (variants)
    forEach(variants, (variant: ProductVariantTailoring, key: string) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        (oldObj as ProductTailoringData).variants,
        (newObj as ProductTailoringData).variants
      );

      if (
        variant.assets &&
        (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key))
      ) {
        const assetActions = _buildVariantAssetsActions(
          variant.assets,
          oldVariant,
          newVariant
        );
        allAssetsActions = allAssetsActions.concat(assetActions);
      }
    });

  return allAssetsActions;
}

export function actionsMapProductAttributes(
  diff: Delta,
  oldObj: ProductTailoringData,
  newObj: ProductTailoringData
) {
  return _buildProductAttributesActions(diff.attributes, oldObj, newObj);
}

export function actionsMapVariantAttributes(
  diff: Delta,
  oldObj: ProductTailoringData,
  newObj: ProductTailoringData,
  sameForAllAttributeNames: Array<string> = [],
  variantHashMap: object
) {
  let actions = [];
  const { variants } = diff;

  if (variants)
    forEach(variants, (variant, key) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        oldObj.variants,
        newObj.variants
      );

      if (REGEX_NUMBER.test(key) && !Array.isArray(variant)) {
        const { attributes } = variant;
        const attrActions = _buildVariantAttributesActions(
          attributes,
          oldVariant,
          newVariant,
          sameForAllAttributeNames
        );
        actions = actions.concat(attrActions);
      }
    });

  return uniqWith(
    actions,
    (a, b) =>
      a.action === b.action && a.name === b.name && a.variantId === b.variantId
  );
}
