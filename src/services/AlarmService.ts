import { Audio } from "expo-av";
import { Vibration, Platform } from "react-native";

class AlarmServiceImpl {
  private soundObject: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private vibrationInterval: NodeJS.Timeout | null = null;

  async loadSound() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Default system alarm sound is tricky to access directly across platforms without native modules.
      // We will use a standard beep sound via URL or a bundled asset ideally.
      // For now, let's try to generate a beep or use a known reliable URL.
      // Since we don't have a local asset, we'll try to just use Vibration strongly first,
      // but the user requested SOUND.

      // We will create a sound object but without a file, it won't work well offline.
      // Best approach for an MVP without assets: Use expo-av with a remote URL fallback
      // or rely on the fact we can't easily ship a sound file without user adding it.
      // LET'S USE A PUBLIC RELIABLE URL FOR A BEEP/ALARM for the prototype.

      const { sound } = await Audio.Sound.createAsync(
        {
          uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        }, // Loud Alarm Clock style
        { shouldPlay: false, isLooping: true }
      );
      this.soundObject = sound;
    } catch (error) {
      console.log("Error loading alarm sound", error);
    }
  }

  async startAlarm(
    soundEnabled: boolean = true,
    vibrationEnabled: boolean = true
  ) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // 1. Start Audio (if enabled)
    if (soundEnabled) {
      try {
        if (!this.soundObject) {
          await this.loadSound();
        }
        if (this.soundObject) {
          await this.soundObject.setVolumeAsync(1.0);
          await this.soundObject.playAsync();
        }
      } catch (e) {
        console.log("Failed to play sound", e);
      }
    }

    // 2. Start Vibration (if enabled)
    if (vibrationEnabled) {
      const PATTERN = [0, 500, 200, 500]; // wait 0s, vibrate 500ms, wait 200ms, vibrate 500ms
      if (Platform.OS === "android") {
        Vibration.vibrate(PATTERN, true);
      } else {
        this.doVibrateLoop();
      }
    }
  }

  private doVibrateLoop() {
    if (!this.isPlaying) return;
    Vibration.vibrate();
    this.vibrationInterval = setTimeout(() => {
      this.doVibrateLoop();
    }, 1000);
  }

  async stopAlarm() {
    this.isPlaying = false;

    // Stop Sound
    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
      } catch (e) {
        console.log(e);
      }
    }

    // Stop Vibration
    Vibration.cancel();
    if (this.vibrationInterval) {
      clearTimeout(this.vibrationInterval);
      this.vibrationInterval = null;
    }
  }
}

export const AlarmService = new AlarmServiceImpl();
