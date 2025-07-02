import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Delta,
  ShippingMethod,
  ShippingMethodUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as shippingMethodsActions from './shipping-methods-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

export const actionGroups = ['base', 'zoneRates', 'custom'];

function createShippingMethodsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: ShippingMethod,
  oldObj: ShippingMethod
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: ShippingMethod,
    oldObj: ShippingMethod
  ): Array<UpdateAction> {
    const allActions: Array<Array<UpdateAction>> = [];
    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          shippingMethodsActions.actionsMapBase(
            diff,
            oldObj,
            newObj,
            syncActionConfig
          )
      )
    );
    allActions.push(
      mapActionGroup(
        'zoneRates',
        (): Array<UpdateAction> =>
          shippingMethodsActions.actionsMapZoneRates(diff, oldObj, newObj)
      ).flat()
    );
    allActions.push(
      mapActionGroup(
        'custom',
        (): Array<UpdateAction> => actionsMapCustom(diff, newObj, oldObj)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<ShippingMethod, ShippingMethodUpdateAction> => {
  // actionGroupList contains information about which action groups
  // are allowed or ignored

  // createMapActionGroup returns function 'mapActionGroup' that takes params:
  // - action group name
  // - callback function that should return a list of actions that correspond
  //    to the for the action group

  // this resulting function mapActionGroup will call the callback function
  // for allowed action groups and return the return value of the callback
  // It will return an empty array for ignored action groups
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createShippingMethodsMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => ShippingMethodUpdateAction[]
  );
  return { buildActions };
};
