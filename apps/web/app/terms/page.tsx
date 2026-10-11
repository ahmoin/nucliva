import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "The rules for using Nucliva: your content, AI output, acceptable use and what to expect from the service.",
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage
      intro="The plain rules for using Nucliva. Please read them before you sign up."
      title="Terms of Service"
    >
      <LegalSection title="Agreeing to these terms">
        <p>
          By creating an account or using Nucliva, you agree to these terms. If
          you do not agree, please do not use the service.
        </p>
      </LegalSection>
      <LegalSection title="What Nucliva is">
        <p>
          Nucliva is an AI writing workspace. You can write documents, slides
          and sheets, ask an assistant to research and draft, and review every
          change it suggests before it goes into your work.
        </p>
        <p>
          Nucliva is still under active development. Features will change, and
          some are unfinished. We may add, change or remove parts of the
          service at any time.
        </p>
      </LegalSection>
      <LegalSection title="Your account">
        <ul>
          <li>
            You need to be old enough to form a binding agreement where you
            live.
          </li>
          <li>Give us accurate details and keep your sign in secure.</li>
          <li>
            You are responsible for what happens under your account. Tell us at{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a> if you think
            someone else has got in.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="Your content">
        <p>
          What you write, upload or paste into Nucliva is yours. We do not claim
          ownership of it.
        </p>
        <p>
          To run the service, you give us permission to store your content and
          to process it, including by sending it to the AI and search providers
          described in our <Link href="/privacy">Privacy Policy</Link>. We use that
          permission only to provide Nucliva to you, and it ends when you delete
          your content or your account.
        </p>
        <p>
          You promise that you have the right to use what you put in, and that
          it does not break the law or anyone else&apos;s rights.
        </p>
      </LegalSection>
      <LegalSection title="AI output">
        <p>
          Nucliva uses AI models to draft, edit and research. They can be wrong,
          out of date or biased, and they can make things up, including
          quotations and sources.
        </p>
        <ul>
          <li>Check anything that matters before you rely on it or share it.</li>
          <li>
            Nucliva is not a lawyer, doctor, financial adviser or any other
            professional, and its output is not professional advice.
          </li>
          <li>
            You are responsible for how you use what Nucliva writes for you.
          </li>
        </ul>
        <p>
          Similar requests from different people can produce similar text. We do
          not promise that output is unique.
        </p>
      </LegalSection>
      <LegalSection title="Using Nucliva fairly">
        <p>Please do not:</p>
        <ul>
          <li>Use the service to break the law or to harm other people.</li>
          <li>
            Create or share content that is hateful, harassing, deceptive, or
            sexually exploits children.
          </li>
          <li>
            Try to get into accounts or data that are not yours, or to disrupt
            or overload the service.
          </li>
          <li>
            Scrape the service, or use it to build a competing model, without
            our written permission.
          </li>
          <li>Pass off AI output as a person&apos;s work where that is not allowed.</li>
        </ul>
        <p>
          We can remove content or suspend an account that breaks these rules.
        </p>
      </LegalSection>
      <LegalSection title="Other companies' services">
        <p>
          Nucliva relies on providers for hosting, sign in, AI models and web
          search. Using Nucliva means their services are used too, and some of
          their own terms may apply. We list them in the Privacy Policy.
        </p>
      </LegalSection>
      <LegalSection title="Availability and changes">
        <p>
          We try to keep Nucliva running, but we do not promise it will always
          be available or free of mistakes. We may change or stop the service,
          and we will try to give notice when that affects your work. Keep your
          own copies of anything you cannot afford to lose.
        </p>
      </LegalSection>
      <LegalSection title="No warranty">
        <p>
          Nucliva is provided &quot;as is&quot; and &quot;as available&quot;,
          without promises of any kind, to the extent the law allows. That
          includes promises that it is accurate, reliable, or fit for a
          particular purpose.
        </p>
      </LegalSection>
      <LegalSection title="Limit of liability">
        <p>
          To the extent the law allows, Nucliva and the people behind it are
          not liable for indirect or consequential losses, lost profits or lost
          data arising from your use of the service. Where liability cannot be
          excluded, it is limited to the amount you paid us in the twelve months
          before the claim, which for the free service is nothing.
        </p>
        <p>
          Nothing here limits rights you have by law that cannot be limited.
        </p>
      </LegalSection>
      <LegalSection title="Ending your use">
        <p>
          You can stop using Nucliva at any time, and you can ask us to delete
          your account. We can suspend or end your access if you break these
          terms or if we have to stop the service.
        </p>
      </LegalSection>
      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms as Nucliva changes. When we do, we will
          change the date at the top. If you keep using the service after that,
          you accept the new terms.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          Questions about these terms? Write to{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
