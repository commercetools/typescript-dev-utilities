import forEach from 'lodash.foreach';
import uniqWith from 'lodash.uniqwith';
import intersection from 'lodash.intersection';
import without from 'lodash.without';

import * as diffpatcher from '../utils/diffpatcher';
import extractMatchingPairs from '../utils/extract-matching-pairs';
import actionsMapCustom from '../utils/action-map-custom';
import {
  buildBaseAttributesActions,
  buildReferenceActions,
} from '../utils/common-actions';
import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
} from '../utils/create-build-array-actions';
import findMatchingPairs from '../utils/find-matching-pairs';
import {
  Asset,
  Attribute,
  Category,
  Delta,
  Image,
  Price,
  ProductData,
  ProductSetCategoryOrderHintAction,
  ProductVariant,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';
import clone from '../utils/clone';
import {
  REGEX_NUMBER,
  REGEX_UNDERSCORE_NUMBER,
  getIsAddAction,
  getIsUpdateAction,
  getIsRemoveAction,
  getIsItemMovedAction,
} from '../utils/array-actions-utils';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeName', key: 'name' },
  { action: 'changeSlug', key: 'slug' },
  { action: 'setDescription', key: 'description' },
  { action: 'setSearchKeywords', key: 'searchKeywords' },
  { action: 'setKey', key: 'key' },
  { action: 'setPriceMode', key: 'priceMode' },
];

export const baseAssetActionsList: Array<UpdateAction> = [
  { action: 'setAssetKey', key: 'key', actionKey: 'assetKey' },
  { action: 'changeAssetName', key: 'name' },
  { action: 'setAssetDescription', key: 'description' },
  { action: 'setAssetTags', key: 'tags' },
  { action: 'setAssetSources', key: 'sources' },
];

export const metaActionsList: Array<UpdateAction> = [
  { action: 'setMetaTitle', key: 'metaTitle' },
  { action: 'setMetaDescription', key: 'metaDescription' },
  { action: 'setMetaKeywords', key: 'metaKeywords' },
];

export const referenceActionsList: Array<UpdateAction> = [
  { action: 'setTaxCategory', key: 'taxCategory' },
  { action: 'transitionState', key: 'state' },
];

/**
 * HELPER FUNCTIONS
 */

function _buildSkuActions(
  variantDiff: ProductVariant,
  oldVariant: ProductVariant
) {
  if ({}.hasOwnProperty.call(variantDiff, 'sku')) {
    const newValue = diffpatcher.getDeltaValue(variantDiff.sku);
    if (!newValue && !oldVariant.sku) return null;

    return {
      action: 'setSku',
      variantId: oldVariant.id,
      sku: newValue || null,
    };
  }
  return null;
}

function _buildKeyActions(
  variantDiff: ProductVariant,
  oldVariant: ProductVariant
) {
  if ({}.hasOwnProperty.call(variantDiff, 'key')) {
    const newValue = diffpatcher.getDeltaValue(variantDiff.key);
    if (!newValue && !oldVariant.key) return null;

    return {
      action: 'setProductVariantKey',
      variantId: oldVariant.id,
      key: newValue || null,
    };
  }
  return null;
}

function _buildAttributeValue(
  diffedValue: Delta,
  oldAttributeValue: Attribute,
  newAttributeValue
) {
  let value: object;

  if (Array.isArray(diffedValue))
    value = diffpatcher.getDeltaValue(diffedValue, oldAttributeValue);
  else if (typeof diffedValue === 'string')
    // LText: value: {en: "", de: ""}
    // Enum: value: {key: "foo", label: "Foo"}
    // LEnum: value: {key: "foo", label: {en: "Foo", de: "Foo"}}
    // Money: value: {centAmount: 123, currencyCode: ""}
    // *: value: ""

    // normal
    value = diffpatcher.getDeltaValue(diffedValue, oldAttributeValue);
  else if (diffedValue.centAmount || diffedValue.currencyCode)
    // Money
    value = {
      centAmount: diffedValue.centAmount
        ? diffpatcher.getDeltaValue(diffedValue.centAmount)
        : newAttributeValue.centAmount,
      currencyCode: diffedValue.currencyCode
        ? diffpatcher.getDeltaValue(diffedValue.currencyCode)
        : newAttributeValue.currencyCode,
    };
  else if (diffedValue.key)
    // Enum / LEnum (use only the key)
    value = diffpatcher.getDeltaValue(diffedValue.key);
  else if (typeof diffedValue === 'object')
    if ({}.hasOwnProperty.call(diffedValue, '_t') && diffedValue._t === 'a') {
      // set-typed attribute
      value = newAttributeValue;
    } else {
      // LText

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
  variantId: string | number,
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
  oldVariant: ProductVariant,
  attribute: Attribute,
  sameForAllAttributeNames: Array<string>
) {
  // in the case of diffedValue being null or undefined, _buildAttributeValue will fail.
  if (!attribute || !diffedValue) return undefined;

  let action = {
    action: 'setAttribute',
    variantId: oldVariant.id,
    name: attribute.name,
    value: null,
  };

  // Used as original object for patching long diff text
  const oldAttribute = (oldVariant.attributes.find(
    (a) => a.name === attribute.name
  ) || {}) as Attribute;

  if (sameForAllAttributeNames.indexOf(attribute.name) !== -1) {
    action = { ...action, action: 'setAttributeInAllVariants' };
    delete action.variantId;
  }

  action.value = _buildAttributeValue(
    diffedValue,
    oldAttribute.value,
    attribute.value
  );

  return action;
}

function _buildNewSetProductAttributeAction(attr: Attribute) {
  const attributeName = attr && attr.name;
  if (!attributeName) return undefined;

  const action = {
    action: 'setProductAttribute',
    name: attributeName,
    value: attr.value,
  };

  return action;
}

function _buildSetProductAttributeAction(
  diffedValue: Delta,
  oldProductData: ProductVariant,
  newAttribute
) {
  // in the case of diffedValue being null or undefined, _buildAttributeValue will fail.
  if (!newAttribute || !diffedValue) return undefined;

  const action = {
    action: 'setProductAttribute',
    name: newAttribute.name,
    value: null,
  };

  // Used as original object for patching long diff text
  const oldAttribute = (oldProductData.attributes.find(
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
  oldVariant = {} as ProductVariant,
  newVariant = {} as ProductVariant
) {
  const actions = [];
  // generate a hashMap to be able to reference the right image from both ends
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
      // New image
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
          // There is a new image, remove the old one first.
          actions.push({
            action: 'removeImage',
            variantId: oldVariant.id,
            imageUrl: (oldObj as unknown as Image).url,
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
            imageUrl: (oldObj as unknown as Image).url,
            label: diffpatcher.getDeltaValue(image.label),
          });
    } else if (REGEX_UNDERSCORE_NUMBER.test(key))
      if (Array.isArray(image) && image.length === 3) {
        if (Number(image[2]) === 3)
          // image position changed
          actions.push({
            action: 'moveImageToPosition',
            variantId: oldVariant.id,
            imageUrl: (oldObj as unknown as Image).url,
            position: Number(image[1]),
          });
        else if (Number(image[2]) === 0)
          // image removed
          actions.push({
            action: 'removeImage',
            variantId: oldVariant.id,
            imageUrl: (oldObj as unknown as Image).url,
          });
      }
  });

  return actions;
}

function _buildVariantPricesAction(
  diffedPrices: Delta,
  oldVariant = {} as ProductVariant,
  newVariant = {} as ProductVariant,
  enableDiscounted = false
) {
  const addPriceActions = [];
  const changePriceActions = [];
  const removePriceActions = [];

  // generate a hashMap to be able to reference the right image from both ends
  const matchingPricePairs = findMatchingPairs(
    diffedPrices,
    oldVariant.prices,
    newVariant.prices
  );
  forEach(diffedPrices, (price: Price | Price[], key: string) => {
    const { oldObj, newObj } = extractMatchingPairs(
      matchingPricePairs,
      key,
      oldVariant.prices,
      newVariant.prices
    );
    if (getIsAddAction(key, price)) {
      // Remove read-only fields
      const patchedPrice = (price as Price[]).map((p: Price) => {
        const shallowClone = { ...p };
        if (enableDiscounted !== true) delete shallowClone.discounted;
        return shallowClone;
      });

      addPriceActions.push({
        action: 'addPrice',
        variantId: oldVariant.id,
        price: diffpatcher.getDeltaValue(patchedPrice),
      });
      return;
    }

    if (getIsUpdateAction(key, price)) {
      // Remove the discounted field and make sure that the price
      // still has other values, otherwise simply return
      const filteredPrice = clone(price);
      if (enableDiscounted !== true) delete filteredPrice['discounted'];
      if (Object.keys(filteredPrice).length) {
        // At this point price should have changed, simply pick the new one
        const newPrice = { ...newObj };
        if (enableDiscounted !== true) delete newPrice['discounted'];

        changePriceActions.push({
          action: 'changePrice',
          priceId: (oldObj as unknown as Price).id,
          price: newPrice,
        });
      }
      return;
    }

    if (getIsRemoveAction(key, price)) {
      // price removed
      removePriceActions.push({
        action: 'removePrice',
        priceId: (oldObj as unknown as Price).id,
      });
    }
  });

  return [addPriceActions, changePriceActions, removePriceActions];
}

function _buildProductAttributesActions(
  diffedAttributes: Delta,
  oldProductData: ProductVariant,
  newProductData: ProductVariant
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
        // Ignore pure array moves!
        if (value.length === 3 && value[2] === 3) return;

        let deltaValue = diffpatcher.getDeltaValue(value) as Partial<Attribute>;

        if (!deltaValue)
          if (value[0] && value[0].name)
            // unset attribute if
            deltaValue = { name: value[0].name };
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

function _buildVariantAttributesActions(
  attributes: Attribute,
  oldVariant: ProductVariant,
  newVariant: ProductVariant,
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
        // Ignore pure array moves!
        if (value.length === 3 && value[2] === 3) return;

        const { id } = oldVariant;

        let deltaValue = diffpatcher.getDeltaValue(value) as Partial<Attribute>;
        if (!deltaValue)
          if (value[0] && value[0].name)
            // unset attribute if
            deltaValue = { name: value[0].name };
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

function toAssetIdentifier(asset: Asset) {
  const assetIdentifier = asset.id
    ? { assetId: asset.id }
    : { assetKey: asset.key };
  return assetIdentifier;
}

function toVariantIdentifier(variant: ProductVariant) {
  const { id, sku } = variant;
  return id ? { variantId: id } : { sku };
}

function _buildVariantChangeAssetOrderAction(
  diffAssets: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant
) {
  const isAssetOrderChanged = Object.entries(diffAssets).find((entry) =>
    getIsItemMovedAction(entry[0], entry[1])
  );
  if (!isAssetOrderChanged) {
    return [];
  }
  const assetIdsBefore = oldVariant.assets.map((_) => _.id);
  const assetIdsCurrent = newVariant.assets
    .map((_) => _.id)
    .filter((_) => _ !== undefined);
  const assetIdsToKeep = intersection(assetIdsCurrent, assetIdsBefore);
  const assetIdsToRemove = without(assetIdsBefore, ...assetIdsToKeep);
  const changeAssetOrderAction = {
    action: 'changeAssetOrder',
    assetOrder: assetIdsToKeep.concat(assetIdsToRemove),
    ...toVariantIdentifier(oldVariant),
  };

  return [changeAssetOrderAction];
}

function _buildVariantAssetsActions(
  diffAssets: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant
) {
  const assetActions = [];

  // generate a hashMap to be able to reference the right asset from both ends
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
      // todo add changeAssetOrder
      const basicActions = buildBaseAttributesActions({
        actions: baseAssetActionsList,
        diff: asset,
        oldObj: oldAsset,
        newObj: newAsset,
      }).map((action) => {
        // in case of 'setAssetKey' then the identifier will be only 'assetId'
        if (action.action === 'setAssetKey') {
          return {
            ...action,
            ...toVariantIdentifier(oldVariant),
            assetId: (oldAsset as unknown as Asset).id,
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
    [ADD_ACTIONS]: (newObject: ProductVariant) => ({
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
    [REMOVE_ACTIONS]: ({ id }) => ({
      action: 'removeVariant',
      id,
    }),
  });
  return handler(diff, oldObj, newObj);
}

export function actionsMapReferences<T extends object>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  return buildReferenceActions({
    actions: referenceActionsList,
    diff,
    oldObj,
    newObj,
  });
}

export function actionsMapCategories(diff: Delta) {
  const actions: Array<UpdateAction> = [];
  if (!diff.categories) return actions;

  const addToCategoryActions = [];
  const removeFromCategoryActions = [];

  forEach(diff.categories, (category: Category) => {
    if (Array.isArray(category)) {
      const action = { category: category[0] };

      if (category.length === 3) {
        // Ignore pure array moves!
        if (category[2] !== 3) {
          action['action'] = 'removeFromCategory';
          removeFromCategoryActions.push(action);
        }
      } else if (category.length === 1) {
        action['action'] = 'addToCategory';
        addToCategoryActions.push(action);
      }
    }
  });

  // Make sure `removeFromCategory` actions come first
  return removeFromCategoryActions.concat(addToCategoryActions);
}

export function actionsMapCategoryOrderHints(diff: Delta, _oldObj: Category) {
  if (!diff.categoryOrderHints) return [];
  // Ignore this pattern as its means no changes happened [{},0,0]
  if (Array.isArray(diff.categoryOrderHints)) return [];

  return Object.keys(diff.categoryOrderHints).map((categoryId) => {
    const hintChange = diff.categoryOrderHints[categoryId];

    const action: ProductSetCategoryOrderHintAction = {
      action: 'setCategoryOrderHint',
      categoryId,
    };

    const updatedAction = clone(action);
    if (hintChange.length === 1)
      // item was added
      updatedAction.orderHint = hintChange[0];
    else if (hintChange.length === 2 && hintChange[1] !== 0)
      // item was changed
      updatedAction.orderHint = hintChange[1];

    // else item was removed -> do not set 'orderHint' property

    return updatedAction;
  });
}

export function actionsMapAssets<T extends object = ProductData>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  variantHashMap: object
): Array<UpdateAction> {
  let allAssetsActions = [];

  const { variants } = diff;

  if (variants)
    forEach(variants, (variant: ProductVariant, key: string) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        (oldObj as ProductData).variants,
        (newObj as ProductData).variants
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
  diffedProductData,
  oldProductData,
  newProductData
) {
  return _buildProductAttributesActions(
    diffedProductData.attributes,
    oldProductData,
    newProductData
  );
}

export function actionsMapAttributes(
  diff,
  oldObj,
  newObj,
  sameForAllAttributeNames = [],
  variantHashMap
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
      ) satisfies { oldObj: ProductVariant; newObj: ProductVariant };
      if (REGEX_NUMBER.test(key) && !Array.isArray(variant)) {
        const skuAction = _buildSkuActions(variant, oldVariant);
        const keyAction = _buildKeyActions(variant, oldVariant);
        if (skuAction) actions.push(skuAction);
        if (keyAction) actions.push(keyAction);

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

  // Ensure that an action is unique.
  // This is especially necessary for SFA attributes.
  return uniqWith(
    actions,
    (a, b) =>
      a.action === b.action && a.name === b.name && a.variantId === b.variantId
  );
}

export function actionsMapImages(diff, oldObj, newObj, variantHashMap) {
  let actions = [];
  const { variants } = diff;
  if (variants)
    forEach(variants, (variant, key) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        oldObj.variants,
        newObj.variants
      ) satisfies { oldObj: ProductVariant; newObj: ProductVariant };
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

export function actionsMapPrices(
  diff,
  oldObj,
  newObj,
  variantHashMap,
  enableDiscounted
) {
  let addPriceActions = [];
  let changePriceActions = [];
  let removePriceActions = [];

  const { variants } = diff;

  if (variants)
    forEach(variants, (variant, key) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        oldObj.variants,
        newObj.variants
      ) satisfies { oldObj: ProductVariant; newObj: ProductVariant };
      if (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key)) {
        const [addPriceAction, changePriceAction, removePriceAction] =
          _buildVariantPricesAction(
            variant.prices,
            oldVariant,
            newVariant,
            enableDiscounted
          );

        addPriceActions = addPriceActions.concat(addPriceAction);
        changePriceActions = changePriceActions.concat(changePriceAction);
        removePriceActions = removePriceActions.concat(removePriceAction);
      }
    });

  // price actions need to be in this below order
  return changePriceActions.concat(removePriceActions).concat(addPriceActions);
}

export function actionsMapPricesCustom(diff, oldObj, newObj, variantHashMap) {
  let actions = [];

  const { variants } = diff;

  if (variants)
    forEach(variants, (variant, key) => {
      const { oldObj: oldVariant, newObj: newVariant } = extractMatchingPairs(
        variantHashMap,
        key,
        oldObj.variants,
        newObj.variants
      ) satisfies { oldObj: ProductVariant; newObj: ProductVariant };

      if (
        variant &&
        variant.prices &&
        (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key))
      ) {
        const priceHashMap = findMatchingPairs(
          variant.prices,
          oldVariant.prices,
          newVariant.prices
        );

        forEach(variant.prices, (price: Price, index: string) => {
          const { oldObj: oldPrice, newObj: newPrice } = extractMatchingPairs(
            priceHashMap,
            index,
            oldVariant.prices,
            newVariant.prices
          );

          if (
            price.custom &&
            (REGEX_UNDERSCORE_NUMBER.test(index) || REGEX_NUMBER.test(index))
          ) {
            const generatedActions = actionsMapCustom(
              price,
              newPrice,
              oldPrice,
              {
                actions: {
                  setCustomType: 'setProductPriceCustomType',
                  setCustomField: 'setProductPriceCustomField',
                },
                //
                priceId: oldPrice.id,
              }
            );

            actions = actions.concat(generatedActions);
          }
        });
      }
    });

  return actions;
}

export function actionsMapMasterVariant(oldObj, newObj) {
  const createChangeMasterVariantAction = (variantId) => ({
    action: 'changeMasterVariant',
    variantId,
  });
  const extractMasterVariantId = (fromObj) => {
    const variants = Array.isArray(fromObj.variants) ? fromObj.variants : [];

    return variants[0] ? variants[0].id : undefined;
  };

  const newMasterVariantId = extractMasterVariantId(newObj);
  const oldMasterVariantId = extractMasterVariantId(oldObj);

  // Old and new master master variant differ and a new master variant id exists
  if (newMasterVariantId && oldMasterVariantId !== newMasterVariantId)
    return [createChangeMasterVariantAction(newMasterVariantId)];

  return [];
}
