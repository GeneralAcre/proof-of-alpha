import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Proof of Alpha",
  description: "Privacy Policy for Proof of Alpha, a fully on-chain game on Solana.",
};

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: `Proof of Alpha ("we," "us," or "our") is an on-chain dating-practice game deployed on the Solana blockchain, operated by its developer (contact: proofonchainalpha@gmail.com). This Privacy Policy explains how we handle information when you access or use the Proof of Alpha application ("App").`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect only the minimum information necessary to operate the App:

• Wallet Address (Public Blockchain Data): When you connect a Solana wallet, your public key is recorded on the Solana blockchain. This is public by design and not within our control.

• Game Data: AURA scores, leaderboard rankings, character selections, gang/guild affiliations, and in-game activity are stored in our database (Supabase) to power gameplay features.

• Chat & Message Content: Messages you send during gameplay are processed to generate AI responses and may be stored temporarily to support game mechanics.

• Contact Form Submissions: If you reach out via our contact form, we receive your name, email address, and message content to respond to your inquiry.

We do not collect passwords, government ID, payment card data, or biometric information.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use the information we collect to:

• Operate and improve the App and its on-chain features
• Display leaderboards, profiles, and gang rankings
• Prevent cheating, abuse, and violations of our Terms of Service
• Respond to support and contact requests
• Comply with applicable law and enforce our policies

We do not sell your personal information to third parties.`,
  },
  {
    title: "4. Third-Party Services",
    body: `The App integrates with third-party services that may process your data:

• Solana Blockchain: All on-chain transactions (AURA tokens, program interactions) are permanently public and immutable.
• Supabase: Our database and backend infrastructure provider. Subject to Supabase's own privacy policy.
• Solana Mobile / Saga / Seeker: Mobile wallet adapter interactions are governed by the respective wallet provider's policies.
• Wallet Providers (Phantom, Solflare, and others): Your wallet provider's privacy policy governs data handled by your wallet application.

We require all third-party services with access to your data to maintain privacy practices consistent with this Policy and with the Solana Mobile Publisher Policy.`,
  },
  {
    title: "5. Minors",
    body: `Proof of Alpha contains mature themes (flirting, dating-practice content) and is intended for users aged 18 and older. We do not knowingly collect personal data from anyone under the age of 18 (or the applicable age of majority in your jurisdiction). If we become aware that a minor has provided us with personal information, we will delete it promptly. Parents or guardians who believe their child has submitted data should contact us at proofonchainalpha@gmail.com.`,
  },
  {
    title: "6. Your Rights & Account Deletion",
    body: `You have the right to:

• Access the data we hold about you
• Request correction of inaccurate data
• Request deletion of your account and associated off-chain data (note: on-chain data on Solana is permanent and beyond our control)

To exercise any of these rights, contact us at proofonchainalpha@gmail.com with the subject line "Data Request." We will respond within 30 days.`,
  },
  {
    title: "7. Data Retention",
    body: `We retain game data (scores, profiles) for as long as your account is active or as needed to operate the App. Contact form data is deleted once we have resolved your inquiry. You may request early deletion at any time (see Section 6).`,
  },
  {
    title: "8. Security",
    body: `We apply industry-standard security practices to protect your data, including:

• Encrypted data transmission (TLS/HTTPS) for all data in transit
• Encryption and access controls for data at rest in our database
• Principle of least-privilege access for internal systems

However, no method of transmission or storage is 100% secure. Blockchain data is public and outside our control.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will post the updated version in the App with a revised effective date. Your continued use of the App after any changes constitutes acceptance of the updated Policy.`,
  },
  {
    title: "10. Contact Us",
    body: `If you have questions or concerns about this Privacy Policy, please contact:

Proof of Alpha Developer
Email: proofonchainalpha@gmail.com
Twitter/X: @created_alpha`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0d0820]">

      {/* Back button — outside content box, left edge */}
      <div className="px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 border-2 border-[#E4D474] bg-[#E4D474] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#24153E] shadow-[3px_3px_0_rgba(0,0,0,0.4)] transition hover:bg-transparent hover:text-[#E4D474]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 1L3 6l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">

        {/* Header */}
        <div className="mb-12 border-b border-[#a09ab8]/20 pb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a09ab8]/60">
            Legal
          </p>
          <h1 className="font-mono text-3xl font-black uppercase tracking-[0.15em] text-[#E4D474]">
            Privacy Policy
          </h1>
          <p className="mt-3 font-mono text-xs text-[#a09ab8]/70">
            Effective Date: June 18, 2026 &nbsp;·&nbsp; Last Updated: June 18, 2026
          </p>
        </div>

        {/* Intro */}
        <p className="mb-10 font-mono text-sm leading-7 text-[#ffffff]/70">
          This Privacy Policy describes how Proof of Alpha collects, uses, and protects information
          in connection with your use of our application. By using the App, you agree to the
          practices described below.
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#E4D474]">
                {title}
              </h2>
              <div className="font-mono text-sm leading-7 text-[#ffffff]/70 whitespace-pre-line">
                {body}
              </div>
            </section>
          ))}
        </div>


      </div>
    </main>
  );
}
