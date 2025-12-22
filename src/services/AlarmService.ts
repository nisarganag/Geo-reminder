import { Audio } from "expo-av";
import { Vibration, Platform } from "react-native";

class AlarmServiceImpl {
  private sound: Audio.Sound | null = null;
  private customSoundUri: string | null = null;
  private isPlaying: boolean = false;
  private vibrationInterval: NodeJS.Timeout | null = null;

  async setCustomSound(uri: string | null) {
    this.customSoundUri = uri;
  }

  // The loadSound method is now primarily for setting audio mode,
  // actual sound loading will happen in startAlarm based on custom URI or default.
  async loadSound() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log("Error setting audio mode", error);
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
        // ALWAYS set mode before playing to ensure focus
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Unload existing sound to be safe
        if (this.sound) {
          await this.sound.unloadAsync();
          this.sound = null;
        }

        if (this.customSoundUri) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: this.customSoundUri },
              { shouldPlay: true, isLooping: true }
            );
            this.sound = sound;
          } catch (e) {
            console.log("Custom sound failed, falling back to default");
            // Fallback handled below
          }
        }

        // Default sound if custom failed or not set
        if (!this.sound) {
          const { sound } = await Audio.Sound.createAsync(
            {
              uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
            },
            { shouldPlay: true, isLooping: true }
          );
          this.sound = sound;
        }

        // Just in case createAsync didn't play (though shouldPlay: true is set)
        if (this.sound) {
          await this.sound.setVolumeAsync(1.0);
          await this.sound.playAsync();
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
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync(); // Vital: Release resource
        this.sound = null;
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
