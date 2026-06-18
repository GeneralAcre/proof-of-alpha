export const metadata = {
  title: "Terms of Service — Proof of Alpha",
  description: "Terms of Service and End User License Agreement for Proof of Alpha.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using Proof of Alpha (the "App"), you agree to be bound by these Terms of Service and End User License Agreement ("Terms"). If you do not agree, do not use the App.

These Terms incorporate and comply with the Solana Mobile dApp Store Publisher Policy (https://docs.solanamobile.com/dapp-store/publisher-policy), which governs apps distributed through the Solana Mobile dApp Store.`,
  },
  {
    title: "2. Age Requirement",
    body: `You must be at least 18 years old (or the age of majority in your jurisdiction, whichever is higher) to use this App. Proof of Alpha contains mature themes including simulated romantic interaction and flirting mechanics. By using the App, you represent and warrant that you meet this age requirement.

We do not knowingly permit minors to use the App. If we discover a minor is using the App, we will terminate their access and delete their off-chain data.`,
  },
  {
    title: "3. License Grant",
    body: `Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the App for personal, non-commercial entertainment purposes.

You may not:
• Copy, modify, or distribute the App or its source code without our permission
• Reverse engineer, decompile, or disassemble the App
• Use the App to develop a competing product or service
• Remove or alter any proprietary notices or labels on the App`,
  },
  {
    title: "4. On-Chain Interactions & Crypto Disclaimer",
    body: `Proof of Alpha involves interactions with the Solana blockchain, including:

• Connecting a Solana wallet to authenticate your identity
• Earning and holding AURA tokens (in-game utility token)
• Staking and in-game token mechanics

IMPORTANT: All blockchain transactions are irreversible. We are not responsible for lost funds, failed transactions, or wallet errors. AURA tokens are an in-game utility token and do not represent any investment, security, or monetary value. Nothing in the App constitutes financial, investment, or legal advice.

You are solely responsible for the security of your wallet and private keys. Never share your seed phrase with anyone.`,
  },
  {
    title: "5. User Conduct",
    body: `You agree not to use the App to:

• Harass, abuse, threaten, or harm other users
• Post or transmit illegal, obscene, defamatory, or hateful content
• Exploit bugs or vulnerabilities to gain an unfair advantage (cheating)
• Use bots, scripts, or automated tools to manipulate game mechanics
• Impersonate any person or entity
• Violate any applicable local, national, or international law or regulation
• Engage in any activity that violates the Solana Mobile dApp Store Publisher Policy

We reserve the right to suspend or terminate any account that violates these rules, at our sole discretion and without prior notice.`,
  },
  {
    title: "6. User-Generated Content",
    body: `If you submit any content through the App (including chat messages, profile information, or user interactions), you grant us a non-exclusive, royalty-free, worldwide license to use, store, display, and process that content solely for the purpose of operating the App.

You represent and warrant that your content:
• Does not infringe any third-party intellectual property rights
• Does not contain illegal material, including child sexual abuse material (CSAM)
• Complies with these Terms and the Solana Mobile Publisher Policy

You agree that the same content restrictions in these Terms apply to any content you submit, and you take responsibility for compliance.`,
  },
  {
    title: "7. Privacy",
    body: `Our Privacy Policy (available at /privacy-policy) describes how we collect and handle your data and is incorporated into these Terms by reference. By using the App, you also agree to our Privacy Policy.`,
  },
  {
    title: "8. Prohibited Content & Activities",
    body: `The following are strictly prohibited on Proof of Alpha, consistent with the Solana Mobile dApp Store Publisher Policy:

• Content that sexualizes minors in any form
• Real-money gambling or unlicensed financial services
• Malware, spyware, phishing, or deceptive software behavior
• Content that promotes violence, terrorism, or illegal activity
• Unauthorized collection or misuse of user data
• Circumventing or interfering with the Solana Mobile dApp Store or its review processes

Violation of any of these prohibitions will result in immediate account termination and may be reported to relevant authorities.`,
  },
  {
    title: "9. Intellectual Property",
    body: `All content, branding, artwork, code, and game mechanics in Proof of Alpha are owned by or licensed to us. "Proof of Alpha," the AURA token branding, character art, and associated logos are our intellectual property.

The Solana protocol and related open-source components are owned by their respective rights holders and are used under their applicable open-source licenses.`,
  },
  {
    title: "10. Account Termination & Data Deletion",
    body: `You may request deletion of your account and off-chain data at any time by contacting acreforcoding@gmail.com. We will process deletion requests within 30 days.

Note: On-chain data (transactions, token balances recorded on the Solana blockchain) is permanent and cannot be deleted by us.

We may terminate your access to the App at any time, with or without notice, if you violate these Terms or if we discontinue the App.`,
  },
  {
    title: "11. Disclaimers",
    body: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.`,
  },
  {
    title: "12. Limitation of Liability",
    body: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE APP SHALL NOT EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, WHICHEVER IS GREATER.`,
  },
  {
    title: "13. Governing Law & Disputes",
    body: `These Terms are governed by and construed in accordance with applicable law. Any dispute arising from these Terms or your use of the App shall be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration, except where prohibited by applicable law.`,
  },
  {
    title: "14. Changes to These Terms",
    body: `We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms in the App with a revised effective date. Your continued use of the App after any changes constitutes your acceptance of the updated Terms.`,
  },
  {
    title: "15. Contact",
    body: `For questions about these Terms, contact:

Proof of Alpha Developer
Email: acreforcoding@gmail.com
Twitter/X: @created_alpha`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d0820] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-12 border-b border-[#a09ab8]/20 pb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a09ab8]/60">
            Legal
          </p>
          <h1 className="font-mono text-3xl font-black uppercase tracking-[0.15em] text-[#E4D474]">
            Terms of Service
          </h1>
          <p className="mt-1 font-mono text-xs text-[#a09ab8]/50">
            End User License Agreement (EULA)
          </p>
          <p className="mt-3 font-mono text-xs text-[#a09ab8]/70">
            Effective Date: June 18, 2025 &nbsp;·&nbsp; Last Updated: June 18, 2025
          </p>
        </div>

        {/* Intro */}
        <p className="mb-10 font-mono text-sm leading-7 text-[#ffffff]/70">
          Please read these Terms of Service carefully before using Proof of Alpha. These Terms
          constitute a legally binding agreement between you and the Proof of Alpha developer.
          These Terms comply with the{" "}
          <a
            href="https://docs.solanamobile.com/dapp-store/publisher-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E4D474] underline underline-offset-2 hover:opacity-80 transition"
          >
            Solana Mobile dApp Store Publisher Policy
          </a>
          .
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
