import createBuildActions from '../utils-ts/create-build-actions';
import createMapActionGroup from '../utils-ts/create-map-action-group';
import * as typeActions from './types-actions';
import * as diffPatcher from '../utils-ts/diffpatcher';
import findMatchingPairs from '../utils-ts/find-matching-pairs';
import {
  ActionGroup,
  Delta,
  SyncAction,
  SyncActionConfig,
  Type,
  TypeUpdateAction,
  UpdateAction,
} from '../utils-ts/types';

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
  actionGroupList: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig
): SyncAction<Type, TypeUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createTypeMapActions(mapActionGroup, syncActionConfig);
  const buildActions = createBuildActions(diffPatcher.diff, doMapActions);
  return { buildActions };
};

export { actionGroups };
