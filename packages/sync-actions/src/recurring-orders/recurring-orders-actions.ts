import { Delta, Order, SyncActionConfig } from '../utils/types';
import { buildBaseAttributesActions } from '../utils/common-actions';

export const baseActionsList = [
  { action: 'setKey', key: 'key' },
  { action: 'setRecurringOrderState', key: 'recurringOrderState' },
  { action: 'transitionState', key: 'state' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: Order,
  newObj: Order,
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
