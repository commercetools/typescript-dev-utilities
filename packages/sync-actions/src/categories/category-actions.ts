import {
  buildBaseAttributesActions,
  buildReferenceActions,
} from '../utils/common-actions';
import {
  Category,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';

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

type StoreRef = { key?: string; id?: string };

const getStoreIdentifier = (store: StoreRef) => store?.key ?? store?.id;

/**
 * `stores` is an unordered set of store references, so it is compared by
 * store key (falling back to id) rather than by array position.
 * `addStore` actions come first so the Category never transiently becomes
 * global (empty `stores`) when replacing stores.
 */
export function actionsMapStores(
  diff: Delta,
  oldObj: Category,
  newObj: Category
): Array<UpdateAction> {
  if (!diff.stores) return [];

  const oldStores: Array<StoreRef> = oldObj.stores || [];
  const newStores: Array<StoreRef> = newObj.stores || [];
  const oldIds = new Set(oldStores.map(getStoreIdentifier));
  const newIds = new Set(newStores.map(getStoreIdentifier));

  const toStoreIdentifier = ({ key, id }: StoreRef) =>
    key ? { typeId: 'store', key } : { typeId: 'store', id };

  const addActions = newStores
    .filter((store) => !oldIds.has(getStoreIdentifier(store)))
    .map((store) => ({ action: 'addStore', store: toStoreIdentifier(store) }));

  const removeActions = oldStores
    .filter((store) => !newIds.has(getStoreIdentifier(store)))
    .map((store) => ({
      action: 'removeStore',
      store: toStoreIdentifier(store),
    }));

  return [...addActions, ...removeActions];
}

export function actionsMapReferences(
  diff: Delta,
  oldObj: Category,
  newObj: Category
) {
  return [
    ...buildReferenceActions({
      actions: referenceActionsList,
      diff,
      oldObj,
      newObj,
    }),
    ...actionsMapStores(diff, oldObj, newObj),
  ];
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
