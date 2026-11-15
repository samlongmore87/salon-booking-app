import { Redirect, Stack } from "expo-router";
import { Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";

export default function CustomerLayout() {
  const { user, profile, initializing } = useAuth();

  if (initializing) return <Loading />;
  if (!user || !profile) return <Redirect href="/login" />;
  if (profile.role === "owner") return <Redirect href="/today" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}