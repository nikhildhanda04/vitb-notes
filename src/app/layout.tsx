import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Plus_Jakarta_Sans, Inter, Poppins } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Vitb Notes - AI Powered Notes",
    template: "%s | Vitb Notes",
  },
  description: "Access comprehensive study notes from your syllabus and course materials using AI. Tailored for VIT Bhopal students.",
  keywords: ["VIT Bhopal", "Notes", "AI Notes", "Study Material", "Engineering", "Syllabus", "Exam Prep"],
  authors: [{ name: "Nikhil Dhanda" }],
  creator: "Nikhil Dhanda",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vitb-notes.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Vitb Notes - AI Powered Notes",
    description: "Access comprehensive study notes from your syllabus and course materials using AI. Tailored for VIT Bhopal students.",
    siteName: "Vitb Notes",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitb Notes - AI Powered Notes",
    description: "Access comprehensive study notes from your syllabus and course materials using AI. Tailored for VIT Bhopal students.",
    creator: "@nikhildhanda",
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
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} ${poppins.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
