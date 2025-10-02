import { buildBaseAttributesActions } from '../utils/common-actions';
import { Delta, SyncActionConfig } from '../utils/types';

export const baseActionsList = [
  { action: 'changeIsActive', key: 'isActive' },
  { action: 'changeName', key: 'name' },
  { action: 'changePredicate', key: 'predicate' },
  { action: 'changeSortOrder', key: 'sortOrder' },
  { action: 'changeValue', key: 'value' },
  { action: 'setDescription', key: 'description' },
  { action: 'setValidFrom', key: 'validFrom' },
  { action: 'setValidUntil', key: 'validUntil' },
  { action: 'setKey', key: 'key' },
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
