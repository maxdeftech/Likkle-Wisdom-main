# Android Build Fix - February 12, 2026

## Problem
The Android build was failing with multiple Java version compatibility errors:
- IDE linter error: "Could not run phased build action"
- Build error: "invalid source release: 21"
- Inconsistent JVM target compatibility between Java and Kotlin tasks

## Root Causes

### 1. Java Version Mismatch
The project was configured to use Java 17 (via `gradle.properties`), but several dependencies and Capacitor-generated files were hardcoded to Java 21:
- `@capacitor/push-notifications` plugin: `JavaVersion.VERSION_21`
- `@revenuecat/purchases-capacitor` plugin: `JavaVersion.VERSION_21` (both Java and Kotlin)
- `android/app/capacitor.build.gradle`: Auto-generated with `VERSION_21`

### 2. Insufficient Heap Memory
The default Gradle heap size (512 MiB) was too small for the build process, causing out-of-memory errors during DEX merging.

## Solutions Applied

### 1. Patched Plugin Build Files

#### @capacitor/push-notifications
**File**: `node_modules/@capacitor/push-notifications/android/build.gradle`
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
    targetCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
}
```

#### @revenuecat/purchases-capacitor
**File**: `node_modules/@revenuecat/purchases-capacitor/android/build.gradle`
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
    targetCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17  // Changed from JVM_21
    }
}
```

#### Capacitor Build Configuration
**File**: `android/app/capacitor.build.gradle`
```gradle
// PATCHED: Changed from VERSION_21 to VERSION_17 for compatibility
android {
  compileOptions {
      sourceCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
      targetCompatibility JavaVersion.VERSION_17  // Changed from VERSION_21
  }
}
```

### 2. Updated App Build Configuration

#### android/app/build.gradle
Added explicit Java version compatibility:
```gradle
android {
    // ... other config ...
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

### 3. Configured Gradle Properties

#### android/gradle.properties
Created/updated with:
```properties
# Java version compatibility
org.gradle.java.home=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Increased heap memory for build process
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8

# Android configuration
android.useAndroidX=true
android.enableJetifier=true
```

## Important Notes

### Node Modules Patches
The patches to `node_modules/@capacitor/push-notifications` and `node_modules/@revenuecat/purchases-capacitor` will be lost if you run `npm install` or `npm ci`. 

**To preserve these patches**, consider using one of these approaches:

#### Option 1: patch-package (Recommended)
```bash
npm install --save-dev patch-package
npx patch-package @capacitor/push-notifications
npx patch-package @revenuecat/purchases-capacitor
```

Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

#### Option 2: Manual Re-patch Script
Create a script to re-apply patches after `npm install`:
```bash
#!/bin/bash
# fix-android-java-version.sh

# Push Notifications
sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' \
  node_modules/@capacitor/push-notifications/android/build.gradle

# RevenueCat
sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' \
  node_modules/@revenuecat/purchases-capacitor/android/build.gradle
sed -i '' 's/JvmTarget.JVM_21/JvmTarget.JVM_17/g' \
  node_modules/@revenuecat/purchases-capacitor/android/build.gradle
```

### Capacitor Sync
The `android/app/capacitor.build.gradle` file is regenerated each time you run `npx cap sync`. After running `cap sync`, you'll need to re-patch this file:

```bash
# After npx cap sync, run:
sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' \
  android/app/capacitor.build.gradle
```

## Build Commands

### Development Build
```bash
cd android
./gradlew assembleDebug
```

### Release Build
```bash
cd android
./gradlew assembleRelease
```

### Clean Build
```bash
cd android
./gradlew clean assembleDebug
```

## Verification

After applying all fixes:
- ✅ Build completes successfully: `BUILD SUCCESSFUL in 28s`
- ✅ No Java version compatibility errors
- ✅ No out-of-memory errors
- ✅ APK generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Files Modified

### Project Files (Permanent)
- `android/app/build.gradle` - Added Java 17 compatibility
- `android/gradle.properties` - Added heap memory and Java home configuration

### Node Modules (Temporary - needs patch-package)
- `node_modules/@capacitor/push-notifications/android/build.gradle`
- `node_modules/@revenuecat/purchases-capacitor/android/build.gradle`

### Generated Files (Regenerated by cap sync)
- `android/app/capacitor.build.gradle`

## Related Issues

This fix also resolves:
- IDE linter errors in `build.gradle`
- Gradle daemon initialization errors
- DEX merging out-of-memory errors
- Kotlin/Java JVM target inconsistency warnings
