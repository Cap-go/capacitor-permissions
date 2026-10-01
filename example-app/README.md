# `@capgo/capacitor-permissions` example

Local Vite shell linked to the parent plugin (`file:..`). Use it to try every `PermissionName` on web, iOS, and Android.

## Getting started

```bash
bun install
bun run start
```

Before native tests, declare the permissions you need (from the repo root):

```bash
node ../scripts/apply-permissions.mjs --project . --permissions camera,microphone,notifications,locationWhenInUse,photoLibrary
bunx cap sync
```

Add platforms if they are not present yet:

```bash
bunx cap add ios
bunx cap add android
```
