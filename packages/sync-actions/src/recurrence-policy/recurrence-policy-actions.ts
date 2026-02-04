import { Delta, RecurrencePolicy, SyncActionConfig } from '../utils/types';
import { buildBaseAttributesActions } from '../utils/common-actions';

export const baseActionsList = [
  { action: 'setKey', key: 'key' },
  { action: 'setName', key: 'name' },
  { action: 'setDescription', key: 'description' },
  { action: 'setSchedule', key: 'schedule' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: RecurrencePolicy,
  newObj: RecurrencePolicy,
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
