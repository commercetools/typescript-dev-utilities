import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import { Delta, SyncActionConfig, UpdateAction } from '../utils-ts/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'setName', key: 'name' },
  { action: 'setLanguages', key: 'languages' },
  { action: 'setDistributionChannels', key: 'distributionChannels' },
  { action: 'setSupplyChannels', key: 'supplyChannels' },
];

export function actionsMapBase<T extends object>(
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
