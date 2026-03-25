import createBuildActions from '../utils/create-build-actions';
import createMapActionGroup from '../utils/create-map-action-group';
import * as diffpatcher from '../utils/diffpatcher';
import {
  actionsMapBase,
  actionsMapAttributes,
  actionsMapImages,
  actionsMapAssets,
  StandaloneVariantAction,
} from './standalone-variant-actions';
import {
  ActionGroup,
  Delta,
  ProductVariant,
  SyncAction,
  SyncActionConfig,
  UpdateAction,
} from '../utils/types';

export type StandaloneVariant = {
  id?: string;
  version?: number;
  variants?: ProductVariant[];
};

export type StandaloneVariantUpdateAction = StandaloneVariantAction;

export const actionGroups: Array<string> = ['base', 'attributes', 'images', 'assets'];

function createStandaloneVariantsMapActions(
  mapActionGroup: (
    type: string,
    fn: () => Array<UpdateAction>
  ) => Array<UpdateAction>,
  syncActionConfig: SyncActionConfig
) {
  return function doMapActions(
    diff: Delta,
    newObj: StandaloneVariant,
    oldObj: StandaloneVariant
  ): Array<StandaloneVariantUpdateAction> {
    const allActions: Array<StandaloneVariantUpdateAction> = [];

    allActions.push(
      ...(mapActionGroup('base', () =>
        actionsMapBase(diff, oldObj, newObj, syncActionConfig)
      ) as StandaloneVariantUpdateAction[])
    );

    allActions.push(
      ...(mapActionGroup('attributes', () =>
        actionsMapAttributes(diff, oldObj, newObj, syncActionConfig)
      ) as StandaloneVariantUpdateAction[])
    );

    allActions.push(
      ...(mapActionGroup('images', () =>
        actionsMapImages(diff, oldObj, newObj, syncActionConfig)
      ) as StandaloneVariantUpdateAction[])
    );

    allActions.push(
      ...(mapActionGroup('assets', () =>
        actionsMapAssets(diff, oldObj, newObj, syncActionConfig)
      ) as StandaloneVariantUpdateAction[])
    );

    return allActions;
  };
}

export default function createSyncStandaloneVariants(
  actionGroupList?: Array<ActionGroup>,
  syncActionConfig: SyncActionConfig = {}
): SyncAction<StandaloneVariant, StandaloneVariantUpdateAction> {
  const mapActionGroup = createMapActionGroup(actionGroupList);
  const doMapActions = createStandaloneVariantsMapActions(
    mapActionGroup,
    syncActionConfig
  );

  const buildActions = createBuildActions<
    StandaloneVariant,
    StandaloneVariantUpdateAction
  >(diffpatcher.diff, doMapActions);

  return { buildActions };
}
