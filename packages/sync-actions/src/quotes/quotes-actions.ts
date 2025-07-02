import {
  Delta,
  Quote,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';
import { buildBaseAttributesActions } from '../utils-ts/common-actions';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeQuoteState', key: 'quoteState' },
  { action: 'requestQuoteRenegotiation', key: 'buyerComment' },
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
