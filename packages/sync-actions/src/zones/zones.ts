import type {
  SyncAction,
  ActionGroup,
  SyncActionConfig,
  UpdateAction,
  Delta,
  Zone,
  ZoneUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import * as zonesActions from './zones-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

export const actionGroups = ['base', 'locations'];

function createZonesMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (diff: object, next: Zone, previous: Zone) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: Zone,
    oldObj: Zone
  ): Array<UpdateAction> {
    const allActions = [];
    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          zonesActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );
    allActions.push(
      mapActionGroup(
        'locations',
        (): Array<UpdateAction> =>
          zonesActions.actionsMapLocations(diff, oldObj, newObj)
      ).flat()
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<Zone, ZoneUpdateAction> => {
  // config contains information about which action groups
  // are allowed or ignored

  // createMapActionGroup returns function 'mapActionGroup' that takes params:
  // - action group name
  // - callback function that should return a list of actions that correspond
  //    to the for the action group

  // this resulting function mapActionGroup will call the callback function
  // for allowed action groups and return the return value of the callback
  // It will return an empty array for ignored action groups
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createZonesMapActions(mapActionGroup, syncActionConfig);
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => ZoneUpdateAction[]
  );
  return { buildActions };
};
