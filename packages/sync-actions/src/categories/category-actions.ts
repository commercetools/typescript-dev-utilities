import {
  buildBaseAttributesActions,
  buildReferenceActions,
} from '../utils-ts/common-actions';
import {
  Category,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeName', key: 'name' },
  { action: 'changeSlug', key: 'slug' },
  { action: 'setDescription', key: 'description' },
  { action: 'changeOrderHint', key: 'orderHint' },
  { action: 'setExternalId', key: 'externalId' },
  { action: 'setKey', key: 'key' },
];

export const metaActionsList: Array<UpdateAction> = [
  { action: 'setMetaTitle', key: 'metaTitle' },
  { action: 'setMetaKeywords', key: 'metaKeywords' },
  { action: 'setMetaDescription', key: 'metaDescription' },
];

export const referenceActionsList: Array<UpdateAction> = [
  { action: 'changeParent', key: 'parent' },
];

/**
 * SYNC FUNCTIONS
 */
export function actionsMapBase(
  diff: Delta,
  oldObj: Category,
  newObj: Category,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: baseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
    shouldPreventUnsettingRequiredFields:
      config.shouldPreventUnsettingRequiredFields,
  });
}

export function actionsMapReferences(
  diff: Delta,
  oldObj: Category,
  newObj: Category
) {
  return buildReferenceActions({
    actions: referenceActionsList,
    diff,
    oldObj,
    newObj,
  });
}

export function actionsMapMeta(
  diff: Delta,
  oldObj: Category,
  newObj: Category
) {
  return buildBaseAttributesActions({
    actions: metaActionsList,
    diff,
    oldObj,
    newObj,
  });
}
