// ─── CardioGuard AI — Caretaker Design Tokens ────────────────────────────────

export const Colors = {
  // Primary blues
  blue900: "#1E3A8A",
  blue800: "#1E40AF",
  blue700: "#1D4ED8",
  blue600: "#2563EB",
  blue500: "#3B82F6",
  blue400: "#60A5FA",
  blue100: "#DBEAFE",
  blue50:  "#EFF6FF",

  // Status
  normal:   "#16A34A",
  normalBg: "#DCFCE7",
  warning:  "#D97706",
  warningBg:"#FEF3C7",
  critical: "#DC2626",
  criticalBg:"#FEE2E2",

  // Neutrals
  gray900: "#111827",
  gray800: "#1F2937",
  gray700: "#374151",
  gray600: "#4B5563",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50:  "#F9FAFB",
  white:   "#FFFFFF",

  // Gradients (use with LinearGradient)
  headerGradient: ["#1E40AF", "#2563EB", "#3B82F6"] as const,
  cardGradient:   ["#FFFFFF", "#F0F9FF"] as const,
  criticalGradient: ["#DC2626", "#EF4444"] as const,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor:   "#1E40AF",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  16,
    elevation:     5,
  },
  soft: {
    shadowColor:   "#000000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     3,
  },
  strong: {
    shadowColor:   "#1E40AF",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius:  24,
    elevation:     8,
  },
};

export const STATUS_CONFIG = {
  NORMAL: {
    label:  "Normal",
    color:  Colors.normal,
    bg:     Colors.normalBg,
    icon:   "heart",
    pulse:  false,
  },
  WARNING: {
    label:  "Warning",
    color:  Colors.warning,
    bg:     Colors.warningBg,
    icon:   "alert-triangle",
    pulse:  true,
  },
  CRITICAL: {
    label:  "Critical",
    color:  Colors.critical,
    bg:     Colors.criticalBg,
    icon:   "alert-octagon",
    pulse:  true,
  },
} as const;

export type HeartStatus = keyof typeof STATUS_CONFIG;

export function classifyBpm(bpm: number): HeartStatus {
  if (bpm <= 0)              return "NORMAL";
  if (bpm < 50 || bpm > 120) return "CRITICAL";
  if (bpm < 60 || bpm > 100) return "WARNING";
  return "NORMAL";
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}