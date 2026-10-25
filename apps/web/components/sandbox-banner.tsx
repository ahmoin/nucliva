import { SparkleIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export function SandboxBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border bg-primary/5 px-4 py-2.5 text-sm">
      <SparkleIcon className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-muted-foreground">
        <span className="font-medium text-foreground">
          You are in a sandbox.
        </span>{" "}
        Press Enter to run the request below, then accept or reject what comes
        back. Sign up and everything here moves to your account.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/signup" />}
        size="sm"
      >
        Sign up to keep it
      </Button>
    </div>
  );
}
