import { Placeholder } from "../../../components/placeholder";
import { useAuth } from "../../../lib/auth-context";

export default function Home() {
  const { profile } = useAuth();
  const firstName = profile?.name.split(" ")[0] ?? "there";

  return (
    <Placeholder
      title={`Hi ${firstName}`}
      links={[{ label: "Book now", href: "/book/service" }]}
    />
  );
}