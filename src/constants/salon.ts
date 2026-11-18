import { Linking } from "react-native";

// The salon's details in one place. To set the app up for a different salon, edit this file.
export const SALON = {
  name: "Studio Mono",
  address: "12 Main Road, Durbanville", // demo address
  phone: "+27210000000", // demo number, used by "Call the salon"
};

// Opens the phone app, ready to call the salon
export function callSalon() {
  Linking.openURL(`tel:${SALON.phone}`).catch((e) => console.warn("Couldn't open the phone app", e));
}