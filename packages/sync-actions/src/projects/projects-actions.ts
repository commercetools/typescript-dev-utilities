import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import {
  Delta,
  Project,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

export const baseActionsList: Array<UpdateAction> = [
  { action: 'changeName', key: 'name' },
  { action: 'changeCurrencies', key: 'currencies' },
  { action: 'changeCountries', key: 'countries' },
  { action: 'changeLanguages', key: 'languages' },
  { action: 'changeMessagesConfiguration', key: 'messagesConfiguration' },
  { action: 'setShippingRateInputType', key: 'shippingRateInputType' },
];

export const myBusinessUnitActionsList: Array<UpdateAction> = [
  {
    action: 'changeMyBusinessUnitStatusOnCreation',
    key: 'myBusinessUnitStatusOnCreation',
    actionKey: 'status',
  },
  {
    action: 'setMyBusinessUnitAssociateRoleOnCreation',
    key: 'myBusinessUnitAssociateRoleOnCreation',
    actionKey: 'associateRole',
  },
];

export const customerSearchActionsList: Array<UpdateAction> = [
  {
    action: 'changeCustomerSearchStatus',
    key: 'status',
  },
];

export const businessUnitSearchActionsList: Array<UpdateAction> = [
  {
    action: 'changeBusinessUnitSearchStatus',
    key: 'status',
  },
];

export function actionsMapBase(
  diff: Delta,
  oldObj: Project,
  newObj: Project,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: baseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
  });
}

export const actionsMapBusinessUnit = (
  diff: Delta,
  oldObj: Project,
  newObj: Project,
  config: SyncActionConfig = {}
) => {
  const { businessUnits } = diff;
  if (!businessUnits) {
    return [];
  }

  return buildBaseAttributesActions({
    actions: myBusinessUnitActionsList,
    diff: businessUnits,
    oldObj: oldObj.businessUnits,
    newObj: newObj.businessUnits,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
  });
};

export function actionsMapSearchIndexingConfiguration(
  diff: Delta,
  oldObj: Project,
  newObj: Project,
  config: SyncActionConfig = {}
) {
  const { searchIndexing } = diff;

  if (!searchIndexing) {
    return [];
  }

  const { businessUnits, customers } = searchIndexing;
  if (!customers && !businessUnits) {
    return [];
  }

  const businessUnitsActions = businessUnits
    ? buildBaseAttributesActions({
        actions: businessUnitSearchActionsList,
        diff: diff.searchIndexing.businessUnits,
        oldObj: oldObj.searchIndexing.businessUnits,
        newObj: newObj.searchIndexing.businessUnits,
        shouldOmitEmptyString: config.shouldOmitEmptyString,
        shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
        shouldPreventUnsettingRequiredFields:
          config.shouldPreventUnsettingRequiredFields,
      })
    : [];

  const customersActions = customers
    ? buildBaseAttributesActions({
        actions: customerSearchActionsList,
        diff: diff.searchIndexing.customers,
        oldObj: oldObj.searchIndexing.customers,
        newObj: newObj.searchIndexing.customers,
        shouldOmitEmptyString: config.shouldOmitEmptyString,
        shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
        shouldPreventUnsettingRequiredFields:
          config.shouldPreventUnsettingRequiredFields,
      })
    : [];

  return [...businessUnitsActions, ...customersActions];
}
