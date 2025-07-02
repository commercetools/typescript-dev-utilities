import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import { actionsMapBase } from './cart-discounts-actions';
import combineValidityActions from '../utils-ts/combine-validity-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import {
  ActionGroup,
  CartDiscount,
  CartDiscountUpdateAction,
  Delta,
  SyncAction,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const actionGroups = ['base', 'custom'];

function createCartDiscountsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions(
    diff: Delta,
    newObj: CartDiscount,
    oldObj: CartDiscount
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

    return combineValidityActions(allActions.flat());
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<CartDiscount, CartDiscountUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createCartDiscountsMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
