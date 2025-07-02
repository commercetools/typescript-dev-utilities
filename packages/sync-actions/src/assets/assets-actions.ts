import createBuildArrayActions, {
  ADD_ACTIONS,
  REMOVE_ACTIONS,
  CHANGE_ACTIONS,
} from '../utils-ts/create-build-array-actions';
import { Asset, Delta, UpdateAction } from '../utils-ts/types';

function toAssetIdentifier(asset: Partial<Asset>) {
  const assetIdentifier = asset.id
    ? { assetId: asset.id }
    : { assetKey: asset.key };
  return assetIdentifier;
}

export default function actionsMapAssets<T extends Asset>(
  diff: Delta,
  oldObj: T,
  newObj: T
): Array<UpdateAction> {
  const handler = createBuildArrayActions('assets', {
    [ADD_ACTIONS]: (newAsset: Asset) => ({
      action: 'addAsset',
      asset: newAsset,
    }),
    [REMOVE_ACTIONS]: (oldAsset: Asset) => ({
      action: 'removeAsset',
      ...toAssetIdentifier(oldAsset),
    }),
    [CHANGE_ACTIONS]: (oldAsset: Asset, newAsset: Asset) =>
      // here we could use more atomic update actions (e.g. changeAssetName)
      // but for now we use the simpler approach to first remove and then
      // re-add the asset - which reduces the code complexity
      [
        {
          action: 'removeAsset',
          ...toAssetIdentifier(oldAsset),
        },
        {
          action: 'addAsset',
          asset: newAsset,
        },
      ],
  });

  return handler(diff, oldObj, newObj);
}
