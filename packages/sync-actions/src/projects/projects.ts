import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import {
  actionsMapBase,
  actionsMapBusinessUnit,
  actionsMapSearchIndexingConfiguration,
} from './projects-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import {
  ActionGroup,
  Delta,
  Project,
  ProjectUpdateAction,
  SyncAction,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const actionGroups = [
  'base',
  'businessUnit',
  'searchIndexingConfiguration',
];

function createChannelsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions(diff: Delta, newObj: Project, oldObj: Project) {
    const allActions = [];

    allActions.push(
      mapActionGroup('base', () =>
        actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    allActions.push(
      mapActionGroup('businessUnit', () =>
        actionsMapBusinessUnit(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup('searchIndexingConfiguration', () =>
        actionsMapSearchIndexingConfiguration(diff, oldObj, newObj)
      )
    );

    return allActions.flat();
  };
}

export default (
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<Project, ProjectUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createChannelsMapActions(
    mapActionGroup,
    syncActionConfig
  );
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions);
  return { buildActions };
};
