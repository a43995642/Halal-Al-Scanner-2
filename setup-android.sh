#!/bin/bash


# Stop on error

set -e


echo "🚀 Starting Android SDK Setup for Codespaces..."


# 1. Install Java (JDK 17) and dependencies

echo "📦 Installing Java 17 and dependencies..."

sudo apt-get update

sudo apt-get install -y openjdk-17-jdk unzip wget


# 2. Define Paths

export ANDROID_HOME=$HOME/android-sdk

export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools


# 3. Create SDK Directory

echo "📂 Creating SDK directory at $ANDROID_HOME..."

mkdir -p $ANDROID_HOME/cmdline-tools


# 4. Download Command Line Tools

echo "⬇️ Downloading Android Command Line Tools..."

cd $ANDROID_HOME/cmdline-tools

wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -O cmdline-tools.zip


# 5. Unzip and Restructure (Critical step for sdkmanager)

echo "extracting..."

unzip -q cmdline-tools.zip

mv cmdline-tools latest

rm cmdline-tools.zip


# 6. Accept Licenses and Install Platform Tools

echo "📜 Accepting Licenses and installing Platform Tools..."

yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null

$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"


# 7. Create local.properties in the project android folder

echo "⚙️ Configuring local.properties..."

PROJECT_ROOT="/workspaces/My-Halal-App" # Adjust if your folder name is different

echo "sdk.dir=$ANDROID_HOME" > $PROJECT_ROOT/android/local.properties


# 8. Set Environment Variables for current session

echo "export ANDROID_HOME=$ANDROID_HOME" >> $HOME/.bashrc

echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> $HOME/.bashrc


echo "✅ Android SDK setup complete!"

echo "⚠️ Please run: 'source ~/.bashrc' to update your current terminal session, or close and reopen the terminal."

