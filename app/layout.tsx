import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://line-pointer.vercel.app'),
  title: {
    default: "LinePointer - Sharp Lines. Smart Bets.",
    template: "%s | LinePointer",
  },
  description: "Advanced AI-powered sports predictions for NFL, NCAAF, NBA, and MLB. Get 72-75% accurate betting insights, parlay recommendations, and professional-grade analytics. Sharp Lines. Smart Bets.",
  keywords: [
    "sports betting predictions",
    "NFL predictions",
    "NCAAF predictions",
    "NBA predictions",
    "MLB predictions",
    "AI sports betting",
    "parlay builder",
    "sports analytics",
    "betting odds",
    "line movement",
    "player props",
    "value betting",
    "sports data",
    "machine learning predictions",
    "LinePointer",
  ],
  authors: [{ name: "LinePointer" }],
  creator: "LinePointer",
  publisher: "LinePointer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LinePointer - Sharp Lines. Smart Bets.",
    description: "Advanced AI-powered sports predictions with 72-75% accuracy. NFL, NCAAF, NBA, MLB analytics with real-time odds and value indicators.",
    url: "https://line-pointer.vercel.app",
    siteName: "LinePointer",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinePointer - Sharp Lines. Smart Bets.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinePointer - Sharp Lines. Smart Bets.",
    description: "Advanced AI-powered sports predictions with 72-75% accuracy. NFL, NCAAF, NBA, MLB analytics.",
    images: ["/og-image.png"],
    creator: "@linepointer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'sports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

