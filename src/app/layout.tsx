import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Space_Grotesk } from "next/font/google";
import { AppBrandBanner } from "@/components/app-brand-banner";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = IBM_Plex_Sans_Condensed({
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoSearch",
  description: "Auction vehicle search, lot details, watchlist, and bid planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>
        <div className="min-h-screen">
          <AppBrandBanner />
          {children}
        </div>
      </body>
    </html>
  );
}
