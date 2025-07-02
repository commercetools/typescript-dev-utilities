import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Delta,
  StandalonePrice,
  StandalonePriceUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as pricesActions from './prices-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import combineValidityActions from '../utils-ts/combine-validity-actions';

export const actionGroups = ['base', 'custom'];

function createPriceMapActions<T extends object>(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: T,
  oldObj: T,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions<T extends object>(
    diff: Delta,
    newObj: T,
    oldObj: T
  ): Array<UpdateAction> {
    const baseActions = mapActionGroup(
      'base',
      (): Array<UpdateAction> =>
        pricesActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
    );

    const customActions = mapActionGroup(
      'custom',
      (): Array<UpdateAction> => actionsMapCustom(diff, newObj, oldObj)
    );

    return combineValidityActions([...baseActions, ...customActions]);
  };
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<StandalonePrice, StandalonePriceUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createPriceMapActions(mapActionGroup, syncActionConfig);

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => []
  );

  return { buildActions };
};
