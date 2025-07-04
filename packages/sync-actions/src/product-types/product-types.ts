import type {
  SyncAction,
  UpdateAction,
  ActionGroup,
  SyncActionConfig,
  Delta,
  ProductType,
  ProductTypeUpdateAction,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as productTypeActions from './product-types-actions';
import * as diffpatcher from '../utils/diffpatcher';

export const actionGroups = ['base'];

function createProductTypeMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  next: ProductType,
  previous: ProductType,
  options: object
) => Array<UpdateAction> {
  return function doMapActions<T extends ProductType>(
    diff: Delta,
    next: T,
    previous: T,
    options: object & { nestedValuesChanges: object }
  ): Array<UpdateAction> {
    return [
      // we support only base fields for the product type,
      // for attributes, applying hints would be recommended
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          productTypeActions.actionsMapBase(
            diff,
            previous,
            next,
            syncActionConfig
          )
      ),
      productTypeActions.actionsMapForHints(
        options.nestedValuesChanges,
        previous,
        next
      ),
    ].flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<ProductType, ProductTypeUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createProductTypeMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const onBeforeApplyingDiff = null;
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => [],
    onBeforeApplyingDiff,
    { withHints: true }
  );

  return { buildActions };
};
