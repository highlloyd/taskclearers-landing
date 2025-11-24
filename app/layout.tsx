import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Taskclearers | Hire Top 1% Pre-Trained Remote Talent",
  description: "Stop interviewing. Start delegating. Taskclearers provides vetted, pre-trained remote workers ready to join your team in 3-5 days. Risk-free trial.",
  keywords: ["remote workers", "virtual assistants", "hire remote talent", "pre-trained staff", "executive assistants", "customer support outsourcing"],
  authors: [{ name: "Taskclearers" }],
  openGraph: {
    title: "Taskclearers | Hire Top 1% Pre-Trained Remote Talent",
    description: "Vetted professionals ready to integrate instantly. Focus on growth, not hiring. Get matched with an expert in 24 hours.",
    url: "https://taskclearers.com",
    siteName: "Taskclearers",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://taskclearers.com/og-image.jpg", // Ideally this should be a real image path if available, or a placeholder
        width: 1200,
        height: 630,
        alt: "Taskclearers - Pre-Trained Remote Workers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taskclearers | Hire Top 1% Pre-Trained Remote Talent",
    description: "Stop interviewing. Start delegating. Taskclearers provides vetted, pre-trained remote workers ready to join your team.",
    images: ["https://taskclearers.com/twitter-image.jpg"], // Placeholder
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Taskclearers",
    "url": "https://taskclearers.com",
    "logo": "https://taskclearers.com/logo.png",
    "description": "Hire Top 1% Pre-Trained Remote Talent. Vetted professionals ready to integrate instantly.",
    "sameAs": [
      "https://twitter.com/taskclearers",
      "https://linkedin.com/company/taskclearers"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@taskclearers.com"
    }
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}