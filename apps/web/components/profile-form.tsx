"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

function ProfileFields({
  user,
}: {
  user: { email: string; image?: string | null; name: string };
}) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const { error: updateError } = await authClient.updateUser({ name });
    setPending(false);
    if (updateError) {
      setError(updateError.message ?? "Could not update your profile.");
      return;
    }
    setSaved(true);
  };

  return (
    <form
      className="motion-safe:fade-in-0 max-w-sm motion-safe:animate-in motion-safe:duration-200"
      onSubmit={submit}
    >
      <FieldGroup>
        <Avatar className="size-16">
          <AvatarImage alt={user.name} src={user.image ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input disabled id="email" type="email" value={user.email} />
          {error ? <FieldError>{error}</FieldError> : null}
          {saved ? <FieldDescription>Profile updated.</FieldDescription> : null}
        </Field>
        <Field>
          <Button disabled={pending} type="submit">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export function ProfileForm() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-64 w-full max-w-sm" />;
  }

  return session ? <ProfileFields user={session.user} /> : null;
}
