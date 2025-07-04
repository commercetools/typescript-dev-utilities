import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
} from '../utils/create-build-array-actions';
import { buildBaseAttributesActions } from '../utils/common-actions';
import { Delta, State, SyncActionConfig, UpdateAction } from '../utils/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeKey', key: 'key' },
  { action: 'setName', key: 'name' },
  { action: 'setDescription', key: 'description' },
  { action: 'changeType', key: 'type' },
  { action: 'changeInitial', key: 'initial' },
  { action: 'setTransitions', key: 'transitions' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: State,
  newObj: State,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: baseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
    shouldPreventUnsettingRequiredFields:
      config.shouldPreventUnsettingRequiredFields,
  });
}

export function actionsMapRoles(diff: Delta, oldObj: State, newObj: State) {
  const buildArrayActions = createBuildArrayActions('roles', {
    [ADD_ACTIONS]: (newRole: Partial<State>) => ({
      action: 'addRoles',
      roles: newRole,
    }),
    [REMOVE_ACTIONS]: (oldRole: Partial<State>) => ({
      action: 'removeRoles',
      roles: oldRole,
    }),
  });

  return buildArrayActions(diff, oldObj, newObj);
}
