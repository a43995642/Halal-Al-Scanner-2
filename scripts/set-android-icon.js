
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const sourceIcon = resolve('icon.png');
const androidRes = resolve('android', 'app', 'src', 'main', 'res');

console.log('🎨 Starting Robust Android Icon Update...');

if (!existsSync(sourceIcon)) {
    console.error('❌ Error: icon.png not found in the root directory!');
    process.exit(1);
}

if (!existsSync(androidRes)) {
    console.error('❌ Error: Android project structure not found. Run "npx cap add android" first.');
    process.exit(1);
}

// 1. Define folders
const mipmapFolders = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];
const anyDpiFolder = join(androidRes, 'mipmap-anydpi-v26');
const drawableFolder = join(androidRes, 'drawable');
const valuesFolder = join(androidRes, 'values');

// Helper to ensure dir exists
const ensureDir = (dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

// 2. Update Standard PNGs (Legacy Android)
mipmapFolders.forEach(folder => {
    const folderPath = join(androidRes, folder);
    ensureDir(folderPath);
    
    try {
        // Overwrite legacy icons
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher.png'));
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_round.png'));
        
        // Also copy as foreground for safety in older adaptive setups
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_foreground.png'));
        
        console.log(`✅ Legacy icons updated in: ${folder}`);
    } catch (e) {
        console.warn(`⚠️ Failed to update ${folder}:`, e.message);
    }
});

// 3. Setup Adaptive Icons (Android 8+)
try {
    // A. Put the icon in 'drawable' to be used as the foreground
    ensureDir(drawableFolder);
    copyFileSync(sourceIcon, join(drawableFolder, 'ic_launcher_foreground.png'));
    console.log('✅ Adaptive foreground set in drawable/');

    // B. Define a background color (Emerald Green to match app)
    ensureDir(valuesFolder);
    const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#059669</color>
</resources>`;
    writeFileSync(join(valuesFolder, 'ic_launcher_background.xml'), colorsXmlContent);
    console.log('✅ Adaptive background color set in values/');

    // C. Create the XML definitions for Adaptive Icons
    ensureDir(anyDpiFolder);
    
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

    writeFileSync(join(anyDpiFolder, 'ic_launcher.xml'), adaptiveIconXml);
    writeFileSync(join(anyDpiFolder, 'ic_launcher_round.xml'), adaptiveIconXml);
    
    console.log('✅ Adaptive Icon XMLs generated in mipmap-anydpi-v26/');

} catch (e) {
    console.error('❌ Error setting up adaptive icons:', e);
}

console.log('🚀 Android icons completely updated!');
