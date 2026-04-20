import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  RecurrencePolicyUpdateAction,
  RecurrencePolicy,
  Delta,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as RecurrencePolicyActions from './recurrence-policy-actions';
import * as diffpatcher from '../utils/diffpatcher';

export const actionGroups = ['base'];

function createRecurrencePolicyMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: RecurrencePolicy,
  oldObj: RecurrencePolicy,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: RecurrencePolicy,
    oldObj: RecurrencePolicy
  ): Array<UpdateAction> {
    const allActions = [];

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          RecurrencePolicyActions.actionsMapBase(
            diff,
            oldObj,
            newObj,
            syncActionConfig
          )
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<RecurrencePolicy, RecurrencePolicyUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createRecurrencePolicyMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => RecurrencePolicyUpdateAction[]
  );

  return { buildActions };
};
