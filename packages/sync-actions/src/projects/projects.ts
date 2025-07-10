import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import {
  actionsMapBase,
  actionsMapBusinessUnit,
  actionsMapSearchIndexingConfiguration,
} from './projects-actions';
import * as diffpatcher from '../utils/diffpatcher';
import {
  ActionGroup,
  Delta,
  Project,
  ProjectUpdateAction,
  SyncAction,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';

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
  actionGroupList?: Array<ActionGroup>,
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
