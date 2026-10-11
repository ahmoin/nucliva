import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "How Nucliva protects your account and your writing, what it does not do yet, and how to report a problem.",
  title: "Security",
};

export default function SecurityPage() {
  return (
    <LegalPage
      intro="How we protect your account and your writing, and how to tell us if we got something wrong."
      title="Security"
    >
      <LegalSection title="What we do">
        <ul>
          <li>
            <strong>Encrypted connections.</strong> Nucliva is served over
            HTTPS, and our connection to the database is encrypted.
          </li>
          <li>
            <strong>Passwords are hashed.</strong> We never store your password.
            It is hashed before it is saved. You can also sign in with Google
            and skip passwords altogether.
          </li>
          <li>
            <strong>Safer sessions.</strong> You stay signed in with a session
            cookie that scripts on a page cannot read.
          </li>
          <li>
            <strong>Your data is yours alone.</strong> Documents, writing
            samples and embeddings are saved against your account, and requests
            for them are limited to the person signed in.
          </li>
          <li>
            <strong>Secrets stay out of the code.</strong> Keys for the database
            and AI services live in environment settings on our host, not in the
            repository.
          </li>
          <li>
            <strong>Open code.</strong> Nucliva is open source, so anyone can
            read how it works.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="Where your data goes">
        <p>
          To write for you, Nucliva sends text to its AI provider, and your
          searches to its search provider. We keep that to what a request needs.
          The full list is in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
      <LegalSection title="What we do not have yet">
        <p>
          Nucliva is a young project. It has not been through an independent
          security audit, and it does not hold certifications such as SOC 2 or
          ISO 27001. Please do not put anything into it that you could not
          afford to have exposed.
        </p>
        <p>
          Things we would like to add: sign in protections like two-factor
          authentication, and clearer controls over what is sent to the AI.
        </p>
      </LegalSection>
      <LegalSection title="What you can do">
        <ul>
          <li>Use a long, unique password, or sign in with Google.</li>
          <li>Sign out on shared computers.</li>
          <li>Keep your own copy of work you cannot lose.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Reporting a problem">
        <p>
          If you find a security problem, please tell us at{" "}
          <a href={`mailto:${contactEmail}?subject=Security`}>{contactEmail}</a>{" "}
          with &quot;Security&quot; in the subject. Give us the steps to
          reproduce it, and a little time to fix it before you share it. We
          will reply as soon as we can.
        </p>
        <p>
          Please act in good faith: do not read, change or delete other
          people&apos;s data, and do not disrupt the service while you test.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
