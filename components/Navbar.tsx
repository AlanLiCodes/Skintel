"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, User, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/products", label: "Products", icon: Package },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const profile = useAppStore((s) => s.profile);

  return (
    <nav className="sticky top-0 z-50 bg-brand-50/90 backdrop-blur-md border-b border-brand-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/skintel-logo.png"
              alt="Skintel"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname?.startsWith(href + "/")
                    ? "bg-brand-100 text-brand-900"
                    : "text-brand-500 hover:text-brand-900 hover:bg-brand-50"
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {profile ? (
              <Link
                href="/analyze"
                className="hidden sm:flex items-center gap-1.5 bg-brand-500 text-white px-3.5 py-1.5 rounded-md text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                <Sparkles size={13} />
                View Analysis
              </Link>
            ) : (
              <Link
                href="/profile/new"
                className="hidden sm:flex items-center gap-1.5 bg-brand-500 text-white px-3.5 py-1.5 rounded-md text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Get Started
              </Link>
            )}

            {/* Mobile nav icons */}
            <div className="md:hidden flex items-center gap-1">
              {NAV_LINKS.map(({ href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    pathname === href ? "bg-brand-100 text-brand-900" : "text-brand-400 hover:text-brand-700"
                  )}
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
