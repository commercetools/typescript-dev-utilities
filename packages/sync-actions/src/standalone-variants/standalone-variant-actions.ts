import * as diffpatcher from '../utils/diffpatcher';
import {
  Asset,
  Attribute,
  Delta,
  Image,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';

export type StandaloneVariant = {
  id?: string | number;
  key?: string;
  sku?: string;
  attributes?: Attribute[];
  images?: Image[];
  assets?: Asset[];
};

export type StandaloneVariantUpdateAction = UpdateAction & {
  staged?: boolean;
  attributes?: Array<{ name: string; value?: string }>;
};

/**
 * Converts an attribute to the format required by the setAttributes action.
 * The value is JSON stringified as required by the API.
 */
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

/**
 * Creates a staged action with the given action name and payload.
 * Automatically adds staged: true unless config.staged is false.
 */
function _buildStagedAction<T extends Record<string, unknown>>(
  actionName: string,
  payload: T,
  config: SyncActionConfig = {}
): StandaloneVariantUpdateAction {
  const action: StandaloneVariantUpdateAction = {
    action: actionName,
    ...payload,
  };

  if (config.staged !== false) {
    action.staged = true;
  }

  return action;
}

function _buildKeyAction(
  variantDiff: Delta,
  oldVariant: StandaloneVariant
): StandaloneVariantUpdateAction | null {
  if ({}.hasOwnProperty.call(variantDiff, 'key')) {
    const newValue = diffpatcher.getDeltaValue(
      variantDiff.key
    ) as unknown as string | undefined;
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
  oldVariant: StandaloneVariant,
  config: SyncActionConfig = {}
): StandaloneVariantUpdateAction | null {
  if ({}.hasOwnProperty.call(variantDiff, 'sku')) {
    const newValue = diffpatcher.getDeltaValue(
      variantDiff.sku
    ) as unknown as string | undefined;
    if (!newValue && !oldVariant.sku) return null;

    return _buildStagedAction('setSku', { sku: newValue || undefined }, config);
  }
  return null;
}

/**
 * Maps base actions (setKey, setSku) for standalone variants.
 * Analyzes the diff between old and new variant and generates appropriate actions.
 *
 * Accepts flat variant objects directly (not wrapped in a variants array).
 */
export function actionsMapBase(
  diff: Delta,
  oldVariant: StandaloneVariant,
  _newVariant: StandaloneVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantUpdateAction> {
  const actions: Array<StandaloneVariantUpdateAction> = [];

  if (!oldVariant || !diff) {
    return actions;
  }

  const keyAction = _buildKeyAction(diff, oldVariant);
  if (keyAction) {
    actions.push(keyAction);
  }

  const skuAction = _buildSkuAction(diff, oldVariant, config);
  if (skuAction) {
    actions.push(skuAction);
  }

  return actions;
}

/**
 * Maps attribute actions for standalone variants.
 * Generates a single setAttributes action when attributes have changed.
 */
export function actionsMapAttributes(
  diff: Delta,
  _oldVariant: StandaloneVariant,
  newVariant: StandaloneVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantUpdateAction> {
  if (!diff?.attributes) {
    return [];
  }

  const attributes = (newVariant.attributes || []).map(
    convertAttributeToUpdateActionShape
  );
  return [_buildStagedAction('setAttributes', { attributes }, config)];
}

/**
 * Maps image actions for standalone variants.
 * Generates a single setImages action when images have changed.
 */
export function actionsMapImages(
  diff: Delta,
  _oldVariant: StandaloneVariant,
  newVariant: StandaloneVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantUpdateAction> {
  if (!diff?.images) {
    return [];
  }

  const images = newVariant.images || [];
  return [_buildStagedAction('setImages', { images }, config)];
}

/**
 * Maps asset actions for standalone variants.
 * Generates a single setAssets action when assets have changed.
 */
export function actionsMapAssets(
  diff: Delta,
  _oldVariant: StandaloneVariant,
  newVariant: StandaloneVariant,
  config: SyncActionConfig = {}
): Array<StandaloneVariantUpdateAction> {
  if (!diff?.assets) {
    return [];
  }

  const assets = newVariant.assets || [];
  return [_buildStagedAction('setAssets', { assets }, config)];
}

/**
 * Builds a publish action for standalone variants.
 */
export function buildPublishAction(): StandaloneVariantUpdateAction {
  return { action: 'publish' };
}

/**
 * Builds an unpublish action for standalone variants.
 */
export function buildUnpublishAction(): StandaloneVariantUpdateAction {
  return { action: 'unpublish' };
}

/**
 * Builds a removeStagedChanges action for standalone variants.
 */
export function buildRemoveStagedChangesAction(): StandaloneVariantUpdateAction {
  return { action: 'removeStagedChanges' };
}
