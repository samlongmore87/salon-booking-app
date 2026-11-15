import { Placeholder } from "../../../components/placeholder";

export default function Confirm() {
  return <Placeholder title="Confirm your booking" links={[{ label: "Confirm booking", href: "/book/confirmed" }]} />;
}