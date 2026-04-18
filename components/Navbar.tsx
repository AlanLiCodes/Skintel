"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, User, MessageCircle, Package, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/ingredients", label: "Ingredients", icon: FlaskConical },
  { href: "/products", label: "Products", icon: Package },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const profile = useAppStore((s) => s.profile);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900 tracking-tight">
            <div className="w-7 h-7 bg-stone-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">SK</span>
            </div>
            <span>Skintel</span>
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
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
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
                className="hidden sm:flex items-center gap-1.5 bg-stone-900 text-white px-3.5 py-1.5 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                <Sparkles size={13} />
                View Analysis
              </Link>
            ) : (
              <Link
                href="/profile/new"
                className="hidden sm:flex items-center gap-1.5 bg-stone-900 text-white px-3.5 py-1.5 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Get Started
              </Link>
            )}

            {/* Mobile menu indicator */}
            <div className="md:hidden flex items-center gap-1">
              {NAV_LINKS.map(({ href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    pathname === href ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-700"
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
