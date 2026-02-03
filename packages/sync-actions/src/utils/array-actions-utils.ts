export const REGEX_NUMBER = new RegExp(/^\d+$/);
export const REGEX_UNDERSCORE_NUMBER = new RegExp(/^_\d+$/);

export const getIsAddAction = (key: string, resource: unknown) =>
  REGEX_NUMBER.test(key) && Array.isArray(resource) && resource.length;

export const getIsUpdateAction = (key: string, resource: unknown) =>
  REGEX_NUMBER.test(key) && Object.keys(resource).length;

export const getIsRemoveAction = (key: string, resource: unknown) =>
  REGEX_UNDERSCORE_NUMBER.test(key) && Number(resource[2]) === 0;

export const getIsItemMovedAction = (key: string, resource: unknown) =>
  REGEX_UNDERSCORE_NUMBER.test(key) && Number(resource[2]) === 3;
