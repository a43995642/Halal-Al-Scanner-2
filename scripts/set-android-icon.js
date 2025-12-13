
import { copyFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

// Source icon (Must be high quality, preferably 512x512 or 1024x1024)
const sourceIcon = resolve('icon.png');
// Android Resources path
const androidRes = resolve('android', 'app', 'src', 'main', 'res');

console.log('🎨 Starting Android Icon Update...');

if (!existsSync(sourceIcon)) {
    console.error('❌ Error: icon.png not found in the root directory!');
    process.exit(1);
}

if (!existsSync(androidRes)) {
    console.error('❌ Error: Android project structure not found. Run "npx cap add android" first.');
    process.exit(1);
}

const mipmaps = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];

mipmaps.forEach(folder => {
    const folderPath = join(androidRes, folder);
    
    // Create folder if it doesn't exist (handled by ensure-android-structure.js usually, but good for safety)
    if (!existsSync(folderPath)) {
        try {
            // import { mkdirSync } from 'fs'; // Dynamic import or assume exists
            // mkdirSync(folderPath, { recursive: true });
        } catch (e) {}
    }

    if (existsSync(folderPath)) {
        try {
            // 1. Replace Standard Launcher Icon
            copyFileSync(sourceIcon, join(folderPath, 'ic_launcher.png'));
            
            // 2. Replace Round Launcher Icon (Used by Pixel and newer phones)
            copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_round.png'));
            
            // 3. Replace Foreground (For Adaptive Icons)
            // This is a "brute force" method. Ideally, you generate adaptive icons, 
            // but overwriting the foreground PNG usually forces the app to show your logo 
            // centered on the background.
            copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_foreground.png'));

            console.log(`✅ Updated icons in: ${folder}`);
        } catch (e) {
            console.error(`⚠️ Failed to update ${folder}:`, e.message);
        }
    } else {
        console.warn(`⚠️ Skipped ${folder} (Folder not found)`);
    }
});

console.log('🚀 Android icons updated successfully!');
