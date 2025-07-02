import { buildBaseAttributesActions } from '../utils-ts/common-actions';
import {
  AttributeGroup,
  AttributeReference,
  Delta,
  SyncActionConfig,
  UpdateAction,
} from '../utils-ts/types';
import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils-ts/create-build-array-actions';

const hasAttribute = <T extends AttributeReference>(
  attributes: Array<T>,
  newValue: AttributeReference
) => attributes.some((attribute) => attribute.key === newValue.key);

export const baseActionsList = [
  { action: 'changeName', key: 'name' },
  { action: 'setKey', key: 'key' },
  { action: 'setDescription', key: 'description' },
];

export function actionsMapBase<T>(
  diff: Delta,
  oldObj: T,
  newObj: T,
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

export function actionsMapAttributes<T extends AttributeGroup>(
  diff: Delta,
  oldObj: T,
  newObj: T
): Array<UpdateAction> {
  const handler = createBuildArrayActions('attributes', {
    [ADD_ACTIONS]: (newAttribute: AttributeReference) => ({
      action: 'addAttribute',
      attribute: newAttribute,
    }),
    [REMOVE_ACTIONS]: (oldAttribute: AttributeReference) => {
      // We only add the action if the attribute is not included in the new object.
      return !hasAttribute(newObj.attributes, oldAttribute)
        ? {
            action: 'removeAttribute',
            attribute: oldAttribute,
          }
        : null;
    },
    [CHANGE_ACTIONS]: (
      oldAttribute: AttributeReference,
      newAttribute: AttributeReference
    ) => {
      const result = [];
      // We only remove the attribute in case that the oldAttribute is not
      // included in the new object
      if (!hasAttribute(newObj.attributes, oldAttribute))
        result.push({
          action: 'removeAttribute',
          attribute: oldAttribute,
        });

      // We only add the attribute in case that the newAttribute was not
      // included in the old object
      if (!hasAttribute((oldObj as AttributeGroup).attributes, newAttribute))
        result.push({
          action: 'addAttribute',
          attribute: newAttribute,
        });

      return result;
    },
  });

  return handler(diff, oldObj, newObj);
}
