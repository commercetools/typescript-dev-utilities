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

function _buildAttributesActions(
  attributesDiff: Delta,
  oldVariant: ProductVariant,
  newVariant: ProductVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantAction> {
  const actions: Array<StandaloneVariantAction> = [];

  if (!attributesDiff) return actions;

  const oldAttributes = oldVariant.attributes || [];
  const newAttributes = newVariant.attributes || [];

  const oldAttributesMap: Record<string, unknown> = {};
  const newAttributesMap: Record<string, unknown> = {};

  oldAttributes.forEach((attr) => {
    if (attr && attr.name) {
      oldAttributesMap[attr.name] = attr.value;
    }
  });

  newAttributes.forEach((attr) => {
    if (attr && attr.name) {
      newAttributesMap[attr.name] = attr.value;
    }
  });

  const modifiedAttributes: Array<{ name: string; value: unknown }> = [];

  forEach(
    attributesDiff,
    (value: Attribute | Array<unknown>, key: string) => {
      if (REGEX_NUMBER.test(key)) {
        if (Array.isArray(value)) {
          const attr = diffpatcher.getDeltaValue(value) as Attribute;
          if (attr && attr.name) {
            modifiedAttributes.push({ name: attr.name, value: attr.value });
          }
        } else if (value && typeof value === 'object') {
          const attr = newAttributes[parseInt(key, 10)];
          if (attr && attr.name) {
            modifiedAttributes.push({ name: attr.name, value: attr.value });
          }
        }
      } else if (REGEX_UNDERSCORE_NUMBER.test(key)) {
        if (Array.isArray(value)) {
          if (value.length === 3 && (value[2] as number) === 3) return;

          const removedAttr = value[0] as Attribute;
          if (removedAttr && removedAttr.name) {
            const existsInNew = newAttributes.some(
              (a) => a && a.name === removedAttr.name
            );
            if (!existsInNew) {
              modifiedAttributes.push({
                name: removedAttr.name,
                value: null,
              });
            }
          }
        }
      }
    }
  );

  // Only generate setAttributes action if there are modified attributes
  if (modifiedAttributes.length > 0) {
    // Filter out null values for attributes that should be set
    const attributesToSet = modifiedAttributes
      .filter((attr) => attr.value !== null)
      .map((attr) =>
        convertAttributeToUpdateActionShape(attr as Attribute)
      );

    if (attributesToSet.length > 0) {
      const action: StandaloneVariantAction = {
        action: 'setAttributes',
        attributes: attributesToSet,
      };

      // Add staged flag if configured
      if (config.staged !== false) {
        action.staged = true;
      }

      actions.push(action);
    }

    // Handle removed attributes separately with setAttribute action (value: null)
    const attributesToUnset = modifiedAttributes.filter(
      (attr) => attr.value === null
    );
    attributesToUnset.forEach((attr) => {
      const action: StandaloneVariantAction = {
        action: 'setAttribute',
        name: attr.name,
        value: null,
      };

      if (config.staged !== false) {
        action.staged = true;
      }

      actions.push(action);
    });
  }

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
