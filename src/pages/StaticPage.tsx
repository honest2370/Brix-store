import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   StaticPage — full-length, professional legal & informational pages.
   Structured with semantic HTML so Google Search Console, Google Site
   Verification, and cloud crawlers can index and verify correctly.
───────────────────────────────────────────────────────────────────────────── */

const YEAR = new Date().getFullYear();

type Section = { heading: string; body: string | string[] };

interface PageData {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: Section[];
}

const PAGES: Record<string, PageData> = {
  terms: {
    title: "Terms of Service",
    subtitle: "Please read these terms carefully before using Brixnode.",
    lastUpdated: `June 1, ${YEAR}`,
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or using Brixnode (\"Platform\"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this Platform. These terms apply to all visitors, buyers, creators, and agents.",
      },
      {
        heading: "2. Platform Description",
        body: [
          "Brixnode is a digital marketplace that enables creators to list, sell, and deliver digital products including but not limited to: eBooks, templates, AI prompt packs, courses & guides, graphics & icons, fonts, presets & LUTs, planners & printables, account access, proxies, and other digital assets.",
          "Brixnode acts as a marketplace platform. We do not produce or take ownership of listed products. We facilitate the connection between buyers and sellers and verify payments before releasing product access.",
        ],
      },
      {
        heading: "3. Account Registration",
        body: [
          "You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials. You agree to notify Brixnode immediately at support@brixnode.com of any unauthorised use of your account.",
          "Brixnode reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are found to be involved in abuse of any Platform features.",
        ],
      },
      {
        heading: "4. Payment & Order Process",
        body: [
          "All payments are processed manually via third-party payment channels (e.g. bank transfer, mobile money, cryptocurrency). After payment is made, buyers upload a screenshot of their payment proof. Orders remain in a 'pending' state until an admin reviews and approves the proof.",
          "Brixnode does not guarantee payment processing times. Approvals are typically completed within a few hours but may take up to 24 hours depending on volume. Brixnode is not liable for delays caused by inaccurate payment information provided by the buyer.",
        ],
      },
      {
        heading: "5. Creator Obligations",
        body: [
          "Creators must own all rights to the content they list or have an explicit licence to sell it. Uploading counterfeit, plagiarised, or stolen content is strictly prohibited and will result in immediate account termination and potential legal action.",
          "Creators agree to fulfil all approved orders accurately. Brixnode takes a platform commission (configurable by admin) on each approved sale. Payouts are processed to the creator's registered payout details after admin approval.",
        ],
      },
      {
        heading: "6. Prohibited Activities",
        body: [
          "The following are strictly prohibited on Brixnode: listing malware, harmful software, or illegal account credentials; impersonating other users or brands; manipulating order statuses; spamming or harassing other users; violating any applicable laws or regulations.",
          "Brixnode reserves the right to remove any listing, suspend any account, or take legal action in response to prohibited activities.",
        ],
      },
      {
        heading: "7. Limitation of Liability",
        body: "Brixnode is provided on an 'as is' and 'as available' basis. We make no warranties regarding the accuracy, completeness, or suitability of any content on the Platform. To the maximum extent permitted by law, Brixnode shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.",
      },
      {
        heading: "8. Intellectual Property",
        body: "All Platform branding, design, code, and infrastructure are the intellectual property of Brixnode. Creators retain ownership of their original content. By listing on Brixnode, creators grant Brixnode a non-exclusive licence to display, deliver, and promote their content within the Platform.",
      },
      {
        heading: "9. Changes to Terms",
        body: "Brixnode reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes your acceptance of the updated terms. We will notify users of significant changes via in-app notification or email.",
      },
      {
        heading: "10. Governing Law",
        body: "These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from use of the Platform shall be resolved through good-faith negotiation before escalation to legal proceedings.",
      },
      {
        heading: "11. Contact",
        body: "For questions regarding these Terms, contact us at support@brixnode.com.",
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    subtitle: "Your privacy is important to us. This policy explains what we collect and why.",
    lastUpdated: `June 1, ${YEAR}`,
    sections: [
      {
        heading: "1. Who We Are",
        body: "Brixnode (\"we\", \"us\", or \"our\") operates the Brixnode digital marketplace platform accessible at brixnode.com. This Privacy Policy applies to all users of the Platform including buyers, creators, and agents.",
      },
      {
        heading: "2. Information We Collect",
        body: [
          "Account Information: When you register, we collect your username, email address, and phone number (optional). Creators may additionally provide payout details (e.g. bank account or wallet addresses).",
          "Order & Transaction Data: We store order history, payment references, payment proof images (uploaded by buyers), product access tokens, and transaction amounts.",
          "Profile & Store Data: Creators' store names, bios, logos, links, and product listings are stored to power their public storefronts.",
          "Usage Analytics: We may collect anonymised data about how users navigate the Platform (pages visited, features used) to improve the service. No personal identifiers are included in analytics.",
          "Communications: If you contact our support team, we retain your messages to resolve your issue and improve our service.",
        ],
      },
      {
        heading: "3. How We Use Your Information",
        body: [
          "To provide, operate, and maintain the Platform and its features.",
          "To process and approve orders, release product access, and calculate creator payouts.",
          "To send transactional notifications (order status, payment approval, access links).",
          "To enforce our Terms of Service and prevent fraud or abuse.",
          "To communicate important service updates, security alerts, or support responses.",
          "We do not use your data for unsolicited marketing without your explicit consent.",
        ],
      },
      {
        heading: "4. Data Storage & Security",
        body: [
          "All data is stored in secure, encrypted databases hosted on Supabase (built on AWS infrastructure). Payment proof screenshots are stored in private, access-controlled storage buckets viewable only by authorised admins.",
          "We implement industry-standard security measures including HTTPS, access controls, and regular security reviews. However, no method of transmission over the Internet or electronic storage is 100% secure.",
        ],
      },
      {
        heading: "5. Data Sharing",
        body: [
          "We do not sell, trade, or rent your personal information to third parties.",
          "We may share data with trusted service providers who assist in operating the Platform (e.g. cloud hosting, analytics), under strict confidentiality obligations.",
          "We may disclose information if required by law, court order, or to protect the rights, property, or safety of Brixnode, our users, or the public.",
        ],
      },
      {
        heading: "6. Cookies",
        body: "Brixnode uses minimal cookies required for session authentication and Platform functionality. We do not use third-party advertising cookies. You may configure your browser to refuse cookies, but this may limit certain Platform features.",
      },
      {
        heading: "7. Your Rights (GDPR & Global)",
        body: [
          "Access: You may request a copy of the personal data we hold about you.",
          "Correction: You may update your account information at any time via Account Settings.",
          "Deletion: You may request deletion of your account and associated data by emailing support@brixnode.com. Note that order records may be retained for a period required by applicable financial regulations.",
          "Portability: You may request an export of your personal data in a machine-readable format.",
          "Objection: You may object to processing of your data for marketing purposes at any time.",
        ],
      },
      {
        heading: "8. Children's Privacy",
        body: "Brixnode is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal data, we will delete it promptly.",
      },
      {
        heading: "9. Changes to This Policy",
        body: "We may update this Privacy Policy periodically. We will notify you of material changes via in-app notification or email. Continued use of the Platform after updates constitutes acceptance.",
      },
      {
        heading: "10. Contact Us",
        body: "For privacy-related questions or data requests, contact our team at support@brixnode.com.",
      },
    ],
  },

  creators: {
    title: "Creator Agreement",
    subtitle: "Everything you need to know about selling on Brixnode.",
    lastUpdated: `June 1, ${YEAR}`,
    sections: [
      {
        heading: "1. Eligibility",
        body: "To sell on Brixnode, you must be at least 18 years old (or the legal age of majority in your jurisdiction), have a valid Brixnode account, and comply with all applicable laws in your country.",
      },
      {
        heading: "2. Content Ownership & Licensing",
        body: [
          "You retain full ownership of all original content you list on Brixnode. By publishing a product, you grant Brixnode a worldwide, non-exclusive, royalty-free licence to display, market, and deliver your product to buyers through the Platform.",
          "You warrant that you own or have the legal right to sell every item you list. You must not list content that infringes upon trademarks, copyrights, patents, or any other intellectual property rights of third parties.",
        ],
      },
      {
        heading: "3. Prohibited Listings",
        body: [
          "The following product types are strictly prohibited on Brixnode:",
          "• Malware, spyware, ransomware, or any harmful software.",
          "• Stolen account credentials, cracked software, or pirated content.",
          "• Products that violate any applicable law or regulation.",
          "• Content that facilitates fraud, scams, or deceptive practices.",
          "• Adult or explicit content without prior written admin approval.",
          "Violation of these rules will result in immediate listing removal, account suspension, and potential legal action.",
        ],
      },
      {
        heading: "4. Pricing & Commission",
        body: [
          "You set your own product prices in your chosen currency. Brixnode deducts a platform commission (configured by admin, default 20%) from each approved sale before crediting your balance.",
          "Example: A product priced at $100 results in an $80 credit to your Brixnode balance after the 20% commission.",
          "Commission rates may be adjusted by admin. You will be notified of any rate changes.",
        ],
      },
      {
        heading: "5. Payouts",
        body: [
          "Earned balances can be withdrawn by submitting a payout request via your dashboard. You must add valid payout details (bank account, mobile money, or crypto wallet) before requesting a payout.",
          "Payouts are processed manually by admin within 1–5 business days. Brixnode is not liable for delays caused by third-party payment processors or incorrect payout information submitted by you.",
        ],
      },
      {
        heading: "6. Order Fulfilment",
        body: "Brixnode delivers product access automatically after admin approves the buyer's payment. For stock-type products, you are responsible for ensuring stock items are valid and up-to-date. For file-based products, ensure your files are accessible and downloadable at all times.",
      },
      {
        heading: "7. Refunds & Disputes",
        body: "Refund requests are handled on a case-by-case basis by Brixnode admin. If a buyer raises a legitimate dispute (e.g. non-functional product, misrepresented content), Brixnode may deduct the refund amount from your creator balance. Repeated disputes may result in account review.",
      },
      {
        heading: "8. Account Termination",
        body: "Brixnode reserves the right to suspend or terminate creator accounts that violate this Agreement, engage in fraudulent activity, or repeatedly receive substantiated buyer complaints. Balances at the time of termination will be reviewed on a case-by-case basis.",
      },
      {
        heading: "9. Agreement Updates",
        body: "This Creator Agreement may be updated periodically. Continued use of creator features after updates constitutes your acceptance. Material changes will be communicated via in-app notification.",
      },
      {
        heading: "10. Contact",
        body: "For creator support, contact support@brixnode.com.",
      },
    ],
  },

  dmca: {
    title: "DMCA & Refund Policy",
    subtitle: "How we handle copyright claims and buyer refund requests.",
    lastUpdated: `June 1, ${YEAR}`,
    sections: [
      {
        heading: "DMCA Copyright Policy",
        body: "Brixnode respects intellectual property rights and expects all users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and respond promptly to valid copyright infringement notifications.",
      },
      {
        heading: "How to Submit a DMCA Takedown Notice",
        body: [
          "If you believe content on Brixnode infringes your copyright, please send a written notice to support@brixnode.com containing all of the following:",
          "1. Your full name, address, telephone number, and email address.",
          "2. A description of the copyrighted work you claim has been infringed.",
          "3. The exact URL(s) of the allegedly infringing content on Brixnode.",
          "4. A statement that you have a good faith belief the use is not authorised by the copyright owner, its agent, or the law.",
          "5. A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorised to act on their behalf.",
          "6. Your electronic or physical signature.",
        ],
      },
      {
        heading: "Our Response Process",
        body: [
          "Upon receiving a valid DMCA notice, Brixnode will: acknowledge receipt within 48 hours; promptly remove or disable access to the allegedly infringing content; notify the content creator of the claim; and allow the creator to submit a counter-notice if they believe the claim is in error.",
          "Repeat infringers will have their accounts permanently suspended from Brixnode.",
        ],
      },
      {
        heading: "Counter-Notice Procedure",
        body: "If you believe your content was removed in error, you may submit a counter-notice to support@brixnode.com. Your counter-notice must include: your contact information; identification of the removed content; a statement under penalty of perjury that you have a good faith belief the material was removed in error; and your consent to the jurisdiction of applicable courts.",
      },
      {
        heading: "Refund Policy",
        body: "Due to the digital nature of products on Brixnode, all sales are generally considered final once a buyer's access link has been delivered. We understand that issues can arise, and we evaluate refund requests on a case-by-case basis.",
      },
      {
        heading: "Eligible Refund Situations",
        body: [
          "You may be eligible for a refund if:",
          "• The product you received is materially different from its description.",
          "• The product files are inaccessible, corrupted, or non-functional upon delivery.",
          "• Your payment was approved but access was not delivered within 48 hours.",
          "• Duplicate payment was made for the same order.",
        ],
      },
      {
        heading: "Non-Eligible Refund Situations",
        body: [
          "Refunds will not be issued for:",
          "• Change of mind after payment proof approval.",
          "• Incompatibility of the product with software not specified in the listing.",
          "• Failure to read the product description before purchasing.",
          "• Products that have already been downloaded and accessed.",
        ],
      },
      {
        heading: "How to Request a Refund",
        body: "To request a refund, email support@brixnode.com within 48 hours of order delivery with your order details and a clear description of the issue. Our team will review and respond within 2 business days.",
      },
    ],
  },

  about: {
    title: "About Brixnode",
    subtitle: "The elevated hub for digital tools, AI assets, and creator knowledge.",
    sections: [
      {
        heading: "Who We Are",
        body: "Brixnode is a next-generation digital marketplace built for the modern creator economy. We connect talented digital creators with buyers who need high-quality tools, resources, and knowledge to grow, build, and succeed in an increasingly digital world.",
      },
      {
        heading: "Our Mission",
        body: "Our mission is to make premium digital products accessible to everyone while empowering creators to build sustainable income streams. We believe that great digital tools should be discoverable, trustworthy, and easy to purchase — and that creators deserve a professional platform that respects their work and pays them fairly.",
      },
      {
        heading: "What We Offer",
        body: [
          "For Buyers: Browse a curated marketplace of high-quality digital products across categories including AI prompt packs, design templates, eBooks, courses, presets & LUTs, fonts, graphics, planners, and more. Every product goes through a manual review process before delivery, ensuring you always receive what you paid for.",
          "For Creators: Build your own branded storefront, list unlimited products, and reach a growing audience of motivated buyers. Brixnode handles order management, payment verification, and product delivery — so you can focus on creating.",
          "For Agents: Join the Brixnode Agent programme to earn commissions by promoting products and growing your network within the marketplace.",
        ],
      },
      {
        heading: "Why Brixnode?",
        body: [
          "🔒 Verified Payments — Every order is manually verified before product access is released, protecting both buyers and creators.",
          "🎨 Beautiful Storefronts — Creators get a fully customisable, professional storefront with their own URL.",
          "⚡ Instant Post-Approval Delivery — Once a payment is approved, buyers receive their unique access link immediately.",
          "🤖 AI-Powered Discovery — Our built-in AI assistant helps buyers find exactly the right products for their needs.",
          "📊 Creator Analytics — Track your sales, views, and earnings with a clean, intuitive dashboard.",
          "🌍 Global Reach — Brixnode supports creators and buyers from around the world with flexible payment methods.",
        ],
      },
      {
        heading: "Our Values",
        body: [
          "Integrity: We operate transparently. Every transaction, every payout, and every policy is designed to be fair and clear.",
          "Creator-First: We believe creators deserve recognition and fair compensation. Our commission structure and payout system are built with creators in mind.",
          "Quality Over Quantity: We prioritise a curated, trustworthy marketplace over a flooded, low-quality one.",
          "Innovation: We continuously improve our platform using the latest in AI, web technology, and user feedback.",
        ],
      },
      {
        heading: "Our Story",
        body: `Brixnode was founded with a simple frustration: finding reliable, high-quality digital products online was too hard, and selling them was even harder. Existing platforms were crowded, impersonal, and slow to pay creators. We built Brixnode from scratch to solve that — a clean, fast, creator-owned marketplace where trust is built into every transaction. Since launch, we've supported hundreds of creators and served thousands of buyers across the globe. We're just getting started.`,
      },
      {
        heading: "Contact & Support",
        body: [
          "General Enquiries: support@brixnode.com",
          "Creator Support: support@brixnode.com (subject: Creator Support)",
          "DMCA & Legal: support@brixnode.com (subject: DMCA Notice)",
          "We aim to respond to all messages within 24 hours on business days.",
        ],
      },
    ],
  },

  contact: {
    title: "Contact Us",
    subtitle: "We're here to help. Reach out and we'll get back to you promptly.",
    sections: [
      {
        heading: "General Support",
        body: [
          "Email: support@brixnode.com",
          "Response time: Within 24 hours (business days)",
          "For fastest support, include your order ID or username in your message.",
        ],
      },
      {
        heading: "Creator & Partnership Enquiries",
        body: [
          "Interested in partnering with Brixnode, becoming a featured creator, or discussing a collaboration?",
          "Email: support@brixnode.com with subject line: Partnership Enquiry",
        ],
      },
      {
        heading: "Payment & Order Issues",
        body: "If your order is stuck in pending, you believe your payment was approved but you haven't received access, or you need help with your payout — contact us at support@brixnode.com with your order reference and payment proof for fastest resolution.",
      },
      {
        heading: "DMCA & Legal",
        body: "To submit a copyright infringement notice or legal enquiry, email support@brixnode.com with subject: DMCA Notice or Legal Enquiry. See our DMCA & Refund Policy for full instructions.",
      },
      {
        heading: "Bug Reports & Feedback",
        body: "Found a bug or have a suggestion to improve Brixnode? We love hearing from our users. Email support@brixnode.com with subject: Bug Report or Feedback. Your input directly shapes the future of the Platform.",
      },
    ],
  },
};

/* ─── Section renderer ───────────────────────────────────────────────── */
function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="border-b border-slate-100 pb-6 last:border-0 dark:border-slate-800">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
        {section.heading}
      </h2>
      {Array.isArray(section.body) ? (
        <ul className="space-y-2">
          {section.body.map((line, i) => (
            <li key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {section.body}
        </p>
      )}
    </section>
  );
}

/* ─── Main export ────────────────────────────────────────────────────── */
export default function StaticPage({ slug }: { slug: string }) {
  const page = PAGES[slug];

  /* Update document title for Google indexing */
  useEffect(() => {
    if (page) {
      document.title = `${page.title} — Brixnode`;
    }
  }, [page]);

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl animate-fade py-16 text-center">
        <p className="text-4xl">📄</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h1>
        <p className="mt-2 text-slate-500">This page doesn't exist yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <article
      className="mx-auto max-w-2xl animate-fade"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      {/* Hero header */}
      <header className="mb-8">
        <h1
          itemProp="name"
          className="text-3xl font-extrabold leading-tight text-slate-900 dark:text-white"
        >
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            {page.subtitle}
          </p>
        )}
        {page.lastUpdated && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <span>📅</span> Last updated: {page.lastUpdated}
          </p>
        )}
      </header>

      {/* Content card */}
      <div
        itemProp="text"
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {page.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </div>

      {/* Footer note */}
      <footer className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
        © {YEAR} Brixnode. All rights reserved. &nbsp;·&nbsp; support@brixnode.com
      </footer>
    </article>
  );
}
