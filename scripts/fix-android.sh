#!/bin/bash
set -e

# تحديد مسار SDK الافتراضي في Codespaces
ANDROID_SDK_ROOT="/usr/lib/android-sdk"

echo "🔧 Using Android SDK at: $ANDROID_SDK_ROOT"

# 1. إنشاء المجلد إذا لم يكن موجوداً
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "Creating SDK directory..."
        sudo mkdir -p "$ANDROID_SDK_ROOT"
        fi

        # 2. إصلاح الصلاحيات (مهم جداً للتحميل)
        echo "🔓 Fixing permissions..."
        sudo chown -R $(whoami) "$ANDROID_SDK_ROOT" || true
        sudo chmod -R 777 "$ANDROID_SDK_ROOT" || true

        # 3. إنشاء مجلد التراخيص
        mkdir -p "$ANDROID_SDK_ROOT/licenses"

        # 4. كتابة تواقيع التراخيص يدوياً (لتخطي الموافقة اليدوية)
        echo "📝 Accepting licenses..."
        echo "8933bad161af4178b1185d1a37fbf41ea5269c55" > "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
        echo "d56f5187479451eabf01fb78af6dfcb131a6481e" >> "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
        echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >> "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
        echo "84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_SDK_ROOT/licenses/android-sdk-preview-license"

        echo "✅ Android SDK licenses accepted successfully."
