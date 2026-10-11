import { Hotkeys } from "@/components/hotkeys";
import { SignupForm } from "@/components/signup-form";
import { SiteHeader, siteHotkeys } from "@/components/site-header";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
