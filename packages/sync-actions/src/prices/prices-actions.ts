import {
  Delta,
  StandalonePrice,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';
import { buildBaseAttributesActions } from '../utils/common-actions';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeValue', key: 'value' },
  { action: 'setDiscountedPrice', key: 'discounted' },
  // TODO: Later add more accurate actions `addPriceTier`, `removePriceTier`
  { action: 'setPriceTiers', key: 'tiers' },
  { action: 'setKey', key: 'key' },
  { action: 'setValidFrom', key: 'validFrom' },
  { action: 'setValidUntil', key: 'validUntil' },
  { action: 'changeActive', key: 'active' },
];

export function actionsMapBase<T>(
  diff: Delta,
  oldObj: T,
  newObj: T,
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

export function actionsMapStaged(
  diff: Delta,
  oldObj: Partial<StandalonePrice>,
  newObj: Partial<StandalonePrice>,
  config: SyncActionConfig = {}
) {
  if (!diff || !diff.staged) return [];

  const hasNewStaged = newObj && newObj.staged != null;
  const hadOldStaged = oldObj && oldObj.staged != null;

  if (!hasNewStaged && hadOldStaged) {
    if (config.shouldUnsetOmittedProperties)
      return [{ action: 'removeStagedChanges' }];
    return [];
  }

  if (hasNewStaged && newObj.staged.value)
    return [
      {
        action: 'changeValue',
        value: newObj.staged.value,
        staged: true,
      },
    ];

  return [];
}
