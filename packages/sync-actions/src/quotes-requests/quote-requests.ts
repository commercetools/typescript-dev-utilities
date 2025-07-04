import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Delta,
  Quote,
  QuoteUpdateAction,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import actionsMapCustom from '../utils/action-map-custom';
import * as QuoteRequestsActions from './quote-requests-actions';
import * as diffpatcher from '../utils/diffpatcher';

export const actionGroups = ['base', 'custom'];

function createQuoteRequestsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: Quote,
  oldObj: Quote,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: Quote,
    oldObj: Quote
  ): Array<UpdateAction> {
    const allActions = [];

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          QuoteRequestsActions.actionsMapBase(
            diff,
            oldObj,
            newObj,
            syncActionConfig
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'custom',
        (): Array<UpdateAction> => actionsMapCustom(diff, newObj, oldObj)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<Quote, QuoteUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createQuoteRequestsMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => QuoteUpdateAction[]
  );

  return { buildActions };
};
