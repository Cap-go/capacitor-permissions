/**
 * Shared permission status used on every platform.
 */
export type PermissionState = 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable';

/**
 * Named permissions this plugin can check or request.
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
 */
export interface PermissionOptions {
  /**
   * Permission to evaluate.
   */
  permission: PermissionName;
}

/**
 * Result for a single permission status.
 */
export interface PermissionStatusResult {
  /**
   * Current status for the requested permission.
   */
  status: PermissionState;
}

/**
 * Options for checking or requesting several permissions.
 */
export interface MultiplePermissionOptions {
  /**
   * Permissions to evaluate.
   */
  permissions: PermissionName[];
}

/**
 * Result for several permission statuses.
 */
export interface MultiplePermissionStatusResult {
  /**
   * Map of permission name to status.
   */
  statuses: Record<string, PermissionState>;
}

/**
 * Result for Android rationale checks.
 */
export interface ShouldShowRationaleResult {
  /**
   * True only when Android would show a rationale dialog.
   * Always false on iOS and web.
   */
  shouldShow: boolean;
}

/**
 * Settings screen type for `openSettings`.
 */
export type SettingsType = 'application' | 'notifications';

/**
 * Options for opening system settings.
 */
export interface OpenSettingsOptions {
  /**
   * Which settings screen to open. Defaults to `application`.
   */
  type?: SettingsType;
}

/**
 * Plugin version payload.
 */
export interface PluginVersionResult {
  /**
   * Version identifier returned by the platform implementation.
   */
  version: string;
}

/**
 * Cross-platform permissions API.
 */
export interface PermissionsPlugin {
  /**
   * Check the current status of one permission without prompting.
   */
  check(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Request one permission from the user.
   */
  request(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Check several permissions without prompting.
   */
  checkMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Request several permissions from the user.
   */
  requestMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Whether Android should show a rationale before requesting again.
   * Returns `{ shouldShow: false }` on iOS and web.
   */
  shouldShowRationale(options: PermissionOptions): Promise<ShouldShowRationaleResult>;

  /**
   * Open the application or notification settings screen.
   * Rejects on web.
   */
  openSettings(options?: OpenSettingsOptions): Promise<void>;

  /**
   * Ask for precise location.
   * On iOS, requests temporary full accuracy when already authorized when-in-use.
   * On Android, requests `ACCESS_FINE_LOCATION`.
   * On web, returns the geolocation permission status.
   */
  requestPreciseLocation(): Promise<PermissionStatusResult>;

  /**
   * Returns the platform implementation version marker.
   */
  getPluginVersion(): Promise<PluginVersionResult>;
}
