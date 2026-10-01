import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { PermissionsWeb } from './web';

describe('PermissionsWeb', () => {
  const plugin = new PermissionsWeb();
  const originalNavigator = globalThis.navigator;
  const originalNotification = globalThis.Notification;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    if (originalNotification === undefined) {
      delete (globalThis as { Notification?: unknown }).Notification;
    } else {
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        value: originalNotification,
      });
    }
  });

  it('returns the web implementation version', async () => {
    await expect(plugin.getPluginVersion()).resolves.toEqual({ version: 'web' });
  });

  it('never shows a rationale on web', async () => {
    await expect(plugin.shouldShowRationale({ permission: 'camera' })).resolves.toEqual({
      shouldShow: false,
    });
  });

  it('rejects openSettings on web', async () => {
    await expect(plugin.openSettings()).rejects.toMatchObject({ code: 'UNIMPLEMENTED' });
    await expect(plugin.openSettings({ type: 'notifications' })).rejects.toMatchObject({
      code: 'UNIMPLEMENTED',
    });
  });

  it('maps Permissions API prompt states to denied', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        permissions: {
          query: async () => ({ state: 'prompt' }),
        },
      },
    });
    await expect(plugin.check({ permission: 'camera' })).resolves.toEqual({ status: 'denied' });
  });

  it('maps Permissions API denied states to blocked', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        permissions: {
          query: async () => ({ state: 'denied' }),
        },
      },
    });
    await expect(plugin.check({ permission: 'microphone' })).resolves.toEqual({ status: 'blocked' });
  });

  it('reports unavailable when the permission is not queryable on web', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });
    await expect(plugin.check({ permission: 'contacts' })).resolves.toEqual({ status: 'unavailable' });
  });

  it('checkMultiple returns one entry per permission', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        permissions: {
          query: async () => ({ state: 'granted' }),
        },
      },
    });
    const result = await plugin.checkMultiple({
      permissions: ['camera', 'microphone'],
    });
    expect(result.statuses.camera).toBe('granted');
    expect(result.statuses.microphone).toBe('granted');
  });

  it('requestPreciseLocation delegates to locationWhenInUse', async () => {
    const geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: {} as GeolocationCoordinates,
          timestamp: Date.now(),
        });
      },
    };
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { geolocation },
    });
    await expect(plugin.requestPreciseLocation()).resolves.toEqual({ status: 'granted' });
  });

  describe('notifications', () => {
    beforeEach(() => {
      class MockNotification {
        static permission = 'default';
        static async requestPermission() {
          return 'granted';
        }
      }
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        value: MockNotification,
      });
    });

    it('requests notification permission when supported', async () => {
      await expect(plugin.request({ permission: 'notifications' })).resolves.toEqual({
        status: 'granted',
      });
    });
  });
});
