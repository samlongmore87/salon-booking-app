import { Placeholder } from "../../../components/placeholder";

export default function Today() {
  return (
    <Placeholder
      title="Today"
      links={[
        { label: "Open a booking", href: "/booking/demo" },
        { label: "Add booking", href: "/add" },
      ]}
    />
  );
}