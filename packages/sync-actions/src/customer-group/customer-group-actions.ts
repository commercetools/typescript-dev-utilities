import {
  CustomerGroup,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';
import { buildBaseAttributesActions } from '../utils-ts/common-actions';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeName', key: 'name' },
  { action: 'setKey', key: 'key' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: CustomerGroup,
  newObj: CustomerGroup,
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
