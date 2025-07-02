import type {
  SyncAction,
  UpdateAction,
  ActionGroup,
  Delta,
  ProductSelection,
  SyncActionConfig,
  ProductSelectionUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as productSelectionsActions from './product-selections-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

export const actionGroups = ['base'];

function createProductSelectionsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>
): (
  diff: Delta,
  next: ProductSelection,
  previous: ProductSelection,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    next: ProductSelection,
    previous: ProductSelection
  ): Array<UpdateAction> {
    const allActions: Array<Array<UpdateAction>> = [];
    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          productSelectionsActions.actionsMapBase(diff, previous, next)
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
  actionGroupList: Array<ActionGroup>
): SyncAction<ProductSelection, ProductSelectionUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createProductSelectionsMapActions(mapActionGroup);
  const onBeforeApplyingDiff = null;
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => ProductSelectionUpdateAction[],
    onBeforeApplyingDiff
  );

  return { buildActions };
};
