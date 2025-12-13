
import { copyFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const sourceIcon = resolve('icon.png');
const androidRes = resolve('android', 'app', 'src', 'main', 'res');

console.log('🎨 Starting Aggressive Android Icon Update...');

if (!existsSync(sourceIcon)) {
    console.error('❌ Error: icon.png not found in the root directory!');
    process.exit(1);
}

if (!existsSync(androidRes)) {
    console.error('❌ Error: Android project structure not found. Run "npx cap add android" first.');
    process.exit(1);
}

// Helper to ensure dir exists
const ensureDir = (dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

// Helper to delete ANY file starting with prefix (prevents xml vs png conflict)
const removeConflicts = (dir, prefix) => {
    if (!existsSync(dir)) return;
    try {
        const files = readdirSync(dir);
        files.forEach(file => {
            if (file.startsWith(prefix)) {
                const fullPath = join(dir, file);
                unlinkSync(fullPath);
                console.log(`🗑️  Deleted conflict: ${file}`);
            }
        });
    } catch (e) {
        console.warn(`⚠️  Warning cleaning ${dir}: ${e.message}`);
    }
};

// 1. Clean Up EVERYTHING related to icons
const dirsToClean = [
    'drawable',
    'drawable-v24',
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi',
    'mipmap-anydpi-v26'
];

dirsToClean.forEach(d => {
    const dirPath = join(androidRes, d);
    removeConflicts(dirPath, 'ic_launcher'); // Deletes ic_launcher.xml, ic_launcher.png, foreground, background...
});

// 2. Setup Adaptive Icons (Android 8+)
const drawableFolder = join(androidRes, 'drawable');
const anyDpiFolder = join(androidRes, 'mipmap-anydpi-v26');
const valuesFolder = join(androidRes, 'values');

ensureDir(drawableFolder);
ensureDir(anyDpiFolder);
ensureDir(valuesFolder);

// A. Copy Source Icon as Foreground
// We use the full icon as foreground. Ideally, this should be transparent, but this works for full-bleed too.
copyFileSync(sourceIcon, join(drawableFolder, 'ic_launcher_foreground.png'));
console.log('✅ Created drawable/ic_launcher_foreground.png');

// B. Define Background Color (Emerald Green)
const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#059669</color>
</resources>`;
writeFileSync(join(valuesFolder, 'ic_launcher_background.xml'), colorsXmlContent);
console.log('✅ Created values/ic_launcher_background.xml');

// C. Generate Adaptive Icon XML
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

writeFileSync(join(anyDpiFolder, 'ic_launcher.xml'), adaptiveIconXml);
writeFileSync(join(anyDpiFolder, 'ic_launcher_round.xml'), adaptiveIconXml);
console.log('✅ Generated Adaptive Icon XMLs in mipmap-anydpi-v26');

// 3. Update Standard PNGs (Legacy Android & Fallbacks)
// We copy the PNG to all mipmap folders so older Androids (or contexts avoiding XML) find the image.
const mipmapFolders = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];

mipmapFolders.forEach(folder => {
    const folderPath = join(androidRes, folder);
    ensureDir(folderPath);
    
    copyFileSync(sourceIcon, join(folderPath, 'ic_launcher.png'));
    copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_round.png'));
    // Backup foreground for legacy adaptive setups
    copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_foreground.png')); 
});
console.log('✅ Legacy PNG icons restored to all mipmap folders');

// 4. Update Splash Screen (Bonus Fix)
// Sometimes "Default Icon" complaints are actually about the splash screen.
// We overwrite the default splash images with the icon to be safe.
const splashDirs = ['drawable', 'drawable-port', 'drawable-land'];
splashDirs.forEach(d => {
    const dir = join(androidRes, d);
    if (existsSync(dir)) {
        // Look for splash.png and overwrite it
        if (existsSync(join(dir, 'splash.png'))) {
             copyFileSync(sourceIcon, join(dir, 'splash.png'));
             console.log(`✅ Updated splash screen in ${d}`);
        }
    }
});

console.log('🚀 Android icons & splash completely updated!');
