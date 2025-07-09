import type {
  SyncAction,
  ActionGroup,
  UpdateAction,
  SyncActionConfig,
  Delta,
  AttributeGroupUpdateAction,
  AttributeGroup,
} from '../utils/types';
import {
  actionsMapBase,
  actionsMapAttributes,
} from './attribute-groups-actions';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as diffpatcher from '../utils/diffpatcher';

function createAttributeGroupsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions<U extends object>(
    diff: Delta,
    newObj: U,
    oldObj: U
  ) {
    const allActions: Array<Array<UpdateAction>> = [];

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    allActions.push(
      mapActionGroup(
        'attributes',
        (): Array<UpdateAction> =>
          actionsMapAttributes(
            diff,
            oldObj as AttributeGroup,
            newObj as AttributeGroup
          )
      ).flat()
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<AttributeGroup, AttributeGroupUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createAttributeGroupsMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions<object, AttributeGroupUpdateAction>(
    diffpatcher.diff,
    doMapActions as () => AttributeGroupUpdateAction[]
  );
  return { buildActions };
};
