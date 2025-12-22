import { StyleSheet, Platform } from "react-native";

export const COLORS = {
  // Apple Maps Style Palette
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
};

export const SHADOWS = Platform.select({
  ios: {
    shadowColor: "#000",
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

export const GLASS_STYLE = Platform.select({
  web: {
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  default: {
    // Native fallback (since true blur is hard on Android without extra libs)
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
});

export const GLOBAL_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Will be covered by Gradient
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...SHADOWS,
    ...(GLASS_STYLE as any),
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    fontWeight: "500",
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    ...SHADOWS,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
