import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-5xl font-light text-stone-300 mb-4">404</div>
      <h1 className="text-xl font-semibold text-stone-900 mb-2">Page not found</h1>
      <p className="text-stone-500 text-sm mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to home
      </Link>
    </div>
  );
}
