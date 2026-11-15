import { Placeholder } from "../../../components/placeholder";

export default function Account() {
  return <Placeholder title="Account" links={[{ label: "Log out", href: "/login", replace: true }]} />;
}