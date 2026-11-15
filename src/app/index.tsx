import { Redirect } from "expo-router";

// Later this will check if someone is logged in, and whether they're an owner.
export default function Index() {
  return <Redirect href="/login" />;
}