
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const manifestPath = join('android', 'app', 'src', 'main', 'AndroidManifest.xml');

console.log('🔧 Checking AndroidManifest.xml settings...');

if (existsSync(manifestPath)) {
  let content = readFileSync(manifestPath, 'utf-8');
  let hasChanges = false;

  // 1. Ensure permissions exist (Previous logic)
  const permissions = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.CAMERA" />'
  ];

  permissions.forEach(perm => {
    if (!content.includes(perm)) {
       const tagName = perm.match(/android:name="([^"]+)"/)[1];
       content = content.replace('<application', `${perm}\n    <application`);
       console.log(`✅ Injected permission: ${tagName}`);
       hasChanges = true;
    }
  });

  // 2. Force Icon Attributes in <application> tag
  // This ensures we are pointing to @mipmap/ic_launcher which we just updated
  if (!content.includes('android:icon="@mipmap/ic_launcher"')) {
      // If it has another icon setting, replace it, otherwise add it (simplified regex replacement)
      if (content.includes('android:icon=')) {
          content = content.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/ic_launcher"');
      } else {
          content = content.replace('<application', '<application android:icon="@mipmap/ic_launcher"');
      }
      console.log('✅ Enforced android:icon="@mipmap/ic_launcher"');
      hasChanges = true;
  }

  if (!content.includes('android:roundIcon="@mipmap/ic_launcher_round"')) {
      if (content.includes('android:roundIcon=')) {
          content = content.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/ic_launcher_round"');
      } else {
          content = content.replace('<application', '<application android:roundIcon="@mipmap/ic_launcher_round"');
      }
      console.log('✅ Enforced android:roundIcon="@mipmap/ic_launcher_round"');
      hasChanges = true;
  }

  // 3. Cleartext Traffic
  if (!content.includes('android:usesCleartextTraffic="true"')) {
    if (content.includes('android:usesCleartextTraffic=')) {
        // already exists, maybe false? force true
        content = content.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="true"');
    } else {
        content = content.replace('<application', '<application android:usesCleartextTraffic="true"');
    }
    console.log('✅ Enforced Cleartext Traffic support');
    hasChanges = true;
  }

  if (hasChanges) {
    writeFileSync(manifestPath, content);
    console.log('💾 AndroidManifest.xml updated successfully.');
  } else {
    console.log('👍 Manifest is already correct.');
  }
} else {
  console.error(`❌ Manifest file not found at: ${manifestPath}.`);
}
