import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Quote,
  Delta,
  QuoteUpdateAction,
} from '../utils-ts/types';
import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import actionsMapCustom from '../utils-ts/action-map-custom';
import * as QuotesActions from './quotes-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';

const actionGroups = ['base', 'custom'];

function createQuotesMapActions<T extends Quote>(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (diff: Delta, newObj: T, oldObj: T, options: object) => Array<UpdateAction> {
  return function doMapActions<T extends Quote>(
    diff: Delta,
    newObj: T,
    oldObj: T
  ): Array<UpdateAction> {
    const allActions = [];

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          QuotesActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
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
  const doMapActions = createQuotesMapActions(mapActionGroup, syncActionConfig);

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => QuoteUpdateAction[]
  );

  return { buildActions };
};

export { actionGroups };
