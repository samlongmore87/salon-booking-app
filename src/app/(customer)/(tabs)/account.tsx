import { Placeholder } from "../../../components/placeholder";
import { logOut, useAuth } from "../../../lib/auth-context";

export default function Account() {
  const { profile } = useAuth();
  return (
    <Placeholder
      title={profile?.name ?? "Account"}
      note={`${profile?.email ?? ""}\n${profile?.phone ?? ""}`}
      actions={[{ label: "Log out", onPress: logOut }]}
    />
  );
}