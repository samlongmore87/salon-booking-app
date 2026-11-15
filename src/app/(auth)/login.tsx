import { Placeholder } from "../../components/placeholder";

export default function Login() {
  return (
    <Placeholder
      title="Log in"
      links={[
        { label: "Create account", href: "/sign-up" },
        { label: "Test: enter as customer", href: "/home", replace: true },
        { label: "Test: enter as owner", href: "/today", replace: true },
      ]}
    />
  );
}