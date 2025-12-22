# Geo-Reminder v1.0.0 (Gold Master) 🚀

**The Ultimate Location-Based Alarm App is Here!**

This release marks the final version of Geo-Reminder, featuring a complete overhaul of the routing engine, a new persistent alarm system, and polished UI.

## 🌟 New Features in v1.0

### 🚨 Smart Alarm System

- **Persistent Ringing**: The alarm now loops a loud sound and vibration pattern until you manually stop it. Essential for sleeping commuters!
- **Snooze Functionality**: Not ready to get up? Snooze the alarm for **3, 5, or 10 minutes**.
- **Full-Screen Alert**: A distinct red "ARRIVED" screen ensures you never miss a notification.
- **Auto-Stop Logic**: Stopping the alarm automatically clears your destination so you're ready for the next trip.

### 🗺️ Intelligent Routing & Search

- **Google Maps Integration**: Powered by Google Directions API for real-time logic.
- **Traffic Awareness**: Distance and ETA calls account for current traffic conditions.
- **Smart Throttling**: Checks traffic every 5 minutes (or when off-route) to save data & API costs, using local math for the seconds in between.
- **Search History**: Tapping the search bar now shows your **Last 5 Locations** for quick selection.
- **Local Biasing**: Search results prioritize places near _you_ (e.g., searching "Salt Lake" in Kolkata finds the local one, not Utah).

### 🛠️ Core Improvements

- **Self-Updating**: The app checks GitHub Releases for updates and installs them automatically.
- **Background Support**: Fully configured to run reliably in the background while you multitask.
- **Premium UI**: Dark Mode, "Apple Maps" style aesthetics, and smooth animations.

## 📦 Installation

1. Download the `.apk` below.
2. Install on your Android device.
3. Grant "Location" (Allow all the time recommended) and "Notification" permissions.

## 🔧 For Developers

- **API Key Security**: Now uses `EXPO_PUBLIC_GOOGLE_API_KEY` in `.env`, keeping the public repo safe.
- **CI/CD**: Fully automated build pipeline via GitHub Actions.

---

_Built with ❤️ using React Native & Expo_
