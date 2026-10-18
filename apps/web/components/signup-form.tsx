"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import {
  authClient,
  signInWithGithub,
  signInWithGoogle,
} from "@/lib/auth/client";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { error: signUpError } = await authClient.signUp.email({
      email,
      name: email.split("@")[0] ?? email,
      password,
    });
    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? "Could not create your account.");
      shakeRef.current?.classList.remove("is-shaking");
      shakeRef.current?.getBoundingClientRect();
      shakeRef.current?.classList.add("is-shaking");
      return;
    }
    router.push("/dashboard");
  };

  if (emailSubmitted) {
    return (
      <div
        className={cn(
          "motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 flex flex-col gap-6 motion-safe:animate-in motion-safe:duration-200 motion-safe:[animation-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          className
        )}
        {...props}
      >
        <form onSubmit={submitPassword}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                className="flex flex-col items-center gap-2 font-medium"
                href="/"
              >
                <LogoMark className="size-8" />
                <span className="sr-only">Nucliva</span>
              </Link>
              <h1 className="font-bold text-xl">Create your password</h1>
              <FieldDescription>
                Choose a password for your Nucliva account
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="email-readonly">Email address</FieldLabel>
              <div className="relative">
                <Input
                  className="pr-14"
                  id="email-readonly"
                  readOnly
                  type="email"
                  value={email}
                />
                <Button
                  className="absolute top-1/2 right-1 h-auto -translate-y-1/2 px-2 py-1"
                  onClick={() => setEmailSubmitted(false)}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  Edit
                </Button>
              </div>
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="t-input relative" ref={shakeRef}>
                <Input
                  aria-invalid={error ? true : undefined}
                  autoComplete="new-password"
                  autoFocus
                  className="pr-10"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password*"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                  onClick={() => setShowPassword((value) => !value)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <span
                    className="t-icon-swap"
                    data-state={showPassword ? "b" : "a"}
                  >
                    <EyeIcon className="t-icon" data-icon="a" />
                    <EyeSlashIcon className="t-icon" data-icon="b" />
                  </span>
                </Button>
              </div>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Field>
              <Button disabled={pending} type="submit">
                {pending ? "Creating account…" : "Continue"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Already have an account? <Link href="/login">Log in</Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setEmailSubmitted(true);
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              className="flex flex-col items-center gap-2 font-medium"
              href="/"
            >
              <LogoMark className="size-8" />
              <span className="sr-only">Nucliva</span>
            </Link>
            <h1 className="font-bold text-xl">Create your Nucliva account</h1>
            <FieldDescription>
              Already have an account? <Link href="/login">Log in</Link>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address*"
              required
              type="email"
              value={email}
            />
          </Field>
          <Field>
            <Button type="submit">Continue</Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="flex flex-col gap-4">
            <Button onClick={signInWithGithub} type="button" variant="outline">
              <Icons.gitHub />
              Continue with GitHub
            </Button>
            <Button onClick={signInWithGoogle} type="button" variant="outline">
              <Icons.google />
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
