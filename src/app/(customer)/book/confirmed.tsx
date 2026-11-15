import { Placeholder } from "../../../components/placeholder";

export default function Confirmed() {
  return (
    <Placeholder
      title="You're booked."
      links={[
        { label: "View my bookings", href: "/bookings", replace: true },
        { label: "Done", href: "/home", replace: true },
      ]}
    />
  );
}