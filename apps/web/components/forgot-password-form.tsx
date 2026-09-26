"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useRef, useState } from "react";
import { LogoMark } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { error: resetError } = await authClient.requestPasswordReset({
      email,
    });
    setPending(false);
    if (resetError) {
      setError(resetError.message ?? "Could not send the reset link.");
      shakeRef.current?.classList.remove("is-shaking");
      shakeRef.current?.getBoundingClientRect();
      shakeRef.current?.classList.add("is-shaking");
      return;
    }
    setSent(true);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={submit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              className="flex flex-col items-center gap-2 font-medium"
              href="/"
            >
              <LogoMark className="size-8" />
              <span className="sr-only">Nucliva</span>
            </Link>
            <h1 className="font-bold text-xl">Reset your password</h1>
            <FieldDescription>
              Enter your email and we will send you a link to reset it
            </FieldDescription>
          </div>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <div className="t-input" ref={shakeRef}>
              <Input
                aria-invalid={error ? true : undefined}
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address*"
                required
                type="email"
                value={email}
              />
            </div>
            {error ? <FieldError>{error}</FieldError> : null}
            {sent ? (
              <FieldDescription>
                If an account exists for that email, a reset link is on its way.
              </FieldDescription>
            ) : null}
          </Field>
          <Field>
            <Button disabled={pending} type="submit">
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            Remember your password? <Link href="/login">Log in</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
