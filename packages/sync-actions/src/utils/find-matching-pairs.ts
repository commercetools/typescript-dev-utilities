import forEach from 'lodash.foreach';
import { Delta } from './types';

type Collection = { refByIndex: object; refByIdentifier: object };
// type Collections = Array<Collection>;

const REGEX_NUMBER = new RegExp(/^\d+$/);
const REGEX_UNDERSCORE_NUMBER = new RegExp(/^_\d+$/);

function preProcessCollection<T>(collection: Array<T> = [], identifier = 'id') {
  return collection.reduce(
    (acc, currentValue, currentIndex) => {
      acc.refByIndex[String(currentIndex)] = currentValue[identifier];
      acc.refByIdentifier[currentValue[identifier]] = String(currentIndex);
      return acc;
    },
    {
      refByIndex: {},
      refByIdentifier: {},
    }
  );
}

// creates a hash of a location of an item in collection1 and collection2
export default function findMatchingPairs<T extends object>(
  diff: Delta,
  before: Array<T> = [],
  now: Array<T> = [],
  identifier = 'id'
) {
  const result = {} as T;

  const {
    refByIdentifier: beforeObjRefByIdentifier,
    refByIndex: beforeObjRefByIndex,
  } = preProcessCollection(before as Collection[], identifier) as Collection;

  const {
    refByIdentifier: nowObjRefByIdentifier,
    refByIndex: nowObjRefByIndex,
  } = preProcessCollection(now, identifier);

  forEach(diff, (_item: Collection, key: string) => {
    if (REGEX_NUMBER.test(key)) {
      const matchingIdentifier = nowObjRefByIndex[key];
      result[key] = [beforeObjRefByIdentifier[matchingIdentifier], key];
    } else if (REGEX_UNDERSCORE_NUMBER.test(key)) {
      const index = key.substring(1);
      const matchingIdentifier = beforeObjRefByIndex[index];
      result[key] = [index, nowObjRefByIdentifier[matchingIdentifier]];
    }
  });

  return result;
}
