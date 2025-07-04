import * as diffpatcher from './diffpatcher';
import { Delta } from './types';

const Actions = {
  setCustomType: 'setCustomType',
  setCustomField: 'setCustomField',
};

const hasSingleCustomFieldChanged = (diff: Delta) => Array.isArray(diff.custom);
const haveMultipleCustomFieldsChanged = (diff: Delta) =>
  Boolean(diff.custom.fields);

const hasCustomTypeChanged = (diff: Delta) => Boolean(diff.custom.type);
const extractCustomType = <T extends object>(diff: Delta, previousObject: T) =>
  Array.isArray(diff.custom.type)
    ? diffpatcher.getDeltaValue(diff.custom.type, previousObject)
    : diff.custom.type;

const extractTypeId = (
  type: { id: unknown },
  nextObject: { custom: { type: { id: unknown } } }
) =>
  Array.isArray(type.id)
    ? diffpatcher.getDeltaValue(type.id)
    : nextObject.custom.type.id;

const extractTypeKey = (
  type: { key: unknown },
  nextObject: { custom: { type: { key: unknown } } }
) =>
  Array.isArray(type.key)
    ? diffpatcher.getDeltaValue(type.key)
    : nextObject.custom.type.key;

const extractTypeFields = (
  diffedFields: Array<object>,
  nextFields: Array<object>
) =>
  Array.isArray(diffedFields)
    ? diffpatcher.getDeltaValue(diffedFields)
    : nextFields;

const extractFieldValue = <T extends object>(newFields: T, fieldName: string) =>
  newFields[fieldName];

export default function actionsMapCustom(
  diff: Delta,
  newObj,
  oldObj,
  customProps: { actions: object; [key: string]: unknown } = { actions: {} }
) {
  const actions = [];
  const { actions: customPropsActions, ...options } = customProps;
  const actionGroup = { ...Actions, ...customPropsActions };

  if (!diff.custom) return actions;
  if (hasSingleCustomFieldChanged(diff)) {
    // If custom is not defined on the new or old category
    const custom = diffpatcher.getDeltaValue(diff.custom, oldObj);
    actions.push({ action: actionGroup.setCustomType, ...options, ...custom });
  } else if (hasCustomTypeChanged(diff)) {
    // If custom is set to an empty object on the new or old category
    const type = extractCustomType(diff, oldObj);

    if (!type) actions.push({ action: actionGroup.setCustomType, ...options });
    else if (type.id)
      actions.push({
        action: actionGroup.setCustomType,
        ...options,
        type: {
          typeId: 'type',
          id: extractTypeId(type, newObj),
        },
        fields: extractTypeFields(diff.custom.fields, newObj.custom.fields),
      });
    else if (type.key)
      actions.push({
        action: actionGroup.setCustomType,
        ...options,
        type: {
          typeId: 'type',
          key: extractTypeKey(type, newObj),
        },
        fields: extractTypeFields(diff.custom.fields, newObj.custom.fields),
      });
  } else if (haveMultipleCustomFieldsChanged(diff)) {
    const customFieldsActions = Object.keys(diff.custom.fields).map((name) => ({
      action: actionGroup.setCustomField,
      ...options,
      name,
      value: extractFieldValue(newObj.custom.fields, name),
    }));
    actions.push(...customFieldsActions);
  }

  return actions;
}
