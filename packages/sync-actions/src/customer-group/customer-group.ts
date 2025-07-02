import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import { actionsMapBase } from './customer-group-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import {
  Delta,
  ActionGroup,
  CustomerGroup,
  SyncActionConfig,
  UpdateAction,
  SyncAction,
  CustomerGroupUpdateAction,
} from '../utils-ts/types';

export const actionGroups = ['base', 'custom'];

function createCustomerGroupMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions(
    diff: Delta,
    newObj: CustomerGroup,
    oldObj: CustomerGroup
  ) {
    const allActions = [];

    allActions.push(
      mapActionGroup('base', () =>
        actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    allActions.push(
      mapActionGroup('custom', () => actionsMapCustom(diff, newObj, oldObj))
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<CustomerGroup, CustomerGroupUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createCustomerGroupMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
