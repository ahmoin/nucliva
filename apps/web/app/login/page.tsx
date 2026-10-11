import { Hotkeys } from "@/components/hotkeys";
import { LoginForm } from "@/components/login-form";
import { SiteHeader, siteHotkeys } from "@/components/site-header";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
