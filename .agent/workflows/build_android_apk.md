---
description: Build Android APK and iOS App for local testing
---

# Build Application for Testing

This workflow guides you through building a standalone APK for Android and a Simulator build for iOS using EAS.

## Prerequisites
- You need a free Expo account interactively logged in.
- **Android**: The `.apk` can be installed on any Android device.
- **iOS**: The build uses the **Simulator** profile. To run it, you need a Mac with Xcode Simulator or unzip the file to inspect. *Note: Installing on a real physical iOS device requires a paid Apple Developer Account ($99/yr).*

## Steps

1.  **Configure Build**
    (Skip if you've already configured `eas.json` with the `preview` profile).

2.  **Build Android APK**
    ```bash
    eas build -p android --profile preview
    ```
    - Once finished, download the `.apk` and install it on your phone.

3.  **Build iOS Simulator App**
    ```bash
    eas build -p ios --profile preview
    ```
    - Once finished, you will get a `.tar.gz` file.
    - Extract it to get the `.app` file.
    - Drag and drop this `.app` onto your iOS Simulator to install.

4.  **Build Both Simultaneously**
    ```bash
    eas build -p all --profile preview
    ```
