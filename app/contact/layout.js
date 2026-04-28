export const metadata = {
  title: "Contact Us",
  description: "Get in touch with SFXFolder.com. Have questions about our free sound effects, music, or resources? Contact our support team today.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sfxfolder.com'}/contact`,
  },
};

export default function ContactLayout({ children }) {
  return children;
}
