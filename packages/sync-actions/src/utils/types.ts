export * from '@commercetools/platform-sdk';

// The action builders read a delta both by key (`delta.shippingInfo`) and by
// position (`delta[2]`), so we model it as a loose index-able record rather than
// jsondiffpatch's strict Delta union (which would require narrowing everywhere).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Delta = Record<string | number, any> | undefined;

export type SyncActionConfig = {
  shouldOmitEmptyString?: boolean;
  shouldUnsetOmittedProperties?: boolean;
  shouldPreventUnsettingRequiredFields?: boolean;
  sameForAllAttributeNames?: unknown[];
  enableDiscounted?: boolean;
  withHints?: boolean;
  [key: string]: unknown;
};

export type SyncAction<
  R extends object | undefined,
  S extends UpdateAction | unknown,
  T extends object = SyncActionConfig,
> = {
  buildActions: (
    now: DeepPartial<R>,
    before: DeepPartial<R>,
    config?: T
  ) => Array<S>;
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type UpdateAction = {
  action: string | never;
  key?: string;
  actionKey?: string;
  roles?: Array<unknown>;
  value?: string;
  // [key: string | number | symbol]: unknown;
};

export type ActionGroup = {
  type: string;
  group: 'ignore' | 'allow' | string;
};

export type MapActionGroup = (
  type: string,
  cb: () => Array<UpdateAction>
) => Array<UpdateAction>;

export type MapAction<T> = (
  mapActionGroup: MapActionGroup,
  syncActionConfig?: SyncActionConfig
) => (
  diff: Delta,
  newObj: T,
  oldObj: T,
  config?: SyncActionConfig
) => Array<UpdateAction>;
