import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
    <html lang="en">
      <body className="min-h-screen bg-[#fafaf9] text-stone-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
