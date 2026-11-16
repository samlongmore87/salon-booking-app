import * as Haptics from "expo-haptics";

// All haptics live here, so they feel the same everywhere.
// .catch: never crash the app if a phone can't vibrate (or it's switched off).
export const haptic = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  select: () => Haptics.selectionAsync().catch(() => {}),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
};