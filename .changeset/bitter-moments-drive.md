---
'@commercetools/sync-actions': patch
---

When a product-tailorings variant does not define an image array but more than one image should be added, only one addExternalImage action was generated. This fix makes sure, that for each added image an action is generated
