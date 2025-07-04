import { buildBaseAttributesActions } from '../utils/common-actions';
import { Channel, Delta, SyncActionConfig, UpdateAction } from '../utils/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeKey', key: 'key' },
  { action: 'changeName', key: 'name' },
  { action: 'changeDescription', key: 'description' },
  { action: 'setAddress', key: 'address' },
  { action: 'setGeoLocation', key: 'geoLocation' },
  { action: 'setRoles', key: 'roles' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: Channel,
  newObj: Channel,
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
