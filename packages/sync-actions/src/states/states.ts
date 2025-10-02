import type {
  UpdateAction,
  SyncAction,
  ActionGroup,
  SyncActionConfig,
  Delta,
  State,
  StateUpdateAction,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as stateActions from './state-actions';
import * as diffpatcher from '../utils/diffpatcher';

type RoleUpdate = {
  action: string;
  roles: Array<unknown>;
};

export const actionGroups = ['base'];

// This function groups `addRoles` and `removeRoles` actions to one array
function groupRoleActions([actions]: Array<UpdateAction>): Array<UpdateAction> {
  const addActionRoles = [];
  const removeActionRoles = [];
  (actions as unknown as RoleUpdate[]).forEach((action: UpdateAction) => {
    if (action.action === 'removeRoles') removeActionRoles.push(action.roles);
    if (action.action === 'addRoles') addActionRoles.push(action.roles);
  });
  return [
    { action: 'removeRoles', roles: removeActionRoles },
    { action: 'addRoles', roles: addActionRoles },
  ].filter((action: UpdateAction): number => action.roles.length);
}

function createStatesMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (diff: Delta, newObj: State, oldObj: State) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: State,
    oldObj: State
  ): Array<UpdateAction> {
    const baseActions = [];
    const roleActions = [];
    baseActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          stateActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );
    roleActions.push(
      mapActionGroup(
        'roles',
        (): Array<UpdateAction> =>
          stateActions.actionsMapRoles(diff, oldObj, newObj)
      )
    );

    return [...baseActions, ...groupRoleActions(roleActions)].flat();
  };
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<State, StateUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createStatesMapActions(mapActionGroup, syncActionConfig);
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => StateUpdateAction[]
  );

  return { buildActions };
};
