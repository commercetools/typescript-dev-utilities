import {
  Delta,
  Subscription,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';
import { buildBaseAttributesActions } from '../utils/common-actions';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'setKey', key: 'key' },
  { action: 'setMessages', key: 'messages' },
  { action: 'setChanges', key: 'changes' },
  { action: 'changeDestination', key: 'destination' },
];

export const actionsMapBase = (
  diff: Delta,
  oldObj: Subscription,
  newObj: Subscription,
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
