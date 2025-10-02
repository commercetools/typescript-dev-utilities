import isEqual from 'lodash.isequal';
import isNil from 'lodash.isnil';
import {
  Delta,
  Price,
  ProductVariant,
  SyncActionConfig,
  UpdateAction,
} from './types';

type Preprocessor<T> = (before: T, now: T) => Array<T>;

function applyOnBeforeDiff<T>(
  before: T,
  now: T,
  fn?: Preprocessor<T>
): Array<T> {
  return fn && typeof fn === 'function' ? fn(before, now) : [before, now];
}

const createPriceComparator = (price: Price) => ({
  value: { currencyCode: price.value.currencyCode },
  channel: price.channel,
  country: price.country,
  customerGroup: price.customerGroup,
  validFrom: price.validFrom,
  validUntil: price.validUntil,
});

function arePricesStructurallyEqual(oldPrice: Price, newPrice: Price) {
  const oldPriceComparison = createPriceComparator(oldPrice);
  const newPriceComparison = createPriceComparator(newPrice);
  return isEqual(newPriceComparison, oldPriceComparison);
}

function extractPriceFromPreviousVariant(
  newPrice: Price,
  previousVariant: ProductVariant
) {
  if (!previousVariant) return null;
  const price = previousVariant.prices.find((oldPrice) =>
    arePricesStructurallyEqual(oldPrice, newPrice)
  );
  return price || null;
}

function injectMissingPriceIds(
  nextVariants: Array<ProductVariant>,
  previousVariants: Array<ProductVariant>
) {
  return nextVariants.map((newVariant) => {
    const { prices, ...restOfVariant } = newVariant;

    if (!prices) return restOfVariant;
    const oldVariant = previousVariants.find(
      (previousVariant) =>
        (!isNil(previousVariant.id) && previousVariant.id === newVariant.id) ||
        (!isNil(previousVariant.key) &&
          previousVariant.key === newVariant.key) ||
        (!isNil(previousVariant.sku) && previousVariant.sku === newVariant.sku)
    );

    return {
      ...restOfVariant,
      prices: prices.map((price) => {
        const newPrice = { ...price };
        const oldPrice = extractPriceFromPreviousVariant(price, oldVariant);

        if (oldPrice) {
          // copy ID if not provided
          if (!newPrice.id) newPrice.id = oldPrice.id;

          if (isNil(newPrice.value.type))
            (newPrice.value as { type: string }).type = oldPrice.value.type;

          if (isNil(newPrice.value.fractionDigits))
            (newPrice.value as { fractionDigits: unknown }).fractionDigits =
              oldPrice.value.fractionDigits;
        }

        return newPrice;
      }),
    };
  });
}

export default function createBuildActions<
  S extends object,
  T extends UpdateAction,
>(
  differ: (processedBefore: S, processedNow: S) => Delta,
  doMapActions: (
    diffed: Delta,
    processedNow: S,
    processedBefore: S,
    options: SyncActionConfig
  ) => Array<T>,
  onBeforeDiff?: Preprocessor<S>,
  buildActionsConfig: SyncActionConfig = {}
) {
  return function buildActions(
    now: S,
    before: S,
    options: SyncActionConfig = {}
  ) {
    if (!now || !before) {
      throw new Error(
        'Missing either `newObj` or `oldObj` in order to build update actions'
      );
    }

    const [processedBefore, processedNow] = applyOnBeforeDiff<S>(
      before,
      now,
      onBeforeDiff
    );

    if ('variants' in processedNow && 'variants' in processedBefore) {
      processedNow['variants'] = injectMissingPriceIds(
        processedNow.variants as Array<ProductVariant>,
        processedBefore.variants as Array<ProductVariant>
      );
    }

    const diffed = differ(processedBefore, processedNow);
    if (!buildActionsConfig.withHints && !diffed) return [];
    return doMapActions(diffed, processedNow as S, processedBefore, options);
  };
}
