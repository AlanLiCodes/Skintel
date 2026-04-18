"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import {
  User, Sparkles, FlaskConical, MessageCircle, Edit, Trash2,
  ScanFace, AlertCircle
} from "lucide-react";
import { AGE_RANGE_LABELS, SKIN_CONCERN_LABELS, PRODUCT_CATEGORY_LABELS } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import SkinScanner from "@/components/SkinScanner";

export default function ProfileViewPage() {
  const profile = useAppStore((s) => s.profile);
  const clearProfile = useAppStore((s) => s.clearProfile);
  const router = useRouter();

  const handleDelete = () => {
    if (confirm("Delete your profile and all analysis data?")) {
      clearProfile();
      router.push("/");
    }
  };

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={20} className="text-stone-400" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">No profile yet</h1>
        <p className="text-stone-500 text-sm mb-6">Create your skin profile to get personalized ingredient and product recommendations.</p>
        <Link
          href="/profile/new"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          Build my skin profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Your profile</h1>
          <p className="text-stone-500 text-sm mt-1">Last updated {formatDate(profile.updatedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profile/new"
            className="inline-flex items-center gap-1.5 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm hover:bg-stone-50 transition-colors"
          >
            <Edit size={13} />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      {/* Profile details */}
      <div className="space-y-4 mb-8">
        {/* Basics */}
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Basics</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Age range</div>
              <div className="text-sm font-medium text-stone-900">{AGE_RANGE_LABELS[profile.ageRange]}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Skin type</div>
              <div className="text-sm font-medium text-stone-900 capitalize">{profile.skinType}</div>
            </div>
            {profile.location && (
              <div>
                <div className="text-xs text-stone-400 mb-0.5">ZIP code</div>
                <div className="text-sm font-medium text-stone-900">{profile.location}</div>
              </div>
            )}
          </div>
        </div>

        {/* Concerns */}
        <div className="border border-stone-200 rounded-xl p-4 bg-white">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Skin concerns ({profile.concerns.length})</div>
          {profile.concerns.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.concerns.map((c) => (
                <span key={c} className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">{SKIN_CONCERN_LABELS[c]}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400">No concerns selected.</p>
          )}
        </div>

        {/* Current products */}
        {profile.currentProducts.length > 0 && (
          <div className="border border-stone-200 rounded-xl p-4 bg-white">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Current routine</div>
            <div className="space-y-1.5">
              {profile.currentProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-900 font-medium">{p.name}</span>
                  <span className="text-xs text-stone-400">{PRODUCT_CATEGORY_LABELS[p.category]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {profile.allergies.length > 0 && (
          <div className="border border-stone-200 rounded-xl p-4 bg-white">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Allergies & sensitivities</div>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a) => (
                <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle size={10} />
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prescription note */}
        {profile.prescriptionNote && (
          <div className="border border-stone-200 rounded-xl p-4 bg-white">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Dermatologist note</div>
            <p className="text-sm text-stone-700 leading-relaxed">{profile.prescriptionNote}</p>
          </div>
        )}

        {/* Goals */}
        {profile.goals && (
          <div className="border border-stone-200 rounded-xl p-4 bg-white">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Goals</div>
            <p className="text-sm text-stone-700 leading-relaxed">{profile.goals}</p>
          </div>
        )}
      </div>

      {/* Skin scanner */}
      <div className="mb-8">
        <SkinScanner />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/analyze"
          className="flex items-center gap-2 border border-stone-200 rounded-xl p-4 hover:bg-stone-50 transition-colors"
        >
          <Sparkles size={15} className="text-stone-500" />
          <div>
            <div className="text-sm font-medium text-stone-900">View analysis</div>
            <div className="text-xs text-stone-400">Ingredients & routine</div>
          </div>
        </Link>
        <Link
          href="/chat"
          className="flex items-center gap-2 border border-stone-200 rounded-xl p-4 hover:bg-stone-50 transition-colors"
        >
          <MessageCircle size={15} className="text-stone-500" />
          <div>
            <div className="text-sm font-medium text-stone-900">Ask AI advisor</div>
            <div className="text-xs text-stone-400">Personalized chat</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
