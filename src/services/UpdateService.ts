import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";
import { Alert, Platform } from "react-native";

const GITHUB_REPO = "nisarganag/Geo-reminder";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export const UpdateService = {
  /**
   * Checks for updates by comparing the current native version with the latest GitHub Release tag.
   * Assumes tags are in format "v1", "v2" or "1.0.0".
   */
  async checkForUpdate(): Promise<{
    hasUpdate: boolean;
    downloadUrl?: string;
    latestVersion?: string;
  }> {
    try {
      const response = await fetch(GITHUB_API_URL);
      if (!response.ok) {
        console.log("Update check failed:", response.status);
        return { hasUpdate: false };
      }

      const data = await response.json();
      const latestVersionTag = data.tag_name.replace(/^v/, ""); // "17"

      // Use nativeBuildVersion (Android Version Code) which we map to GitHub Run Number
      // Fallback to "0" if undefined (dev mode)
      const currentBuildVersion = Application.nativeBuildVersion || "0";

      const apkAsset = data.assets.find((asset: any) =>
        asset.name.endsWith(".apk")
      );

      console.log(
        `Current Code: ${currentBuildVersion}, Latest Tag: ${latestVersionTag}`
      );

      // Compare Build Numbers (Integers)
      // If Tag (17) > Current (16), update.
      if (parseInt(latestVersionTag) > parseInt(currentBuildVersion)) {
        if (apkAsset) {
          return {
            hasUpdate: true,
            downloadUrl: apkAsset.browser_download_url,
            latestVersion: latestVersionTag,
          };
        }
      }

      return { hasUpdate: false };
    } catch (error) {
      console.error("Error checking for updates:", error);
      return { hasUpdate: false };
    }
  },

  /**
   * Downloads the APK and triggers the Android installation intent.
   */
  async downloadAndInstall(url: string, fileName: string = "update.apk") {
    if (Platform.OS !== "android") {
      Alert.alert("Not Supported", "Self-update is only available on Android.");
      return;
    }

    try {
      // FIX: Use manual casting for FileSystem to bypass type definition issues in legacy/mixed environments
      const fs = FileSystem as any;
      const fileUri = (fs.documentDirectory || "") + fileName;

      // 1. Clean up old file if exists to prevent corruption
      const fileInfo = await fs.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await fs.deleteAsync(fileUri);
      }

      // 2. Download the APK
      const downloadRes = await fs.downloadAsync(url, fileUri);

      if (downloadRes.status !== 200) {
        Alert.alert("Download Failed", "Could not download the update.");
        return;
      }

      // 3. Get Content URI for installation (bypass FileUriExposedException)
      const contentUri = await fs.getContentUriAsync(fileUri);
      console.log("Installing from:", contentUri);

      // 4. Launch Install Intent
      // 1 (FLAG_GRANT_READ_URI_PERMISSION) + 268435456 (FLAG_ACTIVITY_NEW_TASK) = 268435457
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 268435457,
        type: "application/vnd.android.package-archive",
      });
    } catch (error: any) {
      console.error("Update installation failed:", error);

      // Check if it's a permission issue or offer to open settings
      Alert.alert(
        "Install Failed",
        `Error: ${error.message}\n\nTo update, you must allow 'Install Unknown Apps' permission in Settings.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              IntentLauncher.startActivityAsync(
                "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
                {
                  data: `package:${Application.applicationId}`,
                }
              );
            },
          },
        ]
      );
    }
  },
};
