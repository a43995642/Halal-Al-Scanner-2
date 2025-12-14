
import { copyFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const sourceIcon = resolve('icon.png');
const androidRes = resolve('android', 'app', 'src', 'main', 'res');

console.log('🎨 Starting FORCE PNG Icon Update...');

if (!existsSync(sourceIcon)) {
    console.error('❌ Error: icon.png not found in the root directory!');
    process.exit(1);
}

if (!existsSync(androidRes)) {
    console.error('❌ Error: Android project structure not found.');
    process.exit(1);
}

// Helper to delete a specific file
const deleteFile = (path) => {
    if (existsSync(path)) {
        try {
            unlinkSync(path);
            console.log(`🗑️  Deleted: ${path}`);
        } catch (e) {
            console.warn(`⚠️  Failed to delete ${path}`);
        }
    }
};

// Helper to ensure dir exists
const ensureDir = (dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

// 1. NUCLEAR OPTION: Remove Adaptive Icon XML Definitions
// These folders contain XML files that point to the "Green Robot" vectors.
// By removing them, we force Android to fall back to the raw PNGs we provide below.
const anyDpiFolder = join(androidRes, 'mipmap-anydpi-v26');
if (existsSync(anyDpiFolder)) {
    console.log('🔥 Removing adaptive icon XMLs (mipmap-anydpi-v26) to prevent default robot...');
    try {
        rmSync(anyDpiFolder, { recursive: true, force: true });
    } catch (e) {
        // Fallback for older Node versions if rmSync fails
        const files = readdirSync(anyDpiFolder);
        files.forEach(f => deleteFile(join(anyDpiFolder, f)));
    }
}

// 2. Remove Vector Drawables (The Robot itself) from drawable folders
const drawableDirs = ['drawable', 'drawable-v24'];
drawableDirs.forEach(dir => {
    const fullPath = join(androidRes, dir);
    if (existsSync(fullPath)) {
        const files = readdirSync(fullPath);
        files.forEach(file => {
            if (file.includes('ic_launcher') || file.includes('foreground') || file.includes('background')) {
                deleteFile(join(fullPath, file));
            }
        });
    }
});

// 3. Populate Standard Mipmap Folders with PNGs
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

    // Clean existing
    try {
        const files = readdirSync(folderPath);
        files.forEach(f => {
            if (f.startsWith('ic_launcher')) deleteFile(join(folderPath, f));
        });
    } catch (e) {}
    
    // Copy New Icon
    try {
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher.png'));
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_round.png'));
        // Copy as foreground too just in case a stray XML references it
        copyFileSync(sourceIcon, join(folderPath, 'ic_launcher_foreground.png')); 
        console.log(`✅ Updated PNGs in ${folder}`);
    } catch (e) {
        console.error(`❌ Failed to copy to ${folder}:`, e);
    }
});

console.log('🚀 Android Icon Update Complete (Legacy PNG Mode Enforced)');
