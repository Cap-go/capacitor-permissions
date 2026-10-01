/**
 * Normalized permission status returned by every platform implementation.
 *
 * - `granted`: the user allowed full access.
 * - `denied`: the user has not granted access yet, or Android can show a rationale.
 * - `blocked`: the user denied access and the app cannot prompt again without settings.
 * - `limited`: partial access (for example iOS limited photo library or reduced location accuracy).
 * - `unavailable`: the permission is not supported on this platform or not declared in the app manifest.
 *
 * @since 8.0.0
 */
export type AppPermissionState = 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable';

/**
 * Logical permission identifiers shared across iOS, Android, and web.
 *
 * Android-only names include `activityRecognition`, `phone`, `sms`, `mediaAudio`, `mediaImages`, and `mediaVideo`.
 * iOS-only names include `reminders` and `appTrackingTransparency`.
 * Web supports a subset via browser APIs (`camera`, `microphone`, `notifications`, `locationWhenInUse`).
 * On web, `locationAlways` is an alias of foreground geolocation only; browsers do not expose background location permission.
 *
 * @since 8.0.0
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
   * Logical permission to evaluate or request.
   *
   * @since 8.0.0
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
   *
   * @since 8.0.0
   */
  status: AppPermissionState;
}

/**
 * Options for checking or requesting several permissions.
 *
 * @since 8.0.0
 */
export interface MultiplePermissionOptions {
  /**
   * Permissions to evaluate in order. On `requestMultiple`, each permission is requested one after another.
   *
   * @since 8.0.0
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
   * Map of permission name to status. Keys match the names passed in `permissions`.
   *
   * @since 8.0.0
   */
  statuses: Record<string, AppPermissionState>;
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
   *
   * @since 8.0.0
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
   * Which settings screen to open.
   *
   * @default 'application'
   * @since 8.0.0
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
   *
   * @since 8.0.0
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
   * @since 8.0.0
   * @example
   * ```typescript
   * const { status } = await Permissions.check({ permission: 'camera' });
   * ```
   */
  check(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Request one permission from the user. On Android, shows the system dialog when needed.
   * On iOS, triggers the platform authorization flow for the mapped capability.
   *
   * @param options.permission Logical permission to request.
   * @since 8.0.0
   * @example
   * ```typescript
   * const { status } = await Permissions.request({ permission: 'notifications' });
   * ```
   */
  request(options: PermissionOptions): Promise<PermissionStatusResult>;

  /**
   * Check several permissions without prompting.
   *
   * @param options.permissions List of permissions to inspect.
   * @since 8.0.0
   * @example
   * ```typescript
   * const { statuses } = await Permissions.checkMultiple({
   *   permissions: ['camera', 'microphone'],
   * });
   * ```
   */
  checkMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Request several permissions sequentially so dialogs are not shown on top of each other.
   *
   * @param options.permissions List of permissions to request.
   * @since 8.0.0
   */
  requestMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult>;

  /**
   * Whether Android should show a rationale before requesting again.
   * Returns `{ shouldShow: false }` on iOS and web.
   *
   * @param options.permission Logical permission to inspect.
   * @since 8.0.0
   * @example
   * ```typescript
   * const { shouldShow } = await Permissions.shouldShowRationale({ permission: 'camera' });
   * if (shouldShow) {
   *   await showWhyWeNeedCamera();
   *   await Permissions.request({ permission: 'camera' });
   * }
   * ```
   */
  shouldShowRationale(options: PermissionOptions): Promise<ShouldShowRationaleResult>;

  /**
   * Open the application or notification settings screen.
   * Rejects on web with `UNIMPLEMENTED`.
   *
   * @param options.type Settings destination. Defaults to `application`.
   * @since 8.0.0
   * @example
   * ```typescript
   * await Permissions.openSettings({ type: 'notifications' });
   * ```
   */
  openSettings(options?: OpenSettingsOptions): Promise<void>;

  /**
   * Ask for precise location.
   * On iOS, requests temporary full accuracy when already authorized when-in-use.
   * On Android, requests `ACCESS_FINE_LOCATION`.
   * On web, returns the geolocation permission status after prompting when possible.
   *
   * @since 8.0.0
   * @example
   * ```typescript
   * const { status } = await Permissions.requestPreciseLocation();
   * ```
   */
  requestPreciseLocation(): Promise<PermissionStatusResult>;

  /**
   * Returns the platform implementation version marker.
   *
   * @since 8.0.0
   */
  getPluginVersion(): Promise<PluginVersionResult>;
}
