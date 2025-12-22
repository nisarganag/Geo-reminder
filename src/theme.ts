import { StyleSheet, Platform } from "react-native";

export const LightColors = {
  primary: "#007AFF", // System Blue
  secondary: "#5AC8FA", // System Teal
  accent: "#FF3B30", // System Red (Destructive/Cancel)
  background: "#F2F2F7", // System Grouped Background (Light Grey)

  text: "#000000",
  textSecondary: "#8E8E93", // System Grey
  textLight: "#FFFFFF",

  // Components
  card: "#FFFFFF",
  inputBg: "#E5E5EA", // Search bar grey
  border: "rgba(0, 0, 0, 0.05)",

  success: "#34C759", // System Green
  warning: "#FFCC00",

  // Glass/Blur overlays
  glassBg: "rgba(255, 255, 255, 0.8)",
  glassBorder: "rgba(255, 255, 255, 0.4)",
  shadowColor: "#000",
};

export const DarkColors = {
  primary: "#0A84FF", // Dark Mode Blue
  secondary: "#64D2FF",
  accent: "#FF453A",
  background: "#000000", // Pure Black

  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textLight: "#FFFFFF",

  // Components
  card: "#1C1C1E", // Dark Grey Card
  inputBg: "#2C2C2E", // Darker Grey Input
  border: "rgba(255, 255, 255, 0.1)",

  success: "#30D158",
  warning: "#FFD60A",

  // Glass/Blur overlays
  glassBg: "rgba(30, 30, 30, 0.8)",
  glassBorder: "rgba(255, 255, 255, 0.15)",
  shadowColor: "#000",
};

export const SHADOWS = Platform.select({
  ios: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
  web: {
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
});

export const getGlassStyle = (isDark: boolean) =>
  Platform.select({
    web: {
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      backgroundColor: isDark
        ? "rgba(30, 30, 30, 0.85)"
        : "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(255, 255, 255, 0.5)",
    },
    default: {
      // Native fallback
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    },
  });

export const getGlobalStyles = (colors: typeof LightColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      ...SHADOWS,
      shadowColor: colors.shadowColor,
      ...(getGlassStyle(isDark) as any),
    },
    title: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      fontWeight: "500",
    },
    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: "transparent",
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
      ...SHADOWS,
      shadowColor: colors.shadowColor,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      borderRadius: 30, // Pill Shape
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
      // Add blurred glass effect to button itself if desired, currently solid primary looks better for CTA
      // If "Liquid Glass" button is strictly required:
      // backgroundColor: isDark ? 'rgba(10, 132, 255, 0.8)' : 'rgba(0, 122, 255, 0.8)',
      // ...getGlassStyle(isDark)
    },
    buttonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
  });
