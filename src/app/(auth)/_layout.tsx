import { Redirect, Stack } from "expo-router";
import { Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";

export default function AuthLayout() {
  const { user, profile, initializing } = useAuth();

  if (initializing) return <Loading />;

  // Already logged in with a profile: send them to their side of the app
  if (user && profile) {
    return <Redirect href={profile.role === "owner" ? "/today" : "/home"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}