// Small text helpers shared by several screens.

const SA_PREFIX = "+27";

// "Lerato Mokoena" → "LM"
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// What the customer typed → "+27821234567", or null if it isn't a valid SA mobile number.
// Keeps digits only and drops a leading 0 (082... becomes 82...).
export function parseSaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^0/, "");
  return digits.length === 9 ? `${SA_PREFIX}${digits}` : null;
}

// "+27821234567" → "82 123 4567" (the part after +27)
export function localPhone(phone: string) {
  const d = phone.startsWith(SA_PREFIX) ? phone.slice(SA_PREFIX.length) : phone;
  return d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : d;
}

// "+27821234567" → "+27 82 123 4567"
export function formatPhone(phone: string) {
  return phone.startsWith(SA_PREFIX) ? `${SA_PREFIX} ${localPhone(phone)}` : phone;
}