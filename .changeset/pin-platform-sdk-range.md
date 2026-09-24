---
'@commercetools/sync-actions': patch
---

Replace the `latest` version range for `@commercetools/platform-sdk` with `^9.4.0`.

The `latest` descriptor re-resolved on every lockfile refresh and crossed major boundaries without review, which is how the 8.x to 9.x upgrade landed unannounced. A caret range matches the other packages in this repository and routes future updates through reviewable dependency PRs, with major upgrades gated behind explicit approval.

This is a dependency-declaration change only. The public API and observable behavior of `@commercetools/sync-actions` are unchanged.
