import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Hotkeys } from "@/components/hotkeys";
import { SiteHeader, siteHotkeys } from "@/components/site-header";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
