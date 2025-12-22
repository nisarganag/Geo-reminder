# 📍 Geo-Reminder: Smart Location Alarms

**Geo-Reminder** is a React Native mobile application that helps you sleep peacefully on your commute. It wakes you up with a persistent alarm (sound + vibration) when you are close to your destination.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-green.svg" alt="Android" />
  <img src="https://img.shields.io/badge/API-Google%20Maps-blue.svg" alt="Google Maps" />
  <img src="https://img.shields.io/badge/Stack-Expo%20%7C%20React%20Native-purple.svg" alt="Stack" />
</p>

## ✨ Key Features

- **🚨 Persistent Alarm**: Loops a loud sound and vibration pattern until you wake up.
- **💤 Snooze Mode**: Hit the snooze button for **3, 5, or 10 minutes** if you need a few more winks.
- **🚦 Smart Routing**: Powered by **Google Directions API** for real-time traffic data, accurate distances, and ETAs.
- **🕒 Search History**: Quickly select from your last 5 destinations.
- **📍 Local Search**: Intelligent search biasing prioritizes places near you (e.g., finding the local "City Center", not one in another country).
- **🔋 Battery Efficient**: Uses a hybrid tracking engine that checks traffic online every 5 mins but calculates progress locally every second.
- **🔄 Auto-Updates**: The app checks GitHub Releases and updates itself automatically.

## 🚀 Installation

### Download APK

Grab the latest `.apk` from the [Releases Page](https://github.com/nisarganag/Geo-reminder/releases).

### Permissions

The app requires the following permissions to function correctly:

- **Location (Always/Background)**: To track your progress while the phone is locked.
- **Notifications**: To show you prepaid alerts before the final alarm.
- **Install Unknown Apps**: To allow the self-update feature to work.

## 🛠️ Development Setup

1.  **Clone the Repo**

    ```bash
    git clone https://github.com/nisarganag/Geo-reminder.git
    cd Geo-reminder
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:

    ```env
    EXPO_PUBLIC_GOOGLE_API_KEY=your_google_maps_api_key_here
    ```

4.  **Run Locally**

    ```bash
    npx expo start
    ```

5.  **Build for Android**
    ```bash
    npx eas build -p android --profile preview --local
    ```

## 📱 Screenshots

|     Home Screen     | Alarm & Snooze | Search History |
| :-----------------: | :------------: | :------------: |
| _Tracking Progress_ |   _Wake Up!_   | _Quick Select_ |

---

**Created by [Nisarga Nag]**  
_Never miss your stop again._
