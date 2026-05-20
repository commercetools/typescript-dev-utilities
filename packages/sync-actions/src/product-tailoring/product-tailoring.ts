import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Delta,
  ProductTailoring,
  ProductTailoringData,
  ProductTailoringUpdateAction,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as productTailoringActions from './product-tailoring-actions';
import * as diffpatcher from '../utils/diffpatcher';
import findMatchingPairs from '../utils/find-matching-pairs';
import copyEmptyArrayProps from '../utils/copy-empty-array-props';

export const actionGroups: Array<string> = [
  'base',
  'meta',
  'images',
  'assets',
  'attributes',
  'variants',
];

function createProductTailoringMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: ProductTailoringData,
  oldObj: ProductTailoringData,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions(
    diff: Delta,
    newObj: ProductTailoringData,
    oldObj: ProductTailoringData,
    options: SyncActionConfig = {}
  ): Array<UpdateAction> {
    const allActions: Array<Array<UpdateAction>> = [];
    const { publish, staged } = newObj as ProductTailoringData & {
      publish?: boolean;
      staged?: boolean;
    };

    const variantHashMap = findMatchingPairs(
      diff.variants,
      oldObj.variants,
      newObj.variants
    );

    const config = { ...syncActionConfig, ...options };

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapBase(diff, oldObj, newObj, config)
      )
    );

    allActions.push(
      mapActionGroup(
        'meta',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapMeta(diff, oldObj, newObj, config)
      )
    );

    allActions.push(
      mapActionGroup(
        'variants',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapAddVariants(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'variants',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapRemoveVariants(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'images',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapImages(
            diff,
            oldObj,
            newObj,
            variantHashMap
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'assets',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapAssets(
            diff,
            oldObj,
            newObj,
            variantHashMap
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'attributes',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapProductAttributes(
            diff,
            oldObj,
            newObj
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'attributes',
        (): Array<UpdateAction> =>
          productTailoringActions.actionsMapVariantAttributes(
            diff,
            oldObj,
            newObj,
            (options.sameForAllAttributeNames as string[]) || [],
            variantHashMap
          )
      )
    );

    if (publish === true || staged === false)
      return allActions.flat().map((action) => ({
        ...action,
        staged: false,
      }));

    return allActions.flat();
  };
}

function prepareVariantsForDiff(
  before: ProductTailoringData,
  now: ProductTailoringData
): Array<ProductTailoringData> {
  // Capture which variant IDs have absent or null `images` before copyEmptyArrayProps mutates now
  // (it does a shallow copy of arrays, so the original elements are shared by reference).
  // Both cases (missing property and explicit null) mean "remove images", and
  // copyEmptyArrayProps converts both to [], so we preserve the original intent here.
  const variantIdsWithoutImages = new Set(
    (now.variants || [])
      .filter((v) => !('images' in v) || (v as ProductTailoringData & { images?: unknown }).images === null)
      .map((v) => v.id)
  );

  const [beforeCopy, nowCopy] = copyEmptyArrayProps(
    before,
    now
  ) as Array<ProductTailoringData>;

  // copyEmptyArrayProps adds `images: []` when the property was absent from `now`.
  // Absence signals removal, so restore it so the diff produces a deletion delta
  // and a `setImages` action gets generated.
  if (nowCopy.variants && variantIdsWithoutImages.size > 0) {
    const patchedVariants = nowCopy.variants.map((variant) => {
      if (variantIdsWithoutImages.has(variant.id)) {
        const { images: _removed, ...rest } = variant as typeof variant & {
          images?: unknown;
        };
        return rest;
      }
      return variant;
    });
    (nowCopy as { variants: typeof patchedVariants }).variants = patchedVariants;
  }

  const ensureVariants = (obj: ProductTailoringData): ProductTailoringData => ({
    ...obj,
    variants: obj?.variants || [],
  });

  return [ensureVariants(beforeCopy), ensureVariants(nowCopy)];
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<
  ProductTailoring | ProductTailoringData,
  ProductTailoringUpdateAction
> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createProductTailoringMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => ProductTailoringUpdateAction[],
    prepareVariantsForDiff
  );

  return { buildActions };
};
