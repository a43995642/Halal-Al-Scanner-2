import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const manifestPath = join('android', 'app', 'src', 'main', 'AndroidManifest.xml');

console.log('🔧 Checking AndroidManifest.xml for permissions...');

if (existsSync(manifestPath)) {
  let content = readFileSync(manifestPath, 'utf-8');
  let hasChanges = false;

  // 1. Add Internet Permission
  if (!content.includes('android.permission.INTERNET')) {
    const permissionTag = '<uses-permission android:name="android.permission.INTERNET" />';
    content = content.replace('<application', `${permissionTag}\n    <application`);
    console.log('✅ Injected: android.permission.INTERNET');
    hasChanges = true;
  }

  // 2. Add Network State Permission (Helps some libs check if online)
  if (!content.includes('android.permission.ACCESS_NETWORK_STATE')) {
    const permissionTag = '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />';
    content = content.replace('<application', `${permissionTag}\n    <application`);
    console.log('✅ Injected: android.permission.ACCESS_NETWORK_STATE');
    hasChanges = true;
  }

  // 3. Add Camera Permission
  if (!content.includes('android.permission.CAMERA')) {
    const permissionTag = '<uses-permission android:name="android.permission.CAMERA" />';
    content = content.replace('<application', `${permissionTag}\n    <application`);
    console.log('✅ Injected: android.permission.CAMERA');
    hasChanges = true;
  }

  // 4. Add Camera Feature
  if (!content.includes('android.hardware.camera')) {
    const featureTag = '<uses-feature android:name="android.hardware.camera" android:required="false" />';
    content = content.replace('<application', `${featureTag}\n    <application`);
    console.log('✅ Injected: android.hardware.camera');
    hasChanges = true;
  }

  // 5. Enable Cleartext Traffic (Safety net for mixed content or redirects, though we use HTTPS)
  if (!content.includes('android:usesCleartextTraffic="true"')) {
    content = content.replace('<application', '<application android:usesCleartextTraffic="true"');
    console.log('✅ Injected: android:usesCleartextTraffic="true"');
    hasChanges = true;
  }

  if (hasChanges) {
    writeFileSync(manifestPath, content);
    console.log('💾 AndroidManifest.xml updated successfully.');
  } else {
    console.log('👍 Permissions already present.');
  }
} else {
  console.error(`❌ Manifest file not found at: ${manifestPath}. Make sure "npx cap add android" ran successfully.`);
}
