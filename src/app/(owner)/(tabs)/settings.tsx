import { Placeholder } from "../../../components/placeholder";
import { logOut } from "../../../lib/auth-context";

export default function Settings() {
  return <Placeholder title="Settings" actions={[{ label: "Log out", onPress: logOut }]} />;
}