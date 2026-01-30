export default function extractMatchingPairs<T extends object>(
  hashMap: object,
  key: string,
  before: ArrayLike<T>,
  now: ArrayLike<T>
) {
  let oldObjPos: string | number;
  let newObjPos: string | number;
  let oldObj: T;
  let newObj: T;

  if (hashMap[key]) {
    oldObjPos = hashMap[key][0];
    newObjPos = hashMap[key][1];
    if (before && before[oldObjPos]) oldObj = before[oldObjPos];

    if (now && now[newObjPos]) newObj = now[newObjPos];
  }

  return { oldObj, newObj };
}
