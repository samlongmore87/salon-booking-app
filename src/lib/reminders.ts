import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SALON } from "../constants/salon";
import { type Booking, fetchMyBookings, isUpcoming } from "./bookings";
import { formatTime, parseDateKey } from "./schedule";

// Appointment reminders: a notification on this phone the day before each booking, at 18:00.
// Nothing is sent from a server; the phone schedules them itself from the customer's bookings.

const REMINDER_HOUR = 18; // keep in step with the text on the Account screen
const CHANNEL_ID = "reminders"; // Android groups notifications into channels

type Permission = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

const isAllowed = (p: Permission) =>
  p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

// Each booking's reminder has a fixed id, so it can be replaced or removed on its own
const reminderId = (bookingId: string) => `booking-${bookingId}`;

// Call once when the app starts
export function setUpNotifications() {
  // Still show a reminder if the app happens to be open when it fires
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Appointment reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch((e) => console.warn("Couldn't create the reminders channel", e));
  }
}

// Ask to show notifications (the phone only shows its pop-up the first time).
// Returns true if notifications are allowed.
export async function askToNotify() {
  const current = await Notifications.getPermissionsAsync();
  if (isAllowed(current)) return true;
  return isAllowed(await Notifications.requestPermissionsAsync());
}

// True if notifications are switched off for this app and only the phone's Settings can turn them on
export async function notificationsBlocked() {
  const p = await Notifications.getPermissionsAsync();
  return !isAllowed(p) && !p.canAskAgain;
}

// The day before the booking, at 18:00
function reminderDate(b: Booking) {
  const d = parseDateKey(b.date);
  d.setDate(d.getDate() - 1);
  d.setHours(REMINDER_HOUR, 0, 0, 0);
  return d;
}

async function applyReminders(bookings: Booking[], remindersOn: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync(); // this app only ever schedules reminders
  if (!remindersOn || !isAllowed(await Notifications.getPermissionsAsync())) return;

  const now = Date.now();
  for (const b of bookings) {
    const at = reminderDate(b);
    if (!isUpcoming(b, now) || at.getTime() <= now) continue; // cancelled, past, or too late to remind

    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(b.id),
      content: {
        title: `Tomorrow at ${formatTime(b.startMin)}`,
        body: `${b.serviceName} at ${SALON.name}. Can't make it? Cancel in the app up to 2 hours before.`,
        data: { bookingId: b.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL_ID,
      },
    });
  }
}

// Updates run one after another, so two screens updating at once can't mix up the list.
// A failed update is logged and never stops the ones after it.
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>) {
  queue = queue.then(task).catch((e) => console.warn("Failed to update reminders", e));
  return queue;
}

// Make the phone's reminders match these bookings. Never throws.
export function syncReminders(bookings: Booking[], remindersOn: boolean) {
  return enqueue(() => applyReminders(bookings, remindersOn));
}

// Remove one booking's reminder (straight after it's cancelled). Never throws.
export function removeReminder(bookingId: string) {
  return enqueue(() => Notifications.cancelScheduledNotificationAsync(reminderId(bookingId)));
}

// Fetch the customer's bookings, then update the reminders. Never throws.
export async function refreshReminders(uid: string, remindersOn: boolean) {
  if (!remindersOn) return syncReminders([], false);
  try {
    return syncReminders(await fetchMyBookings(uid), true);
  } catch (e) {
    console.warn("Failed to load bookings for reminders", e);
  }
}

// Remove every reminder from this phone (on log out)
export function clearReminders() {
  return syncReminders([], false);
}