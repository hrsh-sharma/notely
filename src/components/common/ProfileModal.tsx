import React, { useState, useEffect } from "react";
import { X, User, Mail, Save, Loader2, CheckCircle2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useProfileStore } from "../../stores/profileStore";

interface ProfileModalProps {
  user: SupabaseUser;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const { profile, updateProfile } = useProfileStore();
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name || user.user_metadata?.full_name || "");
    setSaveSuccess(false);
    setSaveError("");
  }, [profile, user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) return;
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const { error } = await updateProfile(user.id, {
      full_name: fullName.trim(),
      avatar_url: profile?.avatar_url ?? null,
    });
    setIsSaving(false);
    if (error) {
      setSaveError(error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarLetter = displayName[0].toUpperCase();
  const email = user.email || "";
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-[#FEFDF9] rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-stone-200/70 bg-gradient-to-b from-stone-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-amber-200 shadow-sm">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Profile</h2>
              <p className="text-xs text-stone-500">Manage your personal details</p>
            </div>
          </div>
          <button
            id="profile-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* User overview snippet */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/70">
            <div
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900 truncate">{displayName}</p>
              <p className="text-xs text-stone-500 truncate">{email}</p>
              {joinedDate && (
                <p className="text-[11px] text-stone-400 mt-0.5">Member since {joinedDate}</p>
              )}
            </div>
          </div>

          {/* Full Name input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="profile-full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300/80 bg-white focus:border-stone-800 focus:ring-2 focus:ring-stone-200 outline-none transition-all text-stone-800 font-medium"
              />
            </div>
          </div>

          {/* Email input (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={email}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-100/60 text-stone-500 cursor-not-allowed font-medium"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Managed through your sign-in account.</p>
          </div>

          {/* Feedback */}
          {saveError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5 border border-red-200">
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-xl px-3.5 py-2.5 border border-emerald-200 font-medium">
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
              Profile updated successfully
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="profile-save-btn"
              type="submit"
              disabled={isSaving || !fullName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-semibold shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
