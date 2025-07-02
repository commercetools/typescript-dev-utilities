import type {
  SyncAction,
  ActionGroup,
  UpdateAction,
  SyncActionConfig,
  TaxCategory,
  Delta,
  TaxCategoryUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import * as taxCategoriesActions from './tax-categories-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

export const actionGroups = ['base', 'rates'];

function createTaxCategoriesMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: TaxCategory,
  oldObj: TaxCategory
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: TaxCategory,
    oldObj: TaxCategory
  ): Array<UpdateAction> {
    const allActions = [];
    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          taxCategoriesActions.actionsMapBase(
            diff,
            oldObj,
            newObj,
            syncActionConfig
          )
      )
    );
    allActions.push(
      mapActionGroup(
        'rates',
        (): Array<UpdateAction> =>
          taxCategoriesActions.actionsMapRates(diff, oldObj, newObj)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<TaxCategory, TaxCategoryUpdateAction> => {
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
  const doMapActions = createTaxCategoriesMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => TaxCategoryUpdateAction[]
  );
  return { buildActions };
};
