import * as Haptics from "expo-haptics";

/**
 * HapticService: Centralized control for tactile feedback.
 * Provides distinct patterns for different interactions.
 */
class HapticServiceImpl {
  // Light feedback for general UI interactions (taps, toggles)
  async light() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Haptics not supported");
    }
  }

  // Medium feedback for more significant actions (start/stop tracking)
  async medium() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn("Haptics not supported");
    }
  }

  // Success feedback for saving things (favorites, settings)
  async success() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn("Haptics not supported");
    }
  }

  // Error/Warning feedback
  async error() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn("Haptics not supported");
    }
  }

  // Strong, repetitive feedback for the Alarm
  // Note: Expo Haptics doesn't support custom patterns perfectly on all devices,
  // so we simulate a pattern or use Heavy impact.
  async alarm() {
    try {
      // Initial heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // We rely on the interval in AlarmService or just a single strong pulse here.
      // A pattern can be simulated if needed by the caller, but simpler is safer for cross-platform.
    } catch (error) {
      console.warn("Haptics not supported");
    }
  }
}

export const HapticService = new HapticServiceImpl();
