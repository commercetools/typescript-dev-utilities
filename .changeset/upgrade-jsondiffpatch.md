---
'@commercetools/sync-actions': minor
---

Upgrade the `jsondiffpatch` dependency from `0.5.0` to `^0.7.6`, moving off an unmaintained release onto the current maintained version.

A customer security report referenced `jsonpath-plus` (which is not, and never was, a dependency of this package). The reported version facts — pinned `0.5.0`, fixed in `0.7.6`, not backwards compatible — instead correspond to `jsondiffpatch`, a direct dependency used by the diff/patch utility behind update-action generation. This change adopts `jsondiffpatch@0.7.6`.

The public API and observable behavior of `@commercetools/sync-actions` are unchanged. Internally: `jsondiffpatch` 0.7 is ESM-only, so imports were updated to the package root and the dependency is bundled into the published CommonJS, ESM, and UMD artifacts (CommonJS consumers are unaffected). Fine-grained text diffing remains disabled, so a changed string is still reported as a whole-value replacement.
