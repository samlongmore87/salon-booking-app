// Salon opening hours and the maths for working out free appointment times.
// All times are "minutes after midnight", e.g. 8:30 = 510.

export const SLOT_MIN = 30; // appointments can start every 30 minutes
export const DAYS_AHEAD = 14; // how many open days customers can book ahead
export const MIN_NOTICE_MIN = 60; // no bookings less than an hour from now
export const STYLIST_ID = "main"; // one stylist for now; ready for more later

type Hours = { open: number; close: number };

// Index = day of the week (0 = Sunday … 6 = Saturday). null = closed.
export const OPENING_HOURS: (Hours | null)[] = [
  null, // Sunday
  { open: 8 * 60, close: 17 * 60 }, // Monday
  { open: 8 * 60, close: 17 * 60 }, // Tuesday
  { open: 8 * 60, close: 17 * 60 }, // Wednesday
  { open: 8 * 60, close: 17 * 60 }, // Thursday
  { open: 8 * 60, close: 17 * 60 }, // Friday
  { open: 9 * 60, close: 13 * 60 }, // Saturday
];

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-11-17" in the phone's local time
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "08:30"
export function formatTime(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// Document id for one 30-minute slot, e.g. "main_2026-11-17_0830"
export function slotId(date: string, minutes: number, stylistId: string = STYLIST_ID) {
  return `${stylistId}_${date}_${formatTime(minutes).replace(":", "")}`;
}

// A 45-minute service takes up two 30-minute slots
export function slotsNeeded(durationMin: number) {
  return Math.ceil(durationMin / SLOT_MIN);
}

// Every start time for this service that fits inside opening hours,
// isn't already taken, and isn't too soon.
export function availableStarts(
  day: Date,
  durationMin: number,
  taken: Set<number>,
  now: Date = new Date()
): number[] {
  const hours = OPENING_HOURS[day.getDay()];
  if (!hours) return [];

  const need = slotsNeeded(durationMin);
  const isToday = dateKey(day) === dateKey(now);
  const earliest = now.getHours() * 60 + now.getMinutes() + MIN_NOTICE_MIN;
  const starts: number[] = [];

  for (let start = hours.open; start + need * SLOT_MIN <= hours.close; start += SLOT_MIN) {
    if (isToday && start < earliest) continue;
    let free = true;
    for (let i = 0; i < need; i++) {
      if (taken.has(start + i * SLOT_MIN)) {
        free = false;
        break;
      }
    }
    if (free) starts.push(start);
  }
  return starts;
}

// The next DAYS_AHEAD days the salon is open (today is skipped once it's too late to book)
export function bookableDays(now: Date = new Date()): Date[] {
  const days: Date[] = [];
  // Keep going until we have DAYS_AHEAD open days (the i limit is just a safety net)
  for (let i = 0; days.length < DAYS_AHEAD && i < DAYS_AHEAD * 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const hours = OPENING_HOURS[d.getDay()];
    if (!hours) continue;
    if (i === 0) {
      const earliest = now.getHours() * 60 + now.getMinutes() + MIN_NOTICE_MIN;
      if (earliest + SLOT_MIN > hours.close) continue;
    }
    days.push(d);
  }
  return days;
}

const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-11-17" → a Date at midnight, in the phone's local time
export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "2026-11-17" → "Tuesday, 17 November"
export function formatLongDate(key: string) {
  const d = parseDateKey(key);
  return `${LONG_DAYS[d.getDay()]}, ${d.getDate()} ${LONG_MONTHS[d.getMonth()]}`;
}

export const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-22" → "Sat, 22 Nov" (or "22 Nov" without the weekday)
export function formatShortDate(key: string, withWeekday = true) {
  const d = parseDateKey(key);
  const dayMonth = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
  return withWeekday ? `${SHORT_DAYS[d.getDay()]}, ${dayMonth}` : dayMonth;
}

// A Date → "Oct 2026"
export function formatMonthYear(d: Date) {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "Mon–Fri 08:00–17:00 · Sat 09:00–13:00", built from OPENING_HOURS so it never goes out of date
export function openingHoursSummary() {
  const week = [1, 2, 3, 4, 5, 6, 0]; // Monday first
  const groups: { first: number; last: number; hours: Hours }[] = [];

  week.forEach((day, i) => {
    const hours = OPENING_HOURS[day];
    if (!hours) return; // closed
    const prev = groups[groups.length - 1];
    if (
      prev &&
      prev.last === week[i - 1] &&
      prev.hours.open === hours.open &&
      prev.hours.close === hours.close
    ) {
      prev.last = day; // same hours as the day before, so extend the group
    } else {
      groups.push({ first: day, last: day, hours });
    }
  });

  return groups
    .map((g) => {
      const days = g.first === g.last ? SHORT_DAYS[g.first] : `${SHORT_DAYS[g.first]}–${SHORT_DAYS[g.last]}`;
      return `${days} ${formatTime(g.hours.open)}–${formatTime(g.hours.close)}`;
    })
    .join(" · ");
}