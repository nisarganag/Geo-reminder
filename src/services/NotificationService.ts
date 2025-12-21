import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  requestPermissions: async () => {
    const { status } = await Notifications.requestPermissionsAsync();

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("geo-alarm", {
        name: "Geo Reminder Alarms",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
      });
    }

    return status === "granted";
  },

  scheduleNotification: async (
    title: string,
    body: string,
    useAlarm: boolean = true
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: useAlarm,
        vibrate: useAlarm ? [0, 250, 250, 250] : undefined, // iOS specific
        color: "#6C5CE7", // Primary Brand Color
      },
      trigger: useAlarm
        ? ({
            channelId: "geo-alarm", // Android specific
            seconds: 1, // trigger immediately
          } as any)
        : null,
    });
  },

  // Clean up if needed, though for this simple app 'schedule' with null trigger implies immediate
};
