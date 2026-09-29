#!/usr/bin/env node
/**
 * Opt-in native permission declarations for host apps.
 *
 * Usage:
 *   node scripts/apply-permissions.mjs --project <app-dir> --permissions camera,microphone,...
 *
 * Idempotent: re-running with the same permissions does not duplicate entries.
 */

import fs from 'node:fs';
import path from 'node:path';

const PERMISSION_MAP = {
  camera: {
    android: ['android.permission.CAMERA'],
    ios: { NSCameraUsageDescription: 'This app needs camera access.' },
  },
  microphone: {
    android: ['android.permission.RECORD_AUDIO'],
    ios: { NSMicrophoneUsageDescription: 'This app needs microphone access.' },
  },
  photoLibrary: {
    android: [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    ios: { NSPhotoLibraryUsageDescription: 'This app needs photo library access.' },
  },
  photoLibraryAddOnly: {
    android: ['android.permission.WRITE_EXTERNAL_STORAGE'],
    ios: { NSPhotoLibraryAddUsageDescription: 'This app needs to save photos.' },
  },
  contacts: {
    android: ['android.permission.READ_CONTACTS'],
    ios: { NSContactsUsageDescription: 'This app needs contacts access.' },
  },
  calendar: {
    android: ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'],
    ios: {
      NSCalendarsUsageDescription: 'This app needs calendar access.',
      NSCalendarsFullAccessUsageDescription: 'This app needs calendar access.',
    },
  },
  reminders: {
    android: [],
    ios: {
      NSRemindersUsageDescription: 'This app needs reminders access.',
      NSRemindersFullAccessUsageDescription: 'This app needs reminders access.',
    },
  },
  locationWhenInUse: {
    android: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'],
    ios: { NSLocationWhenInUseUsageDescription: 'This app needs your location.' },
  },
  locationAlways: {
    android: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ],
    ios: {
      NSLocationWhenInUseUsageDescription: 'This app needs your location.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs background location.',
    },
  },
  bluetooth: {
    android: [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
    ],
    ios: { NSBluetoothAlwaysUsageDescription: 'This app needs Bluetooth access.' },
  },
  motion: {
    android: ['android.permission.ACTIVITY_RECOGNITION'],
    ios: { NSMotionUsageDescription: 'This app needs motion access.' },
  },
  notifications: {
    android: ['android.permission.POST_NOTIFICATIONS'],
    ios: {},
  },
  speechRecognition: {
    android: ['android.permission.RECORD_AUDIO'],
    ios: {
      NSSpeechRecognitionUsageDescription: 'This app needs speech recognition.',
      NSMicrophoneUsageDescription: 'This app needs microphone access for speech.',
    },
  },
  appTrackingTransparency: {
    android: [],
    ios: { NSUserTrackingUsageDescription: 'This app uses tracking to improve ads.' },
  },
  activityRecognition: {
    android: ['android.permission.ACTIVITY_RECOGNITION'],
    ios: {},
  },
  phone: {
    android: ['android.permission.READ_PHONE_STATE'],
    ios: {},
  },
  sms: {
    android: ['android.permission.READ_SMS', 'android.permission.RECEIVE_SMS'],
    ios: {},
  },
  mediaAudio: {
    android: ['android.permission.READ_MEDIA_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE'],
    ios: {},
  },
  mediaImages: {
    android: [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    ios: {},
  },
  mediaVideo: {
    android: ['android.permission.READ_MEDIA_VIDEO', 'android.permission.READ_EXTERNAL_STORAGE'],
    ios: {},
  },
};

function parseArgs(argv) {
  let project = null;
  let permissions = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') {
      project = argv[++i];
    } else if (arg === '--permissions') {
      permissions = String(argv[++i] || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }
  return { project, permissions };
}

function ensureAndroidPermissions(manifestPath, androidPerms) {
  let xml = fs.readFileSync(manifestPath, 'utf8');
  const missing = androidPerms.filter((perm) => !xml.includes(`android:name="${perm}"`));
  if (missing.length === 0) {
    return false;
  }
  const lines = missing.map((perm) => `    <uses-permission android:name="${perm}" />`).join('\n');
  if (/<manifest[^>]*>\s*<\/manifest>/.test(xml)) {
    xml = xml.replace(/<manifest([^>]*)>\s*<\/manifest>/, `<manifest$1>\n${lines}\n</manifest>`);
  } else {
    xml = xml.replace(/<manifest([^>]*)>/, `<manifest$1>\n${lines}`);
  }
  fs.writeFileSync(manifestPath, xml);
  return true;
}

function ensureIosKeys(plistPath, keys) {
  let plist = fs.readFileSync(plistPath, 'utf8');
  let changed = false;
  for (const [key, value] of Object.entries(keys)) {
    if (plist.includes(`<key>${key}</key>`)) {
      continue;
    }
    const entry = `	<key>${key}</key>\n	<string>${value}</string>\n`;
    if (plist.includes('</dict>')) {
      plist = plist.replace(/<\/dict>\s*<\/plist>/, `${entry}</dict>\n</plist>`);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(plistPath, plist);
  }
  return changed;
}

function main() {
  const { project, permissions } = parseArgs(process.argv.slice(2));
  if (!project || permissions.length === 0) {
    console.error(
      'Usage: node scripts/apply-permissions.mjs --project <app-dir> --permissions camera,microphone,...',
    );
    process.exit(1);
  }

  const root = path.resolve(project);
  const androidPerms = new Set();
  const iosKeys = {};

  for (const name of permissions) {
    const entry = PERMISSION_MAP[name];
    if (!entry) {
      console.warn(`Unknown permission: ${name}`);
      continue;
    }
    for (const perm of entry.android) {
      androidPerms.add(perm);
    }
    Object.assign(iosKeys, entry.ios);
  }

  const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
  const plistPath = path.join(root, 'ios/App/App/Info.plist');

  if (fs.existsSync(manifestPath) && androidPerms.size > 0) {
    const changed = ensureAndroidPermissions(manifestPath, [...androidPerms]);
    console.log(changed ? `Updated ${manifestPath}` : `Android manifest already up to date`);
  } else if (!fs.existsSync(manifestPath)) {
    console.log(`Skip Android: ${manifestPath} not found`);
  }

  if (fs.existsSync(plistPath) && Object.keys(iosKeys).length > 0) {
    const changed = ensureIosKeys(plistPath, iosKeys);
    console.log(changed ? `Updated ${plistPath}` : `Info.plist already up to date`);
  } else if (!fs.existsSync(plistPath)) {
    console.log(`Skip iOS: ${plistPath} not found`);
  }
}

main();
