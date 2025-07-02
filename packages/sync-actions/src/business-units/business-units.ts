import type {
  SyncAction,
  ActionGroup,
  SyncActionConfig,
  BusinessUnit,
  BusinessUnitUpdateAction,
  Delta,
  UpdateAction,
  Customer,
} from '../utils-ts/types';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import createBuildActions from '../utils-ts/create-build-actions';
import * as customerActions from '../customers/customer-actions';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as businessUnitActions from './business-units-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

const createCustomerMapActions = (
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) => {
  return function doMapActions<T extends Customer>(
    diff: Delta,
    newObj: T,
    oldObj: T
  ) {
    const allActions: Array<Array<UpdateAction>> = [];

    allActions.push(
      mapActionGroup('base', () =>
        businessUnitActions.actionsMapBase<BusinessUnit>(
          diff,
          oldObj as unknown as BusinessUnit,
          newObj as unknown as BusinessUnit,
          syncActionConfig
        )
      )
    );

    allActions.push(
      mapActionGroup('addresses', () =>
        customerActions.actionsMapAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup('base', () =>
        customerActions.actionsMapSetDefaultBase(
          diff,
          oldObj as Customer,
          newObj as Customer,
          syncActionConfig
        )
      )
    );

    allActions.push(
      mapActionGroup('billingAddressIds', () =>
        customerActions.actionsMapBillingAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup('shippingAddressIds', () =>
        customerActions.actionsMapShippingAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup('associates', () =>
        businessUnitActions.actionsMapAssociates(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup('custom', () => actionsMapCustom(diff, newObj, oldObj))
    );

    return allActions.flat();
  };
};

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<BusinessUnit, BusinessUnitUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createCustomerMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => BusinessUnitUpdateAction[]
  );
  return { buildActions };
};
