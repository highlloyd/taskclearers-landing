export const runtime = 'edge';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskClearers | Hire Top 1% Pre-Trained Remote Talent",
  description: "Stop interviewing. Start delegating. TaskClearers provides vetted, pre-trained remote workers ready to join your team in 3-5 days. Risk-free trial.",
  keywords: ["remote workers", "virtual assistants", "hire remote talent", "pre-trained staff", "executive assistants", "customer support outsourcing"],
  authors: [{ name: "TaskClearers" }],
  openGraph: {
    title: "TaskClearers | Hire Top 1% Pre-Trained Remote Talent",
    description: "Vetted professionals ready to integrate instantly. Focus on growth, not hiring. Get matched with an expert in 24 hours.",
    url: "https://TaskClearers.com",
    siteName: "TaskClearers",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://TaskClearers.com/og-image.jpg", // Ideally this should be a real image path if available, or a placeholder
        width: 1200,
        height: 630,
        alt: "TaskClearers - Pre-Trained Remote Workers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskClearers | Hire Top 1% Pre-Trained Remote Talent",
    description: "Stop interviewing. Start delegating. TaskClearers provides vetted, pre-trained remote workers ready to join your team.",
    images: ["https://TaskClearers.com/twitter-image.jpg"], // Placeholder
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
  icons: {
    icon: '/icon.svg',
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
    "name": "TaskClearers",
    "url": "https://TaskClearers.com",
    "logo": "https://TaskClearers.com/logo.png",
    "description": "Hire Top 1% Pre-Trained Remote Talent. Vetted professionals ready to integrate instantly.",
    "sameAs": [
      "https://twitter.com/TaskClearers",
      "https://linkedin.com/company/TaskClearers"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@TaskClearers.com"
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