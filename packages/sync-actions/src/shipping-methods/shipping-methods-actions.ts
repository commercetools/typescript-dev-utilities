import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils/create-build-array-actions';
import { buildBaseAttributesActions } from '../utils/common-actions';
import {
  Delta,
  ShippingMethod,
  SyncActionConfig,
  UpdateAction,
  ZoneRate,
} from '../utils/types';

export const baseActionsList = [
  { action: 'setKey', key: 'key' },
  { action: 'changeName', key: 'name' },
  { action: 'setLocalizedName', key: 'localizedName' },
  { action: 'setDescription', key: 'description' },
  { action: 'setLocalizedDescription', key: 'localizedDescription' },
  { action: 'changeIsDefault', key: 'isDefault' },
  { action: 'setPredicate', key: 'predicate' },
  { action: 'changeTaxCategory', key: 'taxCategory' },
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

const addShippingRates = (newZoneRate: ZoneRate): Array<UpdateAction> =>
  newZoneRate.shippingRates
    ? newZoneRate.shippingRates.map((shippingRate) => ({
        action: 'addShippingRate',
        zone: newZoneRate.zone,
        shippingRate,
      }))
    : [];

function actionsMapZoneRatesShippingRates(
  diff: Delta,
  oldObj: ZoneRate,
  newObj: ZoneRate
) {
  const handler = createBuildArrayActions('shippingRates', {
    [ADD_ACTIONS]: (newShippingRate: ZoneRate) => ({
      action: 'addShippingRate',
      zone: newObj.zone,
      shippingRate: newShippingRate,
    }),
    [REMOVE_ACTIONS]: (oldShippingRate: ZoneRate) => ({
      action: 'removeShippingRate',
      zone: oldObj.zone,
      shippingRate: oldShippingRate,
    }),
    [CHANGE_ACTIONS]: (
      oldShippingRate: ZoneRate,
      newShippingRate: ZoneRate
    ) => [
      {
        action: 'removeShippingRate',
        zone: oldObj.zone,
        shippingRate: oldShippingRate,
      },
      {
        action: 'addShippingRate',
        zone: newObj.zone,
        shippingRate: newShippingRate,
      },
    ],
  });

  return handler(diff, oldObj, newObj);
}

export function actionsMapZoneRates(
  diff: Delta,
  oldObj: ShippingMethod,
  newObj: ShippingMethod
) {
  const handler = createBuildArrayActions('zoneRates', {
    [ADD_ACTIONS]: (newZoneRate: ZoneRate) => [
      {
        action: 'addZone',
        zone: newZoneRate.zone,
      },
      ...addShippingRates(newZoneRate),
    ],
    [REMOVE_ACTIONS]: (oldZoneRate: ZoneRate) => ({
      action: 'removeZone',
      zone: oldZoneRate.zone,
    }),
    [CHANGE_ACTIONS]: (oldZoneRate: ZoneRate, newZoneRate: ZoneRate) => {
      let hasZoneActions = false;

      const shippingRateActions = Object.keys(diff.zoneRates).reduce(
        (actions, key) => {
          if (diff.zoneRates[key].zone) hasZoneActions = true;

          if (diff.zoneRates[key].shippingRates)
            return [
              ...actions,
              ...actionsMapZoneRatesShippingRates(
                diff.zoneRates[key],
                oldZoneRate,
                newZoneRate
              ),
            ];
          return actions;
        },
        []
      );

      return (
        hasZoneActions
          ? [
              ...shippingRateActions,
              ...[
                {
                  action: 'removeZone',
                  zone: oldZoneRate.zone,
                },
                {
                  action: 'addZone',
                  zone: newZoneRate.zone,
                },
              ],
            ]
          : shippingRateActions
      ).flat();
    },
  });

  return handler(diff, oldObj, newObj);
}
