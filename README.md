# 📍 Geo Reminder

> **Smart Location Alerts with a Premium Glassmorphism UI.**

Geo Reminder is a powerful cross-platform application (Android, iOS, Web) that tracks your real-time location and alerts you when you are approaching a destination. Built with **React Native** & **Expo**, it features a stunning "Glassmorphism" aesthetic, robust background tracking, and high-priority alarms.

---

## ✨ Key Features

- **🎨 Premium Glassmorphism UI**: A modern, aesthetic interface with vibrant gradients, frosted glass cards, and smooth animations.
- **📍 Smart Location Tracking**: Real-time GPS tracking with automatic "My Location" detection (Reverse Geocoding).
- **🔔 Alarm Mode**: High-priority alerts that break through with **Sound** and **Vibration** (even when the app is backgrounded).
- **🔍 Instant Search**: Powered by OpenStreetMap (Nominatim) with debounced autocomplete for finding any place on Earth.
- **🔋 Battery Efficient**: Optimized location updates ensuring accuracy without draining your battery.
- **🌍 Cross-Platform**: One codebase running seamlessly on Android, iOS, and Web.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/nisarganag/Geo-reminder.git
    cd Geo-reminder
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Start the App**
    ```bash
    npx expo start
    ```
    - Press `a` for Android Emulator.
    - Press `i` for iOS Simulator.
    - Press `w` for Web.
    - Scan the QR code with the **Expo Go** app on your physical device.

---

## 📱 How to Use

1.  **Grant Permissions**: Upon first launch, allow **Location** and **Notification** permissions when asked.
2.  **Check Your Location**: The top card shows your current address. Tap **Refresh (🔄)** if it needs updating.
3.  **Select Destination**:
    - Tap the **Search** bar (white input).
    - Type a place name (e.g., "Paris", "Central Park").
    - Select from the dropdown suggestions.
4.  **Configure Alerts**:
    - **Distance**: Set how close (in km) you need to be to trigger the alert.
    - **Time**: Set how soon (in minutes) you need to be.
    - **Alarm Mode**: Toggle **Sound 🔊** and **Vibe 📳** for high-priority alerts.
5.  **Start Tracking**: Tap **Start Tracking**. The app will monitor your position and fire the alarm when you reach the threshold!

---

## 🛠 Building the APK (Android)

You have two options to generate the installer file (`.apk`):

### Option A: Cloud Build (Recommended)

No setup required. Expo builds it for you.

```bash
npx eas-cli build -p android --profile preview
```

### Option B: Local Build

Requires Java 17 and Android SDK.

```bash
# Provide permissions
chmod +x build_apk.sh

# Run the automated helper script
./build_apk.sh
```

---

## 🧩 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (Expo SDK 52)
- **Language**: TypeScript
- **Maps/Routing**: OpenStreetMap / Nominatim / OSRM
- **State Management**: React Hooks (`useState`, `useEffect`)
- **Styling**: Custom StyleSheet with Glassmorphism tokens

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
