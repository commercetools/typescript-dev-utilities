import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils/create-build-array-actions';
import { buildBaseAttributesActions } from '../utils/common-actions';
import {
  Delta,
  Location,
  SyncActionConfig,
  UpdateAction,
  Zone,
} from '../utils/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeName', key: 'name' },
  { action: 'setDescription', key: 'description' },
  { action: 'setKey', key: 'key' },
];

const hasLocation = (
  locations: Array<Location>,
  otherLocation: Partial<Location>
) => locations.some((location) => location.country === otherLocation.country);

export function actionsMapBase(
  diff: Delta,
  oldObj: Zone,
  newObj: Zone,
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

export function actionsMapLocations(diff: Delta, oldObj: Zone, newObj: Zone) {
  const handler = createBuildArrayActions('locations', {
    [ADD_ACTIONS]: (newLocation: Partial<Location>) => ({
      action: 'addLocation',
      location: newLocation,
    }),
    [REMOVE_ACTIONS]: (oldLocation: Location) =>
      // We only add the action if the location is not included in the new object.
      !hasLocation(newObj.locations, oldLocation)
        ? {
            action: 'removeLocation',
            location: oldLocation,
          }
        : null,
    [CHANGE_ACTIONS]: (
      oldLocation: Location,
      newLocation: Partial<Location>
    ) => {
      const result = [];

      // We only remove the location in case that the oldLocation is not
      // included in the new object
      if (!hasLocation(newObj.locations, oldLocation))
        result.push({
          action: 'removeLocation',
          location: oldLocation,
        });

      // We only add the location in case that the newLocation was not
      // included in the old object
      if (!hasLocation(oldObj.locations, newLocation))
        result.push({
          action: 'addLocation',
          location: newLocation,
        });

      return result;
    },
  });

  return handler(diff, oldObj, newObj);
}
