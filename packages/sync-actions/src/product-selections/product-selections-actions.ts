import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import { Delta, ProductSelection, SyncActionConfig } from '../utils-ts/types';

export const baseActionsList = [
  { action: 'changeName', key: 'name' },
  { action: 'setKey', key: 'key' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: ProductSelection,
  newObj: ProductSelection,
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
