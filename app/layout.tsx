import type { Metadata } from "next";
import { Gothic_A1 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";

const gothicA1 = Gothic_A1({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-gothic-a1",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skintel — AI-Powered Skincare Intelligence",
  description:
    "Personalized skincare analysis powered by AI. Discover the right ingredients and products for your skin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={gothicA1.variable}>
      <body className="min-h-screen bg-brand-50 text-brand-900">
        <Navbar />
        <main>{children}</main>
        <ChatWidget />
      </body>
    </html>
  );
}
