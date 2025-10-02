import type {
  SyncAction,
  SyncActionConfig,
  ActionGroup,
  UpdateAction,
  Delta,
  ProductVariant,
  ProductData,
  ProductUpdateAction,
  Product,
  Category,
} from '../utils/types';
import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as productActions from './product-actions';
import * as diffpatcher from '../utils/diffpatcher';
import findMatchingPairs from '../utils/find-matching-pairs';
import copyEmptyArrayProps from '../utils/copy-empty-array-props';

export const actionGroups: Array<string> = [
  'base',
  'meta',
  'references',
  'prices',
  'pricesCustom',
  'productAttributes',
  'attributes',
  'images',
  'variants',
  'categories',
  'categoryOrderHints',
];

function createProductMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
): (
  diff: Delta,
  newObj: object,
  oldObj: object,
  options: SyncActionConfig
) => Array<UpdateAction> {
  return function doMapActions<
    T extends {
      publish: boolean;
      variants: object[];
      staged: boolean;
      [key: string]: unknown;
    },
  >(
    diff: Delta,
    newObj: T,
    oldObj: T,
    options: SyncActionConfig = {}
  ): Array<UpdateAction> {
    const allActions: Array<Array<UpdateAction>> = [];
    const { sameForAllAttributeNames, enableDiscounted } = options;
    const { publish, staged } = newObj;

    const variantHashMap = findMatchingPairs(
      diff.variants,
      oldObj.variants,
      newObj.variants
    );

    allActions.push(
      mapActionGroup(
        'productAttributes',
        (): Array<UpdateAction> =>
          productActions.actionsMapProductAttributes(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'attributes',
        (): Array<UpdateAction> =>
          productActions.actionsMapAttributes(
            diff,
            oldObj,
            newObj,
            sameForAllAttributeNames || [],
            variantHashMap
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'variants',
        (): Array<UpdateAction> =>
          productActions.actionsMapAddVariants(diff, oldObj, newObj)
      )
    );

    allActions.push(productActions.actionsMapMasterVariant(oldObj, newObj));

    allActions.push(
      mapActionGroup(
        'variants',
        (): Array<UpdateAction> =>
          productActions.actionsMapRemoveVariants(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'base',
        (): Array<UpdateAction> =>
          productActions.actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      )
    );

    allActions.push(
      mapActionGroup(
        'meta',
        (): Array<UpdateAction> =>
          productActions.actionsMapMeta(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'references',
        (): Array<UpdateAction> =>
          productActions.actionsMapReferences(diff, oldObj, newObj)
      )
    );

    allActions.push(
      mapActionGroup(
        'images',
        (): Array<UpdateAction> =>
          productActions.actionsMapImages(diff, oldObj, newObj, variantHashMap)
      )
    );

    allActions.push(
      mapActionGroup(
        'pricesCustom',
        (): Array<UpdateAction> =>
          productActions.actionsMapPricesCustom(
            diff,
            oldObj,
            newObj,
            variantHashMap
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'prices',
        (): Array<UpdateAction> =>
          productActions.actionsMapPrices(
            diff,
            oldObj,
            newObj,
            variantHashMap,
            enableDiscounted
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'categories',
        (): Array<UpdateAction> => productActions.actionsMapCategories(diff)
      )
    );

    allActions.push(
      mapActionGroup(
        'categoryOrderHints',
        (): Array<UpdateAction> =>
          productActions.actionsMapCategoryOrderHints(
            diff,
            oldObj as unknown as Category
          )
      )
    );

    allActions.push(
      mapActionGroup(
        'assets',
        (): Array<UpdateAction> =>
          productActions.actionsMapAssets(diff, oldObj, newObj, variantHashMap)
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

function moveMasterVariantsIntoVariants(
  before: object,
  now: object
): Array<ProductData> {
  const [beforeCopy, nowCopy] = copyEmptyArrayProps(
    before,
    now
  ) as Array<ProductData>;

  const move = (obj: ProductData): ProductData => ({
    ...obj,
    masterVariant: undefined,
    variants: [obj.masterVariant, ...(obj.variants || [])],
  });

  const hasMasterVariant = (obj: ProductData): ProductVariant =>
    obj && obj.masterVariant;

  return [
    hasMasterVariant(beforeCopy) ? move(beforeCopy) : beforeCopy,
    hasMasterVariant(nowCopy) ? move(nowCopy) : nowCopy,
  ];
}

export default (
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig?: SyncActionConfig
): SyncAction<Product | ProductData, ProductUpdateAction> => {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createProductMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions(
    diffpatcher.diff,
    doMapActions as () => ProductUpdateAction[],
    moveMasterVariantsIntoVariants
  );

  return { buildActions };
};
