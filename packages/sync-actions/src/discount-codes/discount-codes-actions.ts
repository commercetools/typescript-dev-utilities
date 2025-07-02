import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import {
  Delta,
  DiscountCode,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeIsActive', key: 'isActive' },
  { action: 'setName', key: 'name' },
  { action: 'setDescription', key: 'description' },
  { action: 'setKey', key: 'key' },
  { action: 'setCartPredicate', key: 'cartPredicate' },
  { action: 'setMaxApplications', key: 'maxApplications' },
  {
    action: 'setMaxApplicationsPerCustomer',
    key: 'maxApplicationsPerCustomer',
  },
  { action: 'changeCartDiscounts', key: 'cartDiscounts' },
  { action: 'setValidFrom', key: 'validFrom' },
  { action: 'setValidUntil', key: 'validUntil' },
  { action: 'changeGroups', key: 'groups' },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: DiscountCode,
  newObj: DiscountCode,
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
