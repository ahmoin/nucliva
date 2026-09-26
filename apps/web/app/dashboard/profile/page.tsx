import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";

export default function Page() {
  return (
    <AppShell title="Profile">
      <ProfileForm />
    </AppShell>
  );
}
