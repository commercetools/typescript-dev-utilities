import { DiffPatcher } from 'jsondiffpatch';
import { Delta } from './types';

type U = { id: string; name: string; url: string };

export function objectHash<O extends U, I extends string | number>(
  obj: O,
  index: I
) {
  const objIndex = `$$index:${index}`;
  return typeof obj === 'object' && obj !== null
    ? obj.id || obj.name || obj.url || objIndex
    : objIndex;
}

const diffpatcher = new DiffPatcher({
  objectHash,
  arrays: {
    // detect items moved inside the array
    detectMove: true,

    // value of items moved is not included in deltas
    includeValueOnMove: false,
  },
});

export function diff<T>(oldObj: T, newObj: T): Delta {
  return diffpatcher.diff(oldObj, newObj);
}

export function patch<T>(obj: T, delta: Delta): T {
  return diffpatcher.patch(obj, delta) as T;
}

export function getDeltaValue<T extends object = object>(
  arr: Array<number> | unknown,
  originalObject?: T
): T {
  if (!Array.isArray(arr))
    throw new Error('Expected array to extract delta value');

  if (arr.length === 1) return arr[0]; // new
  if (arr.length === 2) return arr[1]; // update
  if (arr.length === 3 && arr[2] === 0) return undefined; // delete
  if (arr.length === 3 && arr[2] === 2) {
    // text diff
    if (!originalObject)
      throw new Error(
        'Cannot apply patch to long text diff. Missing original object.'
      );
    // try to apply patch to given object based on delta value
    return patch(originalObject, arr);
  }

  if (arr.length === 3 && arr[2] === 3)
    // array move
    throw new Error(
      'Detected an array move, it should not happen as ' +
        '`includeValueOnMove` should be set to false'
    );

  throw new Error(`Got unsupported number ${arr[2]} in delta value`);
}
