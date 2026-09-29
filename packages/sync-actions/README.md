# commercetools-sync-actions

Construct API update actions, for usage with `@commercetools/sdk-client`.

https://commercetools.github.io/nodejs/sdk/api/syncActions

## Install

```bash
npm install --save @commercetools/sync-actions
```

## Update action coverage

Each `createSync*` function diffs a "before" and "now" representation of a
resource and emits a subset of that resource's commercetools
[update actions](https://docs.commercetools.com/api). Coverage is uneven
across resources — some are complete, some cover only the common cases, and a
few barely cover the resource at all. The table below reflects an audit of
this package's source against the current commercetools OpenAPI specs
(2026-09), and lists per resource the update actions that currently produce
**no** action when diffed.

Deprecated/legacy actions (e.g. `setSKU`, `addQuantity`/`removeQuantity`) are
excluded from the "missing" lists below.

| Resource | Sync export | Coverage | Missing update actions |
| --- | --- | --- | --- |
| Product | `createSyncProducts` | 41/49 | `publish`, `unpublish`, `revertStagedChanges`, `revertStagedVariantChanges`, `setDefaultVariant`, `setDiscountedPrice`, `setPriceKey`, `setPrices` |
| Category | `createSyncCategories` | 14/22 | `changeAssetName`, `changeAssetOrder`, `setAssetCustomField`, `setAssetCustomType`, `setAssetDescription`, `setAssetKey`, `setAssetSources`, `setAssetTags` (asset changes fall back to remove+re-add instead of granular updates) |
| Customer | `createSyncCustomers` | 23/30 | `addCustomerGroupAssignment`, `addStore`, `removeCustomerGroupAssignment`, `removeStore`, `setAddressCustomField`, `setAddressCustomType`, `setCustomerGroupAssignments` |
| InventoryEntry | `createSyncInventories` | 6/13 | `setInventoryLimits`, `setKey`, `setReorderPoint`, `setReservationExpirationInMinutes`, `setSafetyStock` |
| Order | `createSyncOrders` | 11/60 | Largest gap in the package — only state transitions (`changeOrderState`, `changePaymentState`, `changeShipmentState`, `transitionState`-adjacent), delivery/parcel basics, return basics, and top-level custom fields are covered. Missing nearly all address, line-item, delivery/parcel detail, and return-item actions, e.g. `setBillingAddress`/`setShippingAddress` (+custom field/type), `setCustomerEmail`, `setCustomerId`, `setLineItemCustomField`/`Type`, `setLineItemShippingDetails`, `addPayment`/`removePayment`, `setDeliveryAddress`(+custom field/type), `setParcelTrackingData`/`Measurements`/`Items`, `setReturnInfo`, `setReturnItemCustomField`/`Type`, `transitionLineItemState`/`transitionCustomLineItemState`, `setOrderNumber`, `setPurchaseOrderNumber`, `setStore`, `setLocale`, `updateSyncInfo`, and more |
| RecurringOrder | `createSyncRecurringOrders` | 9/9 | — full coverage |
| ProductDiscount | `createSyncProductDiscounts` | 10/10 | — full coverage |
| DiscountCode | `createSyncDiscountCodes` | 14/14 | — full coverage |
| CustomerGroup | `createSyncCustomerGroup` | 4/4 | — full coverage |
| CartDiscount | `createSyncCartDiscounts` | 15/20 | `addStore`, `removeStore`, `setDiscountGroup`, `setRecurringOrderScope`, `setStores` |
| TaxCategory | `createSyncTaxCategories` | 6/6 | — full coverage |
| Zone | `createSyncZones` | 5/5 | — full coverage |
| ShippingMethod | `createSyncShippingMethods` | 15/19 | `addStore`, `removeStore`, `setCarrier`, `setStores` |
| ProductType | `createSyncProductTypes` | 16/20 | `changeAttributeName`, `changeAttributeOrder`, `changeLocalizedEnumValueOrder`, `changePlainEnumValueOrder`. Additionally, attribute add/remove and enum-value add/remove/reorder require the caller to pre-supply `options.nestedValuesChanges.attributeDefinitions` / `.attributeEnumValues` hints — nothing in this package computes them, so calling `buildActions()` the normal way (no hints) silently produces no action for those cases. |
| State | `createSyncStates` | 8/9 | `setRoles` (only incremental `addRoles`/`removeRoles` diffing is emitted) |
| Channel | `createSyncChannels` | 8/12 | `addRoles`, `removeRoles` (roles are only diffed as a full-array `setRoles` replace), `setAddressCustomField`, `setAddressCustomType` |
| Type | `createSyncTypes` | 14/16 | `removeEnumValues`, `removeLocalizedEnumValues` — removing values from an `Enum`/`LocalizedEnum` field's `values` array silently produces no action (`changeFieldDefinitionLabel` is a legacy duplicate of the implemented `changeLabel` and isn't counted as missing) |
| Project | `createSyncProjects` | 9/22 | `changeCartsConfiguration`, `changeCountryTaxRateFallbackEnabled`, `changeMessagesEnabled`, `changeOrderSearchStatus`, `changePriceRoundingMode`, `changeProductSearchIndexingEnabled`, `changeShoppingListsConfiguration`, `changeTaxRoundingMode`, `setDiscountsConfiguration`, `setExternalOAuth`, `setProductCatalogModel`, `setReleaseExpiredReservations`, `setReservationExpirationInMinutes` |
| Store | `createSyncStores` | 6/26 | Largely unimplemented. Missing: `addCountry`, `addDistributionChannel`, `addProductSelection`, `addSupplyChannel`, `changeProductSelectionActive`, `removeCountry`, `removeDistributionChannel`, `removeProductSelection`, `removeSupplyChannel`, `setCheckoutUrlTemplate`, `setContactUrl`, `setCookiePolicyUrl`, `setCountries`, `setFaqUrl`, `setImprintUrl`, `setOrderUrlTemplate`, `setPrivacyPolicyUrl`, `setProductSelections`, `setRefundPolicyUrl`, `setShippingPolicyUrl`, `setTermsOfServiceUrl` |
| ProductSelection | `createSyncProductSelections` | 4/9 | `addProduct`, `excludeProduct`, `removeProduct`, `setVariantExclusion`, `setVariantSelection` |
| ProductTailoring | `createSyncProductTailoring` | 24/28 | `publish`, `unpublish`, `setKey`, `setMetaAttributes` |
| StandalonePrice | `createSyncStandalonePrices` | 11/14 | `addPriceTier`, `removePriceTier` (bulk `setPriceTiers` is implemented instead), `applyStagedChanges` |
| AttributeGroup | `createSyncAttributeGroups` | 5/6 | `setAttributes` (bulk replace; incremental `addAttribute`/`removeAttribute` is implemented) |
| Extension | `createSyncApiExtensions` | 4/7 | `setAdditionalContext`, `setDependencies`, `setExpansionPaths` |
| BusinessUnit | `createSyncBusinessUnits` | 9/30 | No address handling and no generic custom-field/custom-type support at all. Missing: `addAddress`, `addBillingAddressId`, `addCustomerGroupAssignment`, `addShippingAddressId`, `addStore`, `changeAddress`, `removeAddress`, `removeBillingAddressId`, `removeCustomerGroupAssignment`, `removeShippingAddressId`, `removeStore`, `setAddressCustomField`, `setAddressCustomType`, `setAssociates`, `setCustomField`, `setCustomType`, `setCustomerGroupAssignments`, `setDefaultBillingAddress`, `setDefaultShippingAddress`, `setUnitType` |
| Subscription | `createSyncSubscriptions` | 4/5 | `setEvents` |
| Variant (standalone) | `createSyncStandaloneVariants` | 6/22 | Only bulk-replace actions are implemented (`setAttributes`, `setImages`, `setAssets`, plus `setKey`, `setSku`, `publish`, `unpublish`). All granular per-item actions are missing: `addAsset`, `addExternalImage`, `changeAssetName`, `changeAssetOrder`, `moveImageToPosition`, `removeAsset`, `removeImage`, `removeStagedChanges`, `setAssetCustomField`, `setAssetCustomType`, `setAssetDescription`, `setAssetKey`, `setAssetSources`, `setAssetTags`, `setAttribute`, `setImageLabel` |

`Quote`, `QuoteRequest`, and `StagedQuote` sync logic exists under
`src/quotes/`, `src/quotes-requests/`, and `src/staged-quotes/` but is not
exported from the package's public API (`src/index.ts`).
