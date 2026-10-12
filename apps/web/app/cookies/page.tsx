import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "The cookies and browser storage Nucliva uses, and why there is no cookie banner.",
  title: "Cookies",
};

export default function CookiesPage() {
  return (
    <LegalPage
      intro="What Nucliva keeps in your browser, and why."
      title="Cookies"
    >
      <LegalSection title="The short version">
        <p>
          Nucliva only uses what it needs to work. We do not use advertising
          cookies, and we do not run analytics or tracking scripts. Because
          everything here is essential, there is no cookie banner to click.
        </p>
      </LegalSection>
      <LegalSection title="Cookies">
        <ul>
          <li>
            <strong>Session cookie.</strong> Keeps you signed in as you move
            around Nucliva. It is set when you sign in and removed when you sign
            out or it expires.
          </li>
          <li>
            <strong>Sign in cookies.</strong> Short-lived cookies that complete
            signing in with Google or GitHub safely, and that expire soon after.
          </li>
        </ul>
        <p>
          Our host, Vercel, may also handle technical data, such as your IP
          address, as part of serving the site. That is covered in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
      <LegalSection title="Browser storage">
        <p>
          Nucliva also keeps some things in your browser&apos;s own storage,
          which stays on your device:
        </p>
        <ul>
          <li>
            <strong>Theme.</strong> Whether you chose light, dark or the system
            setting.
          </li>
          <li>
            <strong>Assistant chat history.</strong> Your conversation with the
            assistant for each document, so it is there when you come back.
            Clearing the chat removes it.
          </li>
          <li>
            <strong>Local documents.</strong> A copy of your documents, so they
            open quickly and your work is not lost between saves.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="Your choices">
        <p>
          You can delete cookies and site data at any time in your
          browser&apos;s settings. If you block the session cookie, you will not
          be able to stay signed in. Clearing local storage removes your chat
          history and local copies from this device, but not the documents saved
          to your account.
        </p>
      </LegalSection>
      <LegalSection title="Changes and questions">
        <p>
          If we ever add anything that is not essential, we will update this
          page first and ask for your permission. Questions? Write to{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
