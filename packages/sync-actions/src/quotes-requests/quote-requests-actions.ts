import { Delta, Quote, SyncActionConfig, UpdateAction } from '../utils/types';
import { buildBaseAttributesActions } from '../utils/common-actions';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeQuoteRequestState', key: 'quoteRequestState' },
  { action: 'transitionState', key: 'state' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: Quote,
  newObj: Quote,
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
