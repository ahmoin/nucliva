import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;

// Signing in with an account somewhere else, and coming back to the app.
export const signInWithGoogle = () =>
  authClient.signIn.social({ callbackURL: "/dashboard", provider: "google" });

export const signInWithGithub = () =>
  authClient.signIn.social({ callbackURL: "/dashboard", provider: "github" });
