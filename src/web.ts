import { WebPlugin } from '@capacitor/core';

import type { EchoOptions, EchoResult, PermissionsPlugin, PluginVersionResult } from './definitions';

export class PermissionsWeb extends WebPlugin implements PermissionsPlugin {
  async echo(options: EchoOptions): Promise<EchoResult> {
    return options;
  }

  async getPluginVersion(): Promise<PluginVersionResult> {
    return {
      version: 'web',
    };
  }
}
