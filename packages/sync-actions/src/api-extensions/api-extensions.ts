import type {
  SyncAction,
  ActionGroup,
  SyncActionConfig,
  Extension,
  ExtensionUpdateAction,
  MapActionGroup,
  Delta,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import { actionsMapBase } from './api-extensions-actions';
import * as diffpatcher from '../utils/diffpatcher';

export const actionGroups = ['base'];

const createApiExtensionsMapActions = (
  mapActionGroup: MapActionGroup,
  syncActionConfig: SyncActionConfig
) => {
  return function doMapActions(
    diff: Delta,
    newObj: Extension,
    oldObj: Extension
  ) {
    const allActions = [];

    allActions.push(
      mapActionGroup('base', () =>
        actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    return allActions.flat();
  };
};

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<Extension, ExtensionUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createApiExtensionsMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
