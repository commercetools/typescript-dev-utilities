import createBuildArrayActions, {
  ADD_ACTIONS,
  CHANGE_ACTIONS,
  REMOVE_ACTIONS,
} from '../utils/create-build-array-actions';
import { buildBaseAttributesActions } from '../utils/common-actions';
import {
  Associate,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';

export const baseActionsList = [
  {
    action: 'setStores',
    key: 'stores',
  },
  { action: 'changeAssociateMode', key: 'associateMode' },
  { action: 'changeApprovalRuleMode', key: 'approvalRuleMode' },
  {
    action: 'changeName',
    key: 'name',
  },
  { action: 'changeParentUnit', key: 'parentUnit' },
  { action: 'changeStatus', key: 'status' },
  { action: 'setContactEmail', key: 'contactEmail' },
  { action: 'setStoreMode', key: 'storeMode' },
];

export const actionsMapAssociates = <T>(
  diff: Delta,
  oldObj: T,
  newObj: T
): Array<UpdateAction> => {
  const handler = createBuildArrayActions('associates', {
    [ADD_ACTIONS]: (newObject: Associate) => ({
      action: 'addAssociate',
      associate: newObject,
    }),
    [REMOVE_ACTIONS]: (objectToRemove: Associate) => ({
      action: 'removeAssociate',
      customer: {
        typeId: 'customer',
        id: objectToRemove.customer.id,
      },
    }),
    [CHANGE_ACTIONS]: (_oldObject: Associate, updatedObject: Associate) => ({
      action: 'changeAssociate',
      associate: updatedObject,
    }),
  });

  return handler(diff, oldObj, newObj);
};

export const actionsMapBase = <T>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  config: SyncActionConfig
) => {
  return buildBaseAttributesActions({
    actions: baseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config?.shouldOmitEmptyString,
  });
};
