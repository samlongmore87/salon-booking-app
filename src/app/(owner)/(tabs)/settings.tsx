import { signOut } from "firebase/auth";
import { Placeholder } from "../../../components/placeholder";
import { auth } from "../../../lib/firebase";

export default function Settings() {
  return <Placeholder title="Settings" actions={[{ label: "Log out", onPress: () => signOut(auth) }]} />;
}