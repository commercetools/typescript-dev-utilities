import type {
  SyncAction,
  SyncActionConfig,
  UpdateAction,
  ActionGroup,
  Customer,
  Delta,
  CustomerUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as customerActions from './customer-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import copyEmptyArrayProps from '../utils-ts/copy-empty-array-props';

export const actionGroups: Array<string> = [
  'base',
  'references',
  'addresses',
  'custom',
  'authenticationModes',
];

function createCustomerMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (diff: Delta, newObj: Customer, oldObj: Customer) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: Customer,
    oldObj: Customer /* , options */
  ): Array<UpdateAction> {
    const allActions = [];

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          customerActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    allActions.push(
      mapActionGroup(
        'references',
        (): Array<UpdateAction> =>
          customerActions.actionsMapReferences(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'addresses',
        (): Array<UpdateAction> =>
          customerActions.actionsMapAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          customerActions.actionsMapSetDefaultBase(
            diff,
            oldObj,
            newObj,
            syncActionConfig
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'billingAddressIds',
        (): Array<UpdateAction> =>
          customerActions.actionsMapBillingAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'shippingAddressIds',
        (): Array<UpdateAction> =>
          customerActions.actionsMapShippingAddresses(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'custom',
        (): Array<UpdateAction> => actionsMapCustom(diff, newObj, oldObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'authenticationModes',
        (): Array<UpdateAction> =>
          customerActions.actionsMapAuthenticationModes(diff, oldObj, newObj)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<Customer, CustomerUpdateAction> => {
  // actionGroupList contains information about which action groups
  // are allowed or ignored

  // createMapActionGroup returns function 'mapActionGroup' that takes params:
  // - action group name
  // - callback function that should return a list of actions that correspond
  //    to the for the action group

  // this resulting function mapActionGroup will call the callback function
  // for allowed action groups and return the return value of the callback
  // It will return an empty array for ignored action groups
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createCustomerMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => CustomerUpdateAction[],
    copyEmptyArrayProps
  );
  return { buildActions };
};
