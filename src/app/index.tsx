import { Redirect } from "expo-router";

// Always start at login. If someone is already logged in, the (auth) layout
// sends them straight to Home (customer) or Today (owner).
export default function Index() {
  return <Redirect href="/login" />;
}