import type {
  SyncAction,
  UpdateAction,
  ActionGroup,
  SyncActionConfig,
  StoreUpdateAction,
  Store,
  Delta,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import actionsMapCustom from '../utils/action-map-custom';
import * as storesActions from './stores-actions';
import * as diffpatcher from '../utils/diffpatcher';

export const actionGroups = ['base'];

function createStoresMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>
): (
  diff: Delta,
  next: object,
  previous: object,
  options: object
) => Array<UpdateAction> {
  return function doMapActions(
    diff: object,
    next: object,
    previous: object
  ): Array<UpdateAction> {
    const allActions = [];
    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          storesActions.actionsMapBase(diff, previous, next)
      )
    );
    allActions.push(
      mapActionGroup(
        'custom',
        (): Array<UpdateAction> => actionsMapCustom(diff, next, previous)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  options: SyncActionConfig = {}
): SyncAction<Store, StoreUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createStoresMapActions(mapActionGroup);
  const onBeforeApplyingDiff = null;
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => StoreUpdateAction[],
    onBeforeApplyingDiff,
    options
  );

  return { buildActions };
};
