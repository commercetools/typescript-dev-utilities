import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import { actionsMapBase } from './product-discounts-actions';
import combineValidityActions from '../utils-ts/combine-validity-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import {
  ActionGroup,
  Delta,
  ProductDiscount,
  ProductDiscountUpdateAction,
  SyncAction,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const actionGroups = ['base'];

function createProductDiscountsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions<T>(diff: Delta, newObj: T, oldObj: T) {
    const allActions: Array<Array<UpdateAction>> = [];

    allActions.push(
      mapActionGroup('base', () =>
        actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    return combineValidityActions(allActions.flat());
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<ProductDiscount, ProductDiscountUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createProductDiscountsMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
