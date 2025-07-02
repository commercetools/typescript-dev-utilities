import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import { Delta, Extension, SyncActionConfig } from '../utils-ts/types';

export const baseActionsList = [
  { action: 'setKey', key: 'key' },
  { action: 'changeTriggers', key: 'triggers' },
  { action: 'setTimeoutInMs', key: 'timeoutInMs' },
  { action: 'changeDestination', key: 'destination' },
];

export const actionsMapBase = <T extends Extension>(
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
