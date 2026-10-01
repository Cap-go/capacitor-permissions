/**
 * Normalized permission status returned by every platform implementation.
 *
 * - `granted`: the user allowed full access.
 * - `denied`: the user has not granted access yet, or Android can show a rationale.
 * - `blocked`: the user denied access and the app cannot prompt again without settings.
 * - `limited`: partial access (for example iOS limited photo library or reduced location accuracy).
 * - `unavailable`: the permission is not supported on this platform or not declared in the app manifest.
 */
export type PermissionState = 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable';

/**
 * Logical permission identifiers shared across iOS, Android, and web.
 *
 * Android-only names include `activityRecognition`, `phone`, `sms`, `mediaAudio`, `mediaImages`, and `mediaVideo`.
 * iOS-only names include `reminders` and `appTrackingTransparency`.
 * Web supports a subset via browser APIs (`camera`, `microphone`, `notifications`, `locationWhenInUse`, `locationAlways`).
 */
export type PermissionName =
  | 'camera'
  | 'microphone'
  | 'photoLibrary'
  | 'photoLibraryAddOnly'
  | 'contacts'
  | 'calendar'
  | 'reminders'
  | 'locationWhenInUse'
  | 'locationAlways'
  | 'bluetooth'
  | 'motion'
  | 'notifications'
  | 'speechRecognition'
  | 'appTrackingTransparency'
  | 'activityRecognition'
  | 'phone'
  | 'sms'
  | 'mediaAudio'
  | 'mediaImages'
  | 'mediaVideo';

/**
 * Options for checking or requesting a single permission.
 *
 * @since 8.0.0
 */
export interface PermissionOptions {
  /**
   * Permission to evaluate.
   */
  permission: PermissionName;
}

/**
 * Result for a single permission status.
 *
 * @since 8.0.0
 */
export interface PermissionStatusResult {
  /**
   * Current status for the requested permission.
   */
  status: PermissionState;
}

/**
 * Options for checking or requesting several permissions.
 *
 * @since 8.0.0
 */
export interface MultiplePermissionOptions {
  /**
   * Permissions to evaluate in order.
   */
  permissions: PermissionName[];
}

/**
 * Result for several permission statuses.
 *
 * @since 8.0.0
 */
export interface MultiplePermissionStatusResult {
  /**
   * Map of permission name to status.
   */
  statuses: Record<string, PermissionState>;
}

/**
 * Result for Android rationale checks.
 *
 * @since 8.0.0
 */
export interface ShouldShowRationaleResult {
  /**
   * True only when Android would show a rationale dialog before requesting again.
   * Always false on iOS and web.
   */
  shouldShow: boolean;
}

/**
 * Settings screen type for `openSettings`.
 *
 * @since 8.0.0
 */
export type SettingsType = 'application' | 'notifications';

/**
 * Options for opening system settings.
 *
 * @since 8.0.0
 */
export interface OpenSettingsOptions {
  /**
   * Which settings screen to open. Defaults to `application`.
   */
  type?: SettingsType;
}

/**
 * Plugin version payload.
 *
 * @since 8.0.0
 */
export interface PluginVersionResult {
  /**
   * Version identifier returned by the platform implementation (`native` on mobile, `web` in browsers).
   */
  version: string;
}

/**
 * Cross-platform permissions API for Capacitor apps.
 *
 * @since 8.0.0
 */
export interface PermissionsPlugin {
  /**
   * Check the current status of one permission without prompting the user.
   *
   * @param options.permission Logical permission to inspect.
   */
  check(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Request one permission from the user. On Android, shows the system dialog when needed.
   *
   * @param options.permission Logical permission to request.
   */
  request(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Check several permissions without prompting.
   *
   * @param options.permissions List of permissions to inspect.
   */
  checkMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Request several permissions sequentially so dialogs are not shown on top of each other.
   *
   * @param options.permissions List of permissions to request.
   */
  requestMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Whether Android should show a rationale before requesting again.
   * Returns `{ shouldShow: false }` on iOS and web.
   *
   * @param options.permission Logical permission to inspect.
   */
  shouldShowRationale(options: PermissionOptions): Promise<ShouldShowRationaleResult>;

  /**
   * Open the application or notification settings screen.
   * Rejects on web with `UNIMPLEMENTED`.
   *
   * @param options.type Settings destination. Defaults to `application`.
   */
  openSettings(options?: OpenSettingsOptions): Promise<void>;

  /**
   * Ask for precise location.
   * On iOS, requests temporary full accuracy when already authorized when-in-use.
   * On Android, requests `ACCESS_FINE_LOCATION`.
   * On web, returns the geolocation permission status after prompting when possible.
   */
  requestPreciseLocation(): Promise<PermissionStatusResult>;

  /**
   * Returns the platform implementation version marker.
   */
  getPluginVersion(): Promise<PluginVersionResult>;
}
