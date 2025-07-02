import {
  buildBaseAttributesActions,
  buildReferenceActions,
  createIsEmptyValue,
} from '../utils-ts/common-actions';
import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils-ts/create-build-array-actions';
import * as diffpatcher from '../utils-ts/diffpatcher';
import clone, { notEmpty } from '../utils-ts/clone';
import {
  Customer,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

const isEmptyValue = createIsEmptyValue([undefined, null, '']);

export const baseActionsList: Array<UpdateAction> = [
  { action: 'setSalutation', key: 'salutation' },
  { action: 'changeEmail', key: 'email' },
  { action: 'setFirstName', key: 'firstName' },
  { action: 'setLastName', key: 'lastName' },
  { action: 'setMiddleName', key: 'middleName' },
  { action: 'setTitle', key: 'title' },
  { action: 'setCustomerNumber', key: 'customerNumber' },
  { action: 'setExternalId', key: 'externalId' },
  { action: 'setCompanyName', key: 'companyName' },
  { action: 'setDateOfBirth', key: 'dateOfBirth' },
  { action: 'setLocale', key: 'locale' },
  { action: 'setVatId', key: 'vatId' },
  {
    action: 'setStores',
    key: 'stores',
  },
  { action: 'setKey', key: 'key' },
];

export const setDefaultBaseActionsList: Array<UpdateAction> = [
  {
    action: 'setDefaultBillingAddress',
    key: 'defaultBillingAddressId',
    actionKey: 'addressId',
  },
  {
    action: 'setDefaultShippingAddress',
    key: 'defaultShippingAddressId',
    actionKey: 'addressId',
  },
];

export const referenceActionsList: Array<UpdateAction> = [
  { action: 'setCustomerGroup', key: 'customerGroup' },
];

export const authenticationModeActionsList: Array<UpdateAction> = [
  {
    action: 'setAuthenticationMode',
    key: 'authenticationMode',
    value: 'password',
  },
];

/**
 * SYNC FUNCTIONS
 */
export function actionsMapBase(
  diff: Delta,
  oldObj: Customer,
  newObj: Customer,
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

export function actionsMapSetDefaultBase(
  diff: Delta,
  oldObj: Customer,
  newObj: Customer,
  config: SyncActionConfig = {}
) {
  return buildBaseAttributesActions({
    actions: setDefaultBaseActionsList,
    diff,
    oldObj,
    newObj,
    shouldOmitEmptyString: config.shouldOmitEmptyString,
    shouldUnsetOmittedProperties: config.shouldUnsetOmittedProperties,
    shouldPreventUnsettingRequiredFields:
      config.shouldPreventUnsettingRequiredFields,
  });
}

export function actionsMapReferences<T extends Customer>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  return buildReferenceActions({
    actions: referenceActionsList,
    diff,
    oldObj,
    newObj,
  });
}

export function actionsMapAddresses<T extends Customer>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const handler = createBuildArrayActions('addresses', {
    [ADD_ACTIONS]: (newObject: Customer) => ({
      action: 'addAddress',
      address: newObject,
    }),
    [REMOVE_ACTIONS]: (objectToRemove: Customer) => ({
      action: 'removeAddress',
      addressId: objectToRemove.id,
    }),
    [CHANGE_ACTIONS]: (oldObject: Customer, updatedObject: Customer) => ({
      action: 'changeAddress',
      addressId: oldObject.id,
      address: updatedObject,
    }),
  });

  return handler(diff, oldObj, newObj);
}

export function actionsMapBillingAddresses<T extends Customer>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const handler = createBuildArrayActions('billingAddressIds', {
    [ADD_ACTIONS]: (addressId: string) => ({
      action: 'addBillingAddressId',
      addressId,
    }),
    [REMOVE_ACTIONS]: (addressId: string) => ({
      action: 'removeBillingAddressId',
      addressId,
    }),
  });

  return handler(diff, oldObj, newObj);
}

export function actionsMapShippingAddresses<T extends Customer>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const handler = createBuildArrayActions('shippingAddressIds', {
    [ADD_ACTIONS]: (addressId: string) => ({
      action: 'addShippingAddressId',
      addressId,
    }),
    [REMOVE_ACTIONS]: (addressId: string) => ({
      action: 'removeShippingAddressId',
      addressId,
    }),
  });

  return handler(diff, oldObj, newObj);
}

export function actionsMapAuthenticationModes<T extends Customer>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  return buildAuthenticationModeActions({
    actions: authenticationModeActionsList,
    diff,
    oldObj,
    newObj,
  });
}

function buildAuthenticationModeActions({ actions, diff, oldObj, newObj }) {
  return actions
    .map((item: UpdateAction) => {
      const key = item.key;
      const value = item.value || item.key;
      const delta = diff[key];
      const before = oldObj[key];
      const now = newObj[key];
      const isNotDefinedBefore = isEmptyValue(oldObj[key]);
      const isNotDefinedNow = isEmptyValue(newObj[key]);
      const authenticationModes = ['Password', 'ExternalAuth'];

      if (!delta) return undefined;

      if (isNotDefinedNow && isNotDefinedBefore) return undefined;

      if (newObj.authenticationMode === 'Password' && !newObj.password)
        throw new Error(
          'Cannot set to Password authentication mode without password'
        );

      if (
        'authenticationMode' in newObj &&
        !authenticationModes.includes(newObj.authenticationMode)
      )
        throw new Error('Invalid Authentication Mode');

      if (!isNotDefinedNow && isNotDefinedBefore) {
        // no value previously set
        if (newObj.authenticationMode === 'ExternalAuth')
          return { action: item.action, authMode: now };
        return {
          action: item.action,
          authMode: now,
          [value]: newObj.password,
        };
      }

      /* no new value */
      if (isNotDefinedNow && !{}.hasOwnProperty.call(newObj, key))
        return undefined;

      if (isNotDefinedNow && {}.hasOwnProperty.call(newObj, key))
        // value unset
        return undefined;

      // We need to clone `before` as `patch` will mutate it
      const patched = diffpatcher.patch(clone(before), delta);
      if (newObj.authenticationMode === 'ExternalAuth')
        return { action: item.action, authMode: patched };
      return {
        action: item.action,
        authMode: patched,
        [value]: newObj.password,
      };
    })
    .filter(notEmpty);
}
