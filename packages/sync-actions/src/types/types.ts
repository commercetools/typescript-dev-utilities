import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as typeActions from './types-actions';
import * as diffPatcher from '../utils/diffpatcher';
import findMatchingPairs from '../utils/find-matching-pairs';
import {
  ActionGroup,
  Delta,
  SyncAction,
  SyncActionConfig,
  Type,
  TypeUpdateAction,
  UpdateAction,
} from '../utils/types';

const actionGroups = ['base', 'fieldDefinitions'];

function createTypeMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions(diff: Delta, next: Type & {}, previous) {
    const allActions = [];
    allActions.push(
      mapActionGroup('base', () =>
        typeActions.actionsMapBase(diff, previous, next, syncActionConfig)
      ),
      mapActionGroup('fieldDefinitions', () =>
        typeActions.actionsMapFieldDefinitions(
          diff.fieldDefinitions,
          previous.fieldDefinitions,
          next.fieldDefinitions,
          findMatchingPairs(
            diff.fieldDefinitions,
            previous.fieldDefinitions,
            next.fieldDefinitions,
            'name'
          )
        )
      )
    );
    return allActions.flat();
  };
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<Type, TypeUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createTypeMapActions(mapActionGroup, syncActionConfig);
  const buildActions = createBuildActions(diffPatcher.diff, doMapActions);
  return { buildActions };
};

export { actionGroups };
