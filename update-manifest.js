import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const manifestPath = join('android', 'app', 'src', 'main', 'AndroidManifest.xml');

console.log('🔧 Checking AndroidManifest.xml for permissions...');

if (existsSync(manifestPath)) {
  let content = readFileSync(manifestPath, 'utf-8');
  let hasChanges = false;

  // Check and add Camera Permission
  if (!content.includes('android.permission.CAMERA')) {
    const permissionTag = '<uses-permission android:name="android.permission.CAMERA" />';
    // Insert before <application> tag
    content = content.replace('<application', `${permissionTag}\n    <application`);
    console.log('✅ Injected: android.permission.CAMERA');
    hasChanges = true;
  }

  // Check and add Camera Feature
  if (!content.includes('android.hardware.camera')) {
    const featureTag = '<uses-feature android:name="android.hardware.camera" android:required="false" />';
    // Insert before <application> tag
    content = content.replace('<application', `${featureTag}\n    <application`);
    console.log('✅ Injected: android.hardware.camera');
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
