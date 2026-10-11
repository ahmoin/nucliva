import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "What Nucliva collects, who it is shared with, and the choices you have.",
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      intro="What we collect, why, who helps us run Nucliva, and what you can do about it."
      title="Privacy Policy"
    >
      <LegalSection title="The short version">
        <ul>
          <li>We store your account details and the things you write.</li>
          <li>
            When you use the AI, your text is sent to the AI provider that runs
            the model, and your searches go to the search provider.
          </li>
          <li>We do not sell your data or show you ads.</li>
          <li>Nucliva does not train models on your content.</li>
          <li>You can ask us to delete your data at any time.</li>
        </ul>
      </LegalSection>
      <LegalSection title="What we collect">
        <p>
          <strong>Your account.</strong> Your name and email address. If you
          sign in with Google, we also get your profile picture. If you sign up
          with a password, we store a hash of it, never the password itself.
        </p>
        <p>
          <strong>Guest accounts.</strong> If you try a solution without
          signing up, we create a temporary guest account, with no name or
          email, and put sample notes in it. If you sign up afterwards, what you
          made moves to your new account. Guest accounts that are never used
          again may be deleted.
        </p>
        <p>
          <strong>Sign in details.</strong> When you sign in we record a session,
          including the IP address and browser details (the user agent) it came
          from, so we can keep you signed in and spot misuse.
        </p>
        <p>
          <strong>Your content.</strong> Documents, slides and sheets you
          create, the writing samples you add to teach Nucliva your style, and
          files you add to your knowledge base. We also keep numeric
          representations of that text, called embeddings, so Nucliva can find
          the parts that matter to a request.
        </p>
        <p>
          <strong>Apps you connect.</strong> If you connect another app, we keep
          the details and the access token it gives us so Nucliva can work with
          it.
        </p>
        <p>
          <strong>On your device.</strong> Your chat history with the assistant
          for each document, your theme choice and a local copy of your
          documents are stored in your browser. See our{" "}
          <Link href="/cookies">Cookies page</Link>.
        </p>
      </LegalSection>
      <LegalSection title="How we use it">
        <ul>
          <li>To run Nucliva and show you your work.</li>
          <li>
            To write, edit and research for you, in the style you have taught
            it.
          </li>
          <li>To keep the service secure and fix problems.</li>
          <li>To answer you when you write to us.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Who else handles your data">
        <p>
          We use these providers to run Nucliva. They process data for us and
          have their own privacy policies.
        </p>
        <ul>
          <li>
            <strong>Neon</strong> hosts our database, where your account and
            content are stored.
          </li>
          <li>
            <strong>Vercel</strong> hosts the website and receives the normal
            request logs a host keeps.
          </li>
          <li>
            <strong>Nebius Token Factory</strong> runs the AI models (NVIDIA
            Nemotron) and the embedding model. The text you ask about, along
            with the parts of your document and style samples needed for the
            request, is sent to it each time you use the assistant, autocomplete
            or add text to your knowledge base.
          </li>
          <li>
            <strong>Tavily</strong> runs the web search when you ask Nucliva to
            research something. The search request, which can include words from
            your prompt, is sent to it.
          </li>
          <li>
            <strong>Google</strong> handles sign in when you choose it.
          </li>
          <li>
            <strong>LangSmith</strong> may receive prompts and replies for
            debugging, only when we switch tracing on.
          </li>
        </ul>
        <p>
          We may also share data if the law requires it, or to protect people
          from harm. If Nucliva is ever sold or merged, your data may move with
          it, and we would tell you first.
        </p>
      </LegalSection>
      <LegalSection title="Keeping it">
        <p>
          We keep your content until you delete it or your account. Documents
          you move to the trash stay there until you empty it. If you ask us to
          delete your account, we remove your data from our database. Some
          backups and provider logs may hold copies for a short time after.
        </p>
      </LegalSection>
      <LegalSection title="Your choices">
        <ul>
          <li>Edit or delete your documents and samples in Nucliva at any time.</li>
          <li>
            Ask us for a copy of your data, to correct it, or to delete it, at{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </li>
          <li>
            Clear the data stored in your browser through your browser&apos;s
            settings.
          </li>
        </ul>
        <p>
          Depending on where you live, you may have more rights over your data,
          such as objecting to how it is used. Write to us and we will help.
        </p>
      </LegalSection>
      <LegalSection title="Children">
        <p>
          Nucliva is not meant for children under 13, and we do not knowingly
          collect their data. If you think a child has given us theirs, tell us
          and we will delete it.
        </p>
      </LegalSection>
      <LegalSection title="Security">
        <p>
          We take care to protect your data, as described on our{" "}
          <Link href="/security">Security page</Link>. No service can promise perfect
          security.
        </p>
      </LegalSection>
      <LegalSection title="Changes">
        <p>
          We will update this policy as Nucliva changes, and change the date at
          the top. If a change is important, we will say so in the app.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          Questions or requests about your data? Write to{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
