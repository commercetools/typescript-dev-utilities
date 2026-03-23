import forEach from 'lodash.foreach';
import * as diffpatcher from '../utils/diffpatcher';
import {
  Attribute,
  Delta,
  ProductVariant,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';
import {
  REGEX_NUMBER,
  REGEX_UNDERSCORE_NUMBER,
} from '../utils/array-actions-utils';

export type StandaloneVariantAction = {
  action: string;
  key?: string;
  sku?: string;
  name?: string;
  value?: string | null;
  attributes?: Array<{ name: string; value?: string }>;
  staged?: boolean;
};

export const baseActionsList: Array<UpdateAction> = [
  { action: 'setKey', key: 'key' },
  { action: 'setSku', key: 'sku' },
];

function _buildKeyAction(
  variantDiff: Delta,
  oldVariant: ProductVariant
): StandaloneVariantAction | null {
  if ({}.hasOwnProperty.call(variantDiff, 'key')) {
    // getDeltaValue is typed as `object` but returns primitives at runtime,
    // requiring the cast through `unknown`
    const newValue = diffpatcher.getDeltaValue(variantDiff.key) as unknown as
      | string
      | undefined;
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
    const newValue = diffpatcher.getDeltaValue(variantDiff.sku) as unknown as
      | string
      | undefined;
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
