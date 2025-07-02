import {
  buildBaseAttributesActions,
  buildReferenceActions,
} from '../utils-ts/common-actions';
import {
  Delta,
  InventoryEntry,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeQuantity', key: 'quantityOnStock', actionKey: 'quantity' },
  { action: 'setRestockableInDays', key: 'restockableInDays' },
  { action: 'setExpectedDelivery', key: 'expectedDelivery' },
];

export const referenceActionsList: Array<UpdateAction> = [
  { action: 'setSupplyChannel', key: 'supplyChannel' },
];

/**
 * SYNC FUNCTIONS
 */
export function actionsMapBase(
  diff: Delta,
  oldObj: InventoryEntry,
  newObj: InventoryEntry,
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
  oldObj: InventoryEntry,
  newObj: InventoryEntry
) {
  return buildReferenceActions({
    actions: referenceActionsList,
    diff,
    oldObj,
    newObj,
  });
}
