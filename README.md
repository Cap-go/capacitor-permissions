# @capgo/capacitor-permissions

<a href="https://capgo.app/?ref=plugin_permissions"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-permissions" alt="Capgo - Instant updates for Capacitor" /></a>

<div align="center">
  <p><b>Capgo</b>: open-source live updates for Ionic and Capacitor apps. Ship OTA fixes and features instantly, without waiting for app store review.</p>
  <h2><a href="https://capgo.app/register/?ref=plugin_permissions">➡️ Get started for free</a></h2>
  <p>14-day unlimited free trial. No credit card required</p>
  <p><a href="https://capgo.app/consulting/?ref=plugin_permissions">Missing a feature? We'll build the plugin for you 💪</a></p>
</div>

**@capgo/capacitor-permissions** gives Capacitor apps one TypeScript API to check and request runtime permissions on iOS, Android, and web. Instead of wiring each feature plugin separately or guessing platform-specific status codes, you work with a single set of permission names and normalized states (`granted`, `denied`, `blocked`, `limited`, `unavailable`). Native manifests stay lean: the plugin ships without `uses-permission` entries or forced Info.plist strings, so store review only sees what your app declares.

### Features

- One `PermissionName` enum for camera, location, notifications, media, contacts, and more across platforms
- `check`, `request`, `checkMultiple`, and `requestMultiple` with shared `AppPermissionState` results
- Android `shouldShowRationale` before re-prompting after a denial
- `openSettings` for application or notification settings when access is blocked
- `requestPreciseLocation` for full accuracy on iOS and `ACCESS_FINE_LOCATION` on Android
- Web implementation via the browser Permissions API for supported types
- Optional `scripts/apply-permissions.mjs` to add only the Android and iOS declarations you need

### Use cases

- Gate a screen until camera or microphone access is granted
- Run a startup audit with `checkMultiple` and show a single onboarding flow for missing permissions
- Send users to system settings when status is `blocked` after `openSettings`
- Request notification permission before registering push tokens
- Upgrade from reduced to precise location when a map feature needs it

## Documentation

- [Plugin docs on Capgo](https://capgo.app/docs/plugins/permissions/)
- [Tutorial: capacitor-permissions](https://capgo.app/plugins/capacitor-permissions/)
- [Capgo live updates](https://capgo.app/?ref=plugin_permissions)

<p align="center">
  <img src="./screenshots/android-request.webp" alt="Android emulator showing the camera permission dialog" width="280" />
  <img src="./screenshots/android-granted.webp" alt="Example app reporting camera permission as granted" width="280" />
</p>

## Compatibility

| Plugin version | Capacitor compatibility | Maintained |
| -------------- | ----------------------- | ---------- |
| v8.\*.\*       | v8.\*.\*                | ✅          |
| v7.\*.\*       | v7.\*.\*                | On demand   |
| v6.\*.\*       | v6.\*.\*                | On demand   |

Policy:

- New plugins start at version `8.0.0` (Capacitor 8 baseline).
- Backward compatibility for older Capacitor majors is supported on demand.

## Install

```bash
npm install @capgo/capacitor-permissions
npx cap sync
```

With Bun:

```bash
bun add @capgo/capacitor-permissions
bunx cap sync
```

## iOS setup

The plugin does not inject usage descriptions into your app. For each `PermissionName` you call at runtime, add the matching keys to `ios/App/App/Info.plist` (customize the user-facing strings):

| Permission | Info.plist keys |
| ---------- | ---------------- |
| `camera` | `NSCameraUsageDescription` |
| `microphone` | `NSMicrophoneUsageDescription` |
| `photoLibrary` | `NSPhotoLibraryUsageDescription` |
| `photoLibraryAddOnly` | `NSPhotoLibraryAddUsageDescription` |
| `contacts` | `NSContactsUsageDescription` |
| `calendar` | `NSCalendarsUsageDescription`, `NSCalendarsFullAccessUsageDescription` |
| `reminders` | `NSRemindersUsageDescription`, `NSRemindersFullAccessUsageDescription` |
| `locationWhenInUse` | `NSLocationWhenInUseUsageDescription` |
| `locationAlways` | `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription` |
| `bluetooth` | `NSBluetoothAlwaysUsageDescription` |
| `motion` | `NSMotionUsageDescription` |
| `speechRecognition` | `NSSpeechRecognitionUsageDescription`, `NSMicrophoneUsageDescription` |
| `appTrackingTransparency` | `NSUserTrackingUsageDescription` |

`notifications` on iOS uses the system notification permission flow; no extra usage string is required for the API itself. Permissions such as `activityRecognition`, `phone`, `sms`, and Android-style media splits are not applicable on iOS and report `unavailable` when checked.

You can apply the keys above automatically from the plugin repo:

```bash
node node_modules/@capgo/capacitor-permissions/scripts/apply-permissions.mjs \
  --project . \
  --permissions camera,microphone,notifications,locationWhenInUse,photoLibrary
```

(Point `--project` at your Capacitor app root, the folder that contains `ios/` and `android/`.)

## Android setup

The library `AndroidManifest.xml` declares **no** `<uses-permission>` entries. Add only what your app uses to `android/app/src/main/AndroidManifest.xml`. The plugin targets **minSdk 24** (Android 7.0) unless your project overrides `minSdkVersion`.

| Permission | Typical `uses-permission` names |
| ---------- | -------------------------------- |
| `camera` | `android.permission.CAMERA` |
| `microphone`, `speechRecognition` | `android.permission.RECORD_AUDIO` |
| `photoLibrary`, `mediaImages` | `READ_MEDIA_IMAGES`, `READ_MEDIA_VISUAL_USER_SELECTED`, `READ_EXTERNAL_STORAGE` (legacy) |
| `photoLibraryAddOnly` | `WRITE_EXTERNAL_STORAGE` (legacy) |
| `contacts` | `READ_CONTACTS` |
| `calendar` | `READ_CALENDAR`, `WRITE_CALENDAR` |
| `locationWhenInUse` | `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` |
| `locationAlways` | above plus `ACCESS_BACKGROUND_LOCATION` |
| `bluetooth` | `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN` |
| `motion`, `activityRecognition` | `ACTIVITY_RECOGNITION` |
| `notifications` | `POST_NOTIFICATIONS` (Android 13+) |
| `phone` | `READ_PHONE_STATE` |
| `sms` | `READ_SMS`, `RECEIVE_SMS` |
| `mediaAudio` | `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE` |
| `mediaVideo` | `READ_MEDIA_VIDEO`, `READ_EXTERNAL_STORAGE` |

`reminders` and `appTrackingTransparency` are not Android runtime permissions in this API and return `unavailable`.

Use the same `apply-permissions.mjs` script as on iOS to merge declarations into your app manifest.

## Web setup

No manifest changes. Supported permissions use `navigator.permissions` and related APIs (`camera`, `microphone`, `notifications`, `locationWhenInUse`; `locationAlways` maps to foreground geolocation only). Others return `unavailable`. `openSettings` is not implemented on web.

## Usage

```typescript
import { Permissions } from '@capgo/capacitor-permissions';

export async function ensureCamera(): Promise<boolean> {
  const { status } = await Permissions.check({ permission: 'camera' });
  if (status === 'granted') {
    return true;
  }
  const { status: afterRequest } = await Permissions.request({ permission: 'camera' });
  return afterRequest === 'granted';
}
```

Check several permissions before showing an onboarding screen:

```typescript
const { statuses } = await Permissions.checkMultiple({
  permissions: ['camera', 'microphone', 'notifications'],
});
const missing = Object.entries(statuses).filter(([, s]) => s !== 'granted');
```

When Android reports `denied`, show context before requesting again:

```typescript
const { shouldShow } = await Permissions.shouldShowRationale({ permission: 'camera' });
if (shouldShow) {
  // Show your own explanation UI, then:
  await Permissions.request({ permission: 'camera' });
}
```

If status is `blocked`, send the user to settings:

```typescript
await Permissions.openSettings({ type: 'application' });
```

## Example app

The `example-app/` project exercises every `PermissionName`. Apply declarations, sync native projects, then:

```bash
cd example-app
bun install
bun run start
```

## API

<docgen-index>

* [`check(...)`](#check)
* [`request(...)`](#request)
* [`checkMultiple(...)`](#checkmultiple)
* [`requestMultiple(...)`](#requestmultiple)
* [`shouldShowRationale(...)`](#shouldshowrationale)
* [`openSettings(...)`](#opensettings)
* [`requestPreciseLocation()`](#requestpreciselocation)
* [`getPluginVersion()`](#getpluginversion)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

Cross-platform permissions API for Capacitor apps.

### check(...)

```typescript
check(options: PermissionOptions) => Promise<PermissionStatusResult>
```

Check the current status of one permission without prompting the user.

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#permissionoptions">PermissionOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#permissionstatusresult">PermissionStatusResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### request(...)

```typescript
request(options: PermissionOptions) => Promise<PermissionStatusResult>
```

Request one permission from the user. On Android, shows the system dialog when needed.
On iOS, triggers the platform authorization flow for the mapped capability.

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#permissionoptions">PermissionOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#permissionstatusresult">PermissionStatusResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### checkMultiple(...)

```typescript
checkMultiple(options: MultiplePermissionOptions) => Promise<MultiplePermissionStatusResult>
```

Check several permissions without prompting.

| Param         | Type                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#multiplepermissionoptions">MultiplePermissionOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#multiplepermissionstatusresult">MultiplePermissionStatusResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### requestMultiple(...)

```typescript
requestMultiple(options: MultiplePermissionOptions) => Promise<MultiplePermissionStatusResult>
```

Request several permissions sequentially so dialogs are not shown on top of each other.

| Param         | Type                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#multiplepermissionoptions">MultiplePermissionOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#multiplepermissionstatusresult">MultiplePermissionStatusResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### shouldShowRationale(...)

```typescript
shouldShowRationale(options: PermissionOptions) => Promise<ShouldShowRationaleResult>
```

Whether Android should show a rationale before requesting again.
Returns `{ shouldShow: false }` on iOS and web.

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#permissionoptions">PermissionOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#shouldshowrationaleresult">ShouldShowRationaleResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### openSettings(...)

```typescript
openSettings(options?: OpenSettingsOptions | undefined) => Promise<void>
```

Open the application or notification settings screen.
Rejects on web with `UNIMPLEMENTED`.

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#opensettingsoptions">OpenSettingsOptions</a></code> |

**Since:** 8.0.0

--------------------


### requestPreciseLocation()

```typescript
requestPreciseLocation() => Promise<PermissionStatusResult>
```

Ask for precise location.
On iOS, requests temporary full accuracy when already authorized when-in-use.
On Android, requests `ACCESS_FINE_LOCATION`.
On web, returns the geolocation permission status after prompting when possible.

**Returns:** <code>Promise&lt;<a href="#permissionstatusresult">PermissionStatusResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### getPluginVersion()

```typescript
getPluginVersion() => Promise<PluginVersionResult>
```

Returns the platform implementation version marker.

**Returns:** <code>Promise&lt;<a href="#pluginversionresult">PluginVersionResult</a>&gt;</code>

**Since:** 8.0.0

--------------------


### Interfaces


#### PermissionStatusResult

Result for a single permission status.

| Prop         | Type                                                              | Description                                  | Since |
| ------------ | ----------------------------------------------------------------- | -------------------------------------------- | ----- |
| **`status`** | <code><a href="#apppermissionstate">AppPermissionState</a></code> | Current status for the requested permission. | 8.0.0 |


#### PermissionOptions

Options for checking or requesting a single permission.

| Prop             | Type                                                      | Description                                | Since |
| ---------------- | --------------------------------------------------------- | ------------------------------------------ | ----- |
| **`permission`** | <code><a href="#permissionname">PermissionName</a></code> | Logical permission to evaluate or request. | 8.0.0 |


#### MultiplePermissionStatusResult

Result for several permission statuses.

| Prop           | Type                                                                                                          | Description                                                                     | Since |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----- |
| **`statuses`** | <code><a href="#record">Record</a>&lt;string, <a href="#apppermissionstate">AppPermissionState</a>&gt;</code> | Map of permission name to status. Keys match the names passed in `permissions`. | 8.0.0 |


#### MultiplePermissionOptions

Options for checking or requesting several permissions.

| Prop              | Type                          | Description                                                                                             | Since |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| **`permissions`** | <code>PermissionName[]</code> | Permissions to evaluate in order. On `requestMultiple`, each permission is requested one after another. | 8.0.0 |


#### ShouldShowRationaleResult

Result for Android rationale checks.

| Prop             | Type                 | Description                                                                                                | Since |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- | ----- |
| **`shouldShow`** | <code>boolean</code> | True only when Android would show a rationale dialog before requesting again. Always false on iOS and web. | 8.0.0 |


#### OpenSettingsOptions

Options for opening system settings.

| Prop       | Type                                                  | Description                    | Default                    | Since |
| ---------- | ----------------------------------------------------- | ------------------------------ | -------------------------- | ----- |
| **`type`** | <code><a href="#settingstype">SettingsType</a></code> | Which settings screen to open. | <code>'application'</code> | 8.0.0 |


#### PluginVersionResult

Plugin version payload.

| Prop          | Type                | Description                                                                                         | Since |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------- | ----- |
| **`version`** | <code>string</code> | Version identifier returned by the platform implementation (`native` on mobile, `web` in browsers). | 8.0.0 |


### Type Aliases


#### AppPermissionState

Normalized permission status returned by every platform implementation.

- `granted`: the user allowed full access.
- `denied`: the user has not granted access yet, or Android can show a rationale.
- `blocked`: the user denied access and the app cannot prompt again without settings.
- `limited`: partial access (for example iOS limited photo library or reduced location accuracy).
- `unavailable`: the permission is not supported on this platform or not declared in the app manifest.

<code>'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable'</code>


#### PermissionName

Logical permission identifiers shared across iOS, Android, and web.

Android-only names include `activityRecognition`, `phone`, `sms`, `mediaAudio`, `mediaImages`, and `mediaVideo`.
iOS-only names include `reminders` and `appTrackingTransparency`.
Web supports a subset via browser APIs (`camera`, `microphone`, `notifications`, `locationWhenInUse`).
On web, `locationAlways` is an alias of foreground geolocation only; browsers do not expose background location permission.

<code>'camera' | 'microphone' | 'photoLibrary' | 'photoLibraryAddOnly' | 'contacts' | 'calendar' | 'reminders' | 'locationWhenInUse' | 'locationAlways' | 'bluetooth' | 'motion' | 'notifications' | 'speechRecognition' | 'appTrackingTransparency' | 'activityRecognition' | 'phone' | 'sms' | 'mediaAudio' | 'mediaImages' | 'mediaVideo'</code>


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


#### SettingsType

Settings screen type for `openSettings`.

<code>'application' | 'notifications'</code>

</docgen-api>
