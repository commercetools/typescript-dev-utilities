---
'@commercetools/sync-actions': patch
---

Fix `types` sync actions to generate `removeEnumValues`/`removeLocalizedEnumValues` update actions when values are removed from an `Enum`/`LocalizedEnum` field definition. Previously, removed enum values were silently dropped and no update action was produced.
