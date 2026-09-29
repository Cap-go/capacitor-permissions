import './style.css';

import { Capacitor } from '@capacitor/core';
import { Permissions } from '@capgo/capacitor-permissions';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const DEMO_PERMISSIONS = [
  'camera',
  'microphone',
  'notifications',
  'locationWhenInUse',
  'photoLibrary',
];

const output = document.getElementById('plugin-output');
const select = document.getElementById('permission-select');

const setOutput = (value) => {
  output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const selected = () => /** @type {import('@capgo/capacitor-permissions').PermissionName} */ (select.value);

if (Capacitor.isNativePlatform()) {
  void CapacitorUpdater.notifyAppReady().catch((error) => {
    console.error('CapacitorUpdater.notifyAppReady failed', error);
  });
}

document.getElementById('check-one').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.check({ permission: selected() }));
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('request-one').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.request({ permission: selected() }));
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('check-several').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.checkMultiple({ permissions: DEMO_PERMISSIONS }));
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('request-several').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.requestMultiple({ permissions: DEMO_PERMISSIONS }));
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('rationale').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.shouldShowRationale({ permission: selected() }));
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('open-settings').addEventListener('click', async () => {
  try {
    await Permissions.openSettings({ type: 'application' });
    setOutput({ opened: true, type: 'application' });
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('precise-location').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.requestPreciseLocation());
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});

document.getElementById('get-version').addEventListener('click', async () => {
  try {
    setOutput(await Permissions.getPluginVersion());
  } catch (error) {
    setOutput(`Error: ${error?.message ?? error}`);
  }
});
