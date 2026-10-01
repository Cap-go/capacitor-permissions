import { WebPlugin } from '@capacitor/core';

import type {
  MultiplePermissionOptions,
  MultiplePermissionStatusResult,
  PermissionName,
  PermissionOptions,
  AppPermissionState,
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

export class PermissionsWeb extends WebPlugin implements PermissionsPlugin {
  async check(options: PermissionOptions): Promise<PermissionStatusResult> {
    return { status: await this.readStatus(options.permission) };
  }

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

  async checkMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult> {
    const statuses: Record<string, AppPermissionState> = {};
    for (const permission of options.permissions) {
      statuses[permission] = await this.readStatus(permission);
    }
    return { statuses };
  }

  async requestMultiple(options: MultiplePermissionOptions): Promise<MultiplePermissionStatusResult> {
    const statuses: Record<string, AppPermissionState> = {};
    for (const permission of options.permissions) {
      statuses[permission] = (await this.request({ permission })).status;
    }
    return { statuses };
  }

  async shouldShowRationale(): Promise<ShouldShowRationaleResult> {
    return { shouldShow: false };
  }

  async openSettings(): Promise<void> {
    throw this.unimplemented('openSettings is not available on web');
  }

  async requestPreciseLocation(): Promise<PermissionStatusResult> {
    return this.request({ permission: 'locationWhenInUse' });
  }

  async getPluginVersion(): Promise<PluginVersionResult> {
    return { version: 'web' };
  }

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
