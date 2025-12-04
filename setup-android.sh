#!/bin/bash

# إيقاف السكربت عند حدوث أي خطأ
set -e

echo "🚀 Starting Android Environment Setup..."

# 1. تحديد مسار SDK
export ANDROID_HOME=/usr/lib/android-sdk
export ANDROID_SDK_ROOT=/usr/lib/android-sdk

# 2. تحديث الحزم وتثبيت Java 17 و Android SDK
echo "📦 Installing Java 17 and Android SDK..."
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk android-sdk

# 3. إنشاء المجلدات وإصلاح الصلاحيات (لحل مشكلة رفض الوصول)
echo "🔓 Fixing permissions for $ANDROID_HOME..."
if [ ! -d "$ANDROID_HOME" ]; then
    sudo mkdir -p "$ANDROID_HOME"
fi
sudo chown -R $(whoami) "$ANDROID_HOME"
sudo chmod -R 777 "$ANDROID_HOME"

# 4. قبول التراخيص يدوياً (لتجنب الخطأ: Licences not accepted)
echo "📝 Accepting Android Licenses..."
mkdir -p "$ANDROID_HOME/licenses"
# كتابة التواقيع (Hashes) الخاصة بالتراخيص
echo "8933bad161af4178b1185d1a37fbf41ea5269c55" > "$ANDROID_HOME/licenses/android-sdk-license"
echo "d56f5187479451eabf01fb78af6dfcb131a6481e" >> "$ANDROID_HOME/licenses/android-sdk-license"
echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >> "$ANDROID_HOME/licenses/android-sdk-license"
echo "84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_HOME/licenses/android-sdk-preview-license"

# 5. إنشاء ملف local.properties الضروري لـ Gradle
echo "⚙️ Creating android/local.properties..."
mkdir -p android
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "✅ Android Environment Setup Complete!"
