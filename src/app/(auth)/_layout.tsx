import { Redirect, Stack } from "expo-router";
import { ProfileError } from "../../components/profile-error";
import { Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";

export default function AuthLayout() {
  const { user, profile, profileError, initializing } = useAuth();

  if (initializing) return <Loading />;
  if (user && profileError) return <ProfileError />;
  if (user && profile) {
    return <Redirect href={profile.role === "owner" ? "/today" : "/home"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}