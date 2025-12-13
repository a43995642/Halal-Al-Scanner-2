
import { copyFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
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

// Helper to delete file if exists
const removeFile = (path) => {
    if (existsSync(path)) {
        try {
            unlinkSync(path);
            console.log(`🗑️  Deleted conflicting file: ${path}`);
        } catch (e) {
            console.warn(`⚠️  Failed to delete ${path}:`, e.message);
        }
    }
};

// 2. Clean up Default Capacitor/Android Vectors
// These XML vectors (Android Robot) take precedence over PNGs if not removed.
ensureDir(drawableFolder);
removeFile(join(drawableFolder, 'ic_launcher_foreground.xml'));
removeFile(join(drawableFolder, 'ic_launcher_background.xml'));

// 3. Update Standard PNGs (Legacy Android)
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

// 4. Setup Adaptive Icons (Android 8+)
try {
    // A. Put the icon in 'drawable' to be used as the foreground
    // We strictly use the PNG now since we deleted the XML
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
    // These link the foreground (our PNG) and background (our Color)
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
