import { Redirect, Stack } from "expo-router";
import { ProfileError } from "../../components/profile-error";
import { Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";

export default function OwnerLayout() {
  const { user, profile, profileError, initializing } = useAuth();

  if (initializing) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (profileError) return <ProfileError />;
  if (!profile) return <Redirect href="/login" />;
  if (profile.role !== "owner") return <Redirect href="/home" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}