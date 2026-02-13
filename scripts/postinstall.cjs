#!/usr/bin/env node
/**
 * Postinstall: create .settings for Capacitor Android plugins (fixes Java/Gradle IDE diagnostics)
 * and remove any leftover RevenueCat packages (not in package.json).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = [
  path.join(root, 'node_modules/@capacitor/android/capacitor/.settings'),
  path.join(root, 'node_modules/@capacitor/push-notifications/android/.settings'),
];

const prefsContent = 'eclipse.preferences.version=1\nconnection.project.dir=\n';
for (const d of dirs) {
  try {
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'org.eclipse.buildship.core.prefs'), prefsContent, 'utf8');
  } catch (_) {}
}

const revenuecat = path.join(root, 'node_modules/@revenuecat');
try {
  if (fs.existsSync(revenuecat)) {
    fs.rmSync(revenuecat, { recursive: true, force: true });
  }
} catch (_) {}
