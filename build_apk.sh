#!/bin/bash

# --- 1. JAVA VERSION CHECK ---
JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
echo "☕ Current Java Version: $JAVA_VER"

echo "⚠️  STORAGE WARNING: This script will install the Android SDK (~2GB) and Gradle (~1GB)."
echo "   If you want to avoid this usage, use 'npx eas-cli build' instead."
read -p "   Press Enter to continue or Ctrl+C to cancel..."

if [[ "$JAVA_VER" == "25"* ]]; then
  echo "⚠️  WARNING: Java 25 is detected. Android builds often fail with Java 25."
  echo "ℹ️  Please install Java 17 (OpenJDK 17) for a stable build."
  echo "   brew install openjdk@17"
  echo "   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
  exit 1
fi

# --- 2. ANDROID SDK SETUP ---
SDK_DIR="$HOME/Library/Android/sdk"

if [ ! -d "$SDK_DIR" ]; then
    echo "❌ Android SDK not found at $SDK_DIR"
    echo "📦 installing android-commandlinetools via Homebrew..."
    
    brew install --cask android-commandlinetools
    
    # Homebrew Cask location on Apple Silicon vs Intel
    if [ -d "/opt/homebrew/share/android-commandlinetools" ]; then
        CMD_TOOLS_PATH="/opt/homebrew/share/android-commandlinetools"
    else
        CMD_TOOLS_PATH="/usr/local/share/android-commandlinetools"
    fi
    
    # We need to manually construct the SDK structure Gradle expects
    # Gradle expects: $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager
    mkdir -p "$SDK_DIR/cmdline-tools"
    
    echo "Linking cmdline-tools..."
    # Use the first version found installed by brew (usually only one)
    # The brew path is .../android-commandlinetools/<version>/
    # But often brew just links the binary. 
    # Let's try locating sdkmanager directly.
    SDKMANAGER=$(which sdkmanager)
    
    if [ -z "$SDKMANAGER" ]; then
        echo "Trying to locate sdkmanager from brew installation..."
        # Fallback search
        SDKMANAGER=$(find $CMD_TOOLS_PATH -name sdkmanager | head -n 1)
    fi
    
    if [ -z "$SDKMANAGER" ]; then
       echo "❌ Could not find sdkmanager. Installation failed."
       exit 1
    fi

    echo "✅ Found sdkmanager at: $SDKMANAGER"
    
    # Set proper environment for sdkmanager to populate our custom SDK_DIR
    export ANDROID_HOME="$SDK_DIR"
    export ANDROID_SDK_ROOT="$SDK_DIR"
    
    echo "📝 Accepting Licenses & Installing Essential SDK Components..."
    yes | "$SDKMANAGER" --sdk_root="$SDK_DIR" --licenses
    "$SDKMANAGER" --sdk_root="$SDK_DIR" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
fi

export ANDROID_HOME="$SDK_DIR"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

# --- 3. PROJECT SETUP ---
echo "📝 Configuring local.properties..."
echo "sdk.dir=$SDK_DIR" > android/local.properties

echo "🚀 Starting Prebuild..."
npx expo prebuild --platform android --clean

echo "📦 Building APK with Gradle..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo "✅ Build Attempt Completed."
echo "If successful, APK is at: android/app/build/outputs/apk/debug/app-debug.apk"
