import type {
  SyncAction,
  ActionGroup,
  SyncActionConfig,
  Subscription,
  SubscriptionUpdateAction,
  UpdateAction,
  Delta,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as subscriptionsActions from './subscriptions-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

export const actionGroups = ['base'];

const createSubscriptionsMapActions = (
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) => {
  return function doMapActions(
    diff: Delta,
    newObj: Subscription,
    oldObj: Subscription
  ) {
    const allActions = [];

    allActions.push(
      mapActionGroup('base', () =>
        subscriptionsActions.actionsMapBase(
          diff,
          oldObj,
          newObj,
          syncActionConfig
        )
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
): SyncAction<Subscription, SubscriptionUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createSubscriptionsMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
