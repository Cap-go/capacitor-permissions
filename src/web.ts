import { WebPlugin } from '@capacitor/core';

import type {
  AppPermissionState,
  MultiplePermissionOptions,
  MultiplePermissionStatusResult,
  PermissionName,
  PermissionOptions,
  PermissionStatusResult,
  PermissionsPlugin,
  PluginVersionResult,
  ShouldShowRationaleResult,
} from './definitions';

const QUERY_NAME: Partial<Record<PermissionName, PermissionName | string>> = {
  camera: 'camera',
  microphone: 'microphone',
  locationWhenInUse: 'geolocation',
  locationAlways: 'geolocation',
  notifications: 'notifications',
};

/**
 * Maps browser permission query states to plugin status values.
 */
function mapPermissionStatus(state: string): AppPermissionState {
  if (state === 'granted') {
    return 'granted';
  }
  if (state === 'denied') {
    return 'blocked';
  }
  if (state === 'prompt' || state === 'prompt-with-rationale') {
    return 'denied';
  }
  return 'unavailable';
}

/**
 * Web implementation of the permissions plugin.
 */
export class PermissionsWeb extends WebPlugin implements PermissionsPlugin {
  /** @inheritdoc */
  async check(options: PermissionOptions): Promise<PermissionStatusResult> {
    return { status: await this.readStatus(options.permission) };
  }

  /** @inheritdoc */
  async request(options: PermissionOptions): Promise<PermissionStatusResult> {
    const { permission } = options;
    try {
      if (permission === 'notifications' && typeof Notification !== 'undefined') {
        const result = await Notification.requestPermission();
        return { status: result === 'granted' ? 'granted' : result === 'denied' ? 'blocked' : 'denied' };
      }
      if ((permission === 'camera' || permission === 'microphone') && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: permission === 'camera',
          audio: permission === 'microphone',
        });
        stream.getTracks().forEach((track) => track.stop());
        return { status: 'granted' };
      }
      if ((permission === 'locationWhenInUse' || permission === 'locationAlways') && navigator.geolocation) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            (err) => reject(err),
            { maximumAge: 0, timeout: 10000 },
          );
        });
        return { status: 'granted' };
      }
    } catch {
      return { status: await this.readStatus(permission) };
    }
    return { status: await this.readStatus(permission) };
  }

  /** @inheritdoc */
  async checkMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult> {
    const statuses: Record<string, AppPermissionState> = {};
    for (const permission of options.permissions) {
      statuses[permission] = await this.readStatus(permission);
    }
    return { statuses };
  }

  /** @inheritdoc */
  async requestMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult> {
    const statuses: Record<string, AppPermissionState> = {};
    for (const permission of options.permissions) {
      statuses[permission] = (await this.request({ permission })).status;
    }
    return { statuses };
  }

  /** @inheritdoc */
  async shouldShowRationale(): Promise<ShouldShowRationaleResult> {
    return { shouldShow: false };
  }

  /** @inheritdoc */
  async openSettings(): Promise<void> {
    throw this.unimplemented('openSettings is not available on web');
  }

  /** @inheritdoc */
  async requestPreciseLocation(): Promise<PermissionStatusResult> {
    return this.request({ permission: 'locationWhenInUse' });
  }

  /** @inheritdoc */
  async getPluginVersion(): Promise<PluginVersionResult> {
    return { version: 'web' };
  }

  /**
   * Reads the current browser permission state when the Permissions API supports it.
   */
  private async readStatus(permission: PermissionName): Promise<AppPermissionState> {
    const queryName = QUERY_NAME[permission];
    if (!queryName || !navigator.permissions?.query) {
      return 'unavailable';
    }
    try {
      const result = await navigator.permissions.query({
        name: queryName as PermissionName,
      } as PermissionDescriptor);
      return mapPermissionStatus(result.state);
    } catch {
      return 'unavailable';
    }
  }
}
