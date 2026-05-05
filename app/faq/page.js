import React from "react";
import Link from "next/link";
import FAQItem from "./FAQItem";
import styles from "./page.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sfxfolder.com';

export const metadata = {
  title: "Q&A - Frequently Asked Questions | SFXFolder",
  description: "Find answers to common questions about SFXFolder resources, Premiere Pro plugin, commercial usage, and more.",
  keywords: ["SFXFolder FAQ", "Premiere Pro plugin help", "SFX copyright", "video editing assets Q&A", "free sound effects commercial use"],
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: "SFXFolder Q&A - Frequently Asked Questions",
    description: "Got questions about SFXFolder? We have answers. Learn about our assets, maintenance fees, and plugin integration.",
    url: `${SITE_URL}/faq`,
    siteName: "SFXFolder",
    images: [
      {
        url: `${SITE_URL}/og-faq.jpg`,
        width: 1200,
        height: 630,
        alt: "SFXFolder Q&A Support Center",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SFXFolder Q&A - Frequently Asked Questions",
    description: "Find answers to common questions about our high-quality sound effects and editing tools.",
    images: [`${SITE_URL}/og-faq.jpg`],
  },
};

const faqs = [
  {
    question: "Is SFXFolder really free?",
    answer: "To maintain the quality and reliability of our platform, we collect a small maintenance fee. This allows us to cover essential server costs and licensing fees for high-end third-party resources, ensuring SFXFolder remains a sustainable tool for the editing community."
  },
  {
    question: "Can I use these assets for commercial projects?",
    answer: "Absolutely. However, for assets longer than one minute (such as background music tracks), users are responsible for verifying specific copyright status independently. As SFXFolder is a library curated by individual creators and small groups, we cannot guarantee commercial clearance for every extended resource. We recommend reviewing usage rights for long-form content before commercial publication."
  },
  {
    question: "How do I install the Premiere Pro plugin?",
    answer: "You can download the installer from our homepage. Once installed, open Premiere Pro and navigate to Window > Extensions > SFXFolder to start using the plugin directly inside your project."
  },
  {
    question: "When will the DaVinci Resolve and After Effects plugins be available?",
    answer: "Both are currently in active development. We are working hard to bring the SFXFolder experience to these platforms soon. You can track our progress in the 'New Tools' section on our homepage or follow our community updates."
  },
  {
    question: "Can I request specific sound effects or assets?",
    answer: "Absolutely! We value our community's input. Feel free to send your requests through our Contact page, and our team will prioritize adding them to our upcoming library updates."
  },
  {
    question: "How often is the library updated with new resources?",
    answer: "We typically update the SFXFolder library weekly. Our team of curators and creators is constantly sourcing and producing new high-quality assets to ensure your projects always have fresh options."
  },
  {
    question: "How can I contribute my own assets to SFXFolder?",
    answer: "We welcome contributions from talented creators! If you have high-quality resources you'd like to share with the community, please reach out to us. Selected assets will be featured with full credit to you or your creative team."
  },
  {
    question: "What audio formats are supported?",
    answer: "We primarily provide high-quality WAV files (24-bit/48kHz or higher) for maximum fidelity, as well as MP3 versions where appropriate for smaller file sizes."
  },
  {
    question: "Do I need to provide credit when using assets?",
    answer: "While not required, we always appreciate a shout-out or a link back to SFXFolder. It helps us grow and keep providing resources for everyone."
  },
  {
    question: "Is there a download limit?",
    answer: "There are no hard limits on the number of resources you can download. However, we have automated systems to prevent bulk scraping to ensure the platform remains stable for everyone."
  }
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className={styles.hero}>
        <p className={styles.subtitle}>Help Center</p>
        <h1 className={styles.title}>Questions & Answers</h1>
      </header>

      <section className={styles.faqSection}>
        {faqs.map((faq, index) => (
          <FAQItem key={index} faq={faq} />
        ))}
      </section>

      <div className={styles.contactBanner}>
        <h2 className={styles.bannerTitle}>Still have questions?</h2>
        <p>Our team is here to help you with anything you need.</p>
        <Link href="/contact" className={styles.contactBtn}>
          Contact Support
        </Link>
      </div>
    </div>
  );
}
