import { StyleSheet, Platform } from "react-native";

export const COLORS = {
  // Vibrant Gradient Elements
  primary: "#6C5CE7",
  secondary: "#00CEC9", // Bright Teal
  accent: "#FF7675", // Coral
  background: "#0984e3", // Fallback for native
  text: "#2D3436",
  textLight: "#FFFFFF",
  textSecondary: "#636E72",

  // Glassmorphism variants
  glassBg: "rgba(255, 255, 255, 0.75)",
  glassBorder: "rgba(255, 255, 255, 0.6)",

  // Legacy/Fallback keys to satisfy types
  card: "#FFFFFF",
  border: "rgba(255, 255, 255, 0.4)",

  success: "#00B894",
  warning: "#FD79A8",
  inputBg: "rgba(255, 255, 255, 0.9)",
};

export const SHADOWS = Platform.select({
  ios: {
    shadowColor: "#2D3436",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
  web: {
    boxShadow:
      "0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)",
  },
});

export const GLASS_STYLE = Platform.select({
  web: {
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    backgroundColor: COLORS.glassBg,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderStyle: "solid",
  },
  default: {
    backgroundColor: "rgba(255,255,255, 0.95)",
    borderWidth: 1,
    borderColor: "#EEF2F7",
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
