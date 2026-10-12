import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
      requireLocalEmailVerified: false,
      trustedProviders: ["google", "github"],
    },
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    // A visitor trying a solution gets a guest account. When they sign up, the
    // guest's work moves to the new account before the guest is deleted.
    anonymous({
      generateName: () => "Guest",
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        const from = anonymousUser.user.id;
        const to = newUser.user.id;

        await db
          .update(schema.documents)
          .set({ userId: to })
          .where(eq(schema.documents.userId, from));
        await db
          .update(schema.styleSamples)
          .set({ userId: to })
          .where(eq(schema.styleSamples.userId, from));
        await db
          .update(schema.vectorEmbeddings)
          .set({ userId: to })
          .where(eq(schema.vectorEmbeddings.userId, from));
      },
    }),
    nextCookies(),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});
