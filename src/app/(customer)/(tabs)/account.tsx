import { signOut } from "firebase/auth";
import { Placeholder } from "../../../components/placeholder";
import { useAuth } from "../../../lib/auth-context";
import { auth } from "../../../lib/firebase";

export default function Account() {
  const { profile } = useAuth();
  return (
    <Placeholder
      title={profile?.name ?? "Account"}
      note={`${profile?.email ?? ""}\n${profile?.phone ?? ""}`}
      actions={[{ label: "Log out", onPress: () => signOut(auth) }]}
    />
  );
}