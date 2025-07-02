import forEach from 'lodash.foreach';
import * as diffpatcher from '../utils-ts/diffpatcher';
import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import createBuildArrayActions, {
  ADD_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils-ts/create-build-array-actions';
import extractMatchingPairs from '../utils-ts/extract-matching-pairs';
import findMatchingPairs from '../utils-ts/find-matching-pairs';
import {
  Delivery,
  Delta,
  Order,
  Parcel,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';

const REGEX_NUMBER = new RegExp(/^\d+$/);
const REGEX_UNDERSCORE_NUMBER = new RegExp(/^_\d+$/);

const isAddAction = (key: string, resource: unknown) =>
  REGEX_NUMBER.test(key) && Array.isArray(resource) && resource.length;

const isRemoveAction = (key: string, resource: unknown) =>
  REGEX_UNDERSCORE_NUMBER.test(key) && Number(resource[2]) === 0;

export const baseActionsList = [
  { action: 'changeOrderState', key: 'orderState' },
  { action: 'changePaymentState', key: 'paymentState' },
  { action: 'changeShipmentState', key: 'shipmentState' },
];

/**
 * SYNC FUNCTIONS
 */

export function actionsMapBase(
  diff: Delta,
  oldObj: Order,
  newObj: Order,
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

export function actionsMapDeliveries<T extends Order>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const deliveriesDiff = diff.shippingInfo;
  if (!deliveriesDiff) return [];

  const handler = createBuildArrayActions('deliveries', {
    [ADD_ACTIONS]: (newObject: Delivery) => ({
      action: 'addDelivery',
      items: newObject.items,
      parcels: newObject.parcels,
    }),
  });

  return handler(deliveriesDiff, oldObj.shippingInfo, newObj.shippingInfo);
}

function _buildDeliveryParcelsAction<T extends Delivery>(
  diffedParcels: Delta,
  oldDelivery = {} as T,
  newDelivery = {} as T
) {
  const addParcelActions: Array<UpdateAction | unknown> = [];
  const removeParcelActions = [];

  // generate a hashMap to be able to reference the right image from both ends
  const matchingParcelPairs = findMatchingPairs(
    diffedParcels,
    oldDelivery.parcels,
    newDelivery.parcels
  );
  forEach(diffedParcels, (parcel: unknown, key: string) => {
    const { oldObj } = extractMatchingPairs(
      matchingParcelPairs,
      key,
      oldDelivery.parcels,
      newDelivery.parcels
    ) as unknown as { oldObj: Parcel };

    if (isAddAction(key, parcel)) {
      addParcelActions.push({
        action: 'addParcelToDelivery',
        deliveryId: oldDelivery.id,
        ...diffpatcher.getDeltaValue(parcel),
      });
      return;
    }

    if (isRemoveAction(key, parcel)) {
      removeParcelActions.push({
        action: 'removeParcelFromDelivery',
        parcelId: oldObj.id,
      });
    }
  });

  return [addParcelActions, removeParcelActions];
}

function _buildDeliveryItemsAction(
  diffedItems: Delta,
  newDelivery = {} as Delivery
) {
  const setDeliveryItemsAction = [];
  // If there is a diff it means that there were changes (update, adds or removes)
  // over the items, which means that `setDeliveryItems` change has happened over
  // the delivery
  if (diffedItems && Object.keys(diffedItems).length > 0) {
    setDeliveryItemsAction.push({
      action: 'setDeliveryItems',
      deliveryId: newDelivery.id,
      deliveryKey: newDelivery.key,
      items: newDelivery.items,
    });
  }

  return [setDeliveryItemsAction];
}

export function actionsMapParcels<T extends Order>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  deliveryHashMap: object
) {
  const shippingInfo = diff.shippingInfo;
  if (!shippingInfo) return [];

  const deliveries = shippingInfo.deliveries;
  if (!deliveries) return [];

  let addParcelActions = [];
  let removeParcelActions = [];

  if (deliveries)
    forEach(deliveries, (delivery, key) => {
      const { oldObj: oldDelivery, newObj: newDelivery } = extractMatchingPairs(
        deliveryHashMap,
        key,
        oldObj.shippingInfo.deliveries,
        newObj.shippingInfo.deliveries
      ) as unknown as { oldObj: Delivery; newObj: Delivery };

      if (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key)) {
        const [addParcelAction, removeParcelAction] =
          _buildDeliveryParcelsAction(
            delivery.parcels,
            oldDelivery,
            newDelivery
          );

        addParcelActions = addParcelActions.concat(addParcelAction);
        removeParcelActions = removeParcelActions.concat(removeParcelAction);
      }
    });

  return removeParcelActions.concat(addParcelActions);
}

export function actionsMapDeliveryItems<T extends Order>(
  diff: Delta,
  oldObj: T,
  newObj: T,
  deliveryHashMap: object
) {
  const shippingInfo = diff.shippingInfo;
  if (!shippingInfo) return [];

  const deliveries = shippingInfo.deliveries;
  if (!deliveries) return [];

  let setDeliveryItemsActions = [];

  forEach(deliveries, (delivery: Delivery, key: string) => {
    const { newObj: newDelivery } = extractMatchingPairs(
      deliveryHashMap,
      key,
      oldObj.shippingInfo.deliveries,
      newObj.shippingInfo.deliveries
    ) as unknown as { oldObj: Delivery; newObj: Delivery };

    if (REGEX_UNDERSCORE_NUMBER.test(key) || REGEX_NUMBER.test(key)) {
      const [setDeliveryItemsAction] = _buildDeliveryItemsAction(
        delivery.items,
        newDelivery
      );
      setDeliveryItemsActions = setDeliveryItemsActions.concat(
        setDeliveryItemsAction
      );
    }
  });

  return setDeliveryItemsActions;
}

export function actionsMapReturnsInfo<T extends Order>(
  diff: Delta,
  oldObj: T,
  newObj: T
) {
  const returnInfoDiff = diff.returnInfo;
  if (!returnInfoDiff) return [];

  const handler = createBuildArrayActions('returnInfo', {
    [ADD_ACTIONS]: (newReturnInfo: Delivery) => {
      if (newReturnInfo.items) {
        return [
          {
            action: 'addReturnInfo',
            ...newReturnInfo,
          },
        ];
      }
      return [];
    },
    [CHANGE_ACTIONS]: (
      _oldSReturnInfo: Delivery,
      newReturnInfo: Delivery,
      key: string
    ) => {
      const { items = {} } = returnInfoDiff[key];
      if (Object.keys(items).length === 0) {
        return [];
      }
      return Object.keys(items).reduce((actions, index) => {
        const item = newReturnInfo.items[index];
        if (items[index].shipmentState) {
          actions.push({
            action: 'setReturnShipmentState',
            returnItemId: item.id,
            shipmentState: item.shipmentState,
          });
        }
        if (items[index].paymentState) {
          actions.push({
            action: 'setReturnPaymentState',
            returnItemId: item.id,
            paymentState: item.paymentState,
          });
        }
        return actions;
      }, []);
    },
  });

  return handler(diff, oldObj, newObj);
}
