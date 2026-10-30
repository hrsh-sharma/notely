import React, { useState, useEffect } from "react";
import { X, User, Mail, Calendar, Save, Loader2, CheckCircle2, Shield, Copy, Check } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useProfileStore } from "../../stores/profileStore";
import notelyLogo from "../../assets/Notely.png";

interface ProfileModalProps {
  user: SupabaseUser;
  onClose: () => void;
  mode?: "profile" | "settings";
}

export default function ProfileModal({ user, onClose, mode = "profile" }: ProfileModalProps) {
  const { profile, updateProfile } = useProfileStore();
  const [tab, setTab] = useState<"profile" | "settings">(mode);
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => { setTab(mode); }, [mode]);

  useEffect(() => {
    setFullName(profile?.full_name || user.user_metadata?.full_name || "");
    setSaveSuccess(false);
    setSaveError("");
  }, [profile, user]);

  const handleSave = async () => {
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

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarLetter = displayName[0].toUpperCase();
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden border border-stone-100 animate-pop-in"
        style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a00 50%, #1a1a1a 100%)" }}>
          {/* Subtle grain texture overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #E85D26 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 50%)" }} />

          {/* Close button */}
          <button
            id="profile-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          {/* Notely brand watermark top left */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-40">
            <img src={notelyLogo} alt="Notely" className="w-5 h-5 object-contain" />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Notely</span>
          </div>

          {/* Avatar + Name */}
          <div className="flex flex-col items-center pb-10 pt-12 px-6 relative z-10">
            {/* Avatar ring */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-2xl ring-4 ring-white/10"
                style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}>
                {avatarLetter}
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-stone-900 rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full" />
              </span>
            </div>
            <h2 className="text-white font-bold text-xl leading-tight tracking-tight">{displayName}</h2>
            <p className="text-white/40 text-xs mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex -mt-5 mx-5 rounded-2xl overflow-hidden shadow-lg border border-stone-200/60 bg-white relative z-10">
          {(["profile", "settings"] as const).map((t) => (
            <button
              key={t}
              id={`profile-tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 ${
                tab === t
                  ? "text-white shadow-inner"
                  : "text-stone-400 hover:text-stone-700 bg-white"
              }`}
              style={tab === t ? { background: "linear-gradient(135deg, #E85D26, #f59e0b)" } : {}}
            >
              {t === "profile" ? "My Profile" : "Account Settings"}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="px-5 py-5 max-h-[55vh] overflow-y-auto">

          {/* ─ PROFILE TAB ─ */}
          {tab === "profile" && (
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">
                  Display Name
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
                  <input
                    id="profile-full-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="w-full pl-9 pr-4 py-3 text-sm rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium text-stone-800"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
                  <input
                    type="text"
                    value={user.email || ""}
                    readOnly
                    className="w-full pl-9 pr-4 py-3 text-sm rounded-2xl border border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 ml-1">Managed by your auth provider.</p>
              </div>

              {/* Member Since pill */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-stone-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}>
                  <Calendar size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-xs font-semibold text-stone-700">{joinedDate}</p>
                </div>
              </div>

              {/* Feedback */}
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-2xl px-4 py-2.5 border border-red-100">{saveError}</p>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-2xl px-4 py-2.5 border border-emerald-100 font-semibold">
                  <CheckCircle2 size={14} /> Profile updated successfully!
                </div>
              )}

              {/* Save button */}
              <button
                id="profile-save-btn"
                onClick={handleSave}
                disabled={isSaving || !fullName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ─ SETTINGS TAB ─ */}
          {tab === "settings" && (
            <div className="space-y-3">
              {/* Info cards */}
              <div className="rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-100">
                {/* User ID */}
                <div className="px-4 py-3 bg-stone-50/60">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Shield size={9} /> User ID
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-mono text-stone-600 flex-1 break-all leading-relaxed">{user.id}</p>
                    <button
                      onClick={copyId}
                      title="Copy ID"
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="px-4 py-3 bg-stone-50/60">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Account Status</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Active & Verified
                  </span>
                </div>

                {/* Login Method */}
                <div className="px-4 py-3 bg-stone-50/60">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Login Method</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 capitalize">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    {user.app_metadata?.provider || "Email & Password"}
                  </span>
                </div>

                {/* Last Sign In */}
                <div className="px-4 py-3 bg-stone-50/60">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Last Sign In</p>
                  <p className="text-xs font-semibold text-stone-700">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              {/* Privacy note */}
              <div className="rounded-2xl overflow-hidden border border-orange-100">
                <div className="px-4 pt-3 pb-1 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #fff7ed, #fffbeb)" }}>
                  <img src={notelyLogo} alt="Notely" className="w-6 h-6 object-contain flex-shrink-0" />
                  <p className="text-[11px] font-bold text-orange-800">Data & Privacy</p>
                </div>
                <div className="px-4 pb-3 pt-1" style={{ background: "linear-gradient(135deg, #fff7ed, #fffbeb)" }}>
                  <p className="text-[10px] text-orange-700 leading-relaxed">
                    All your notebooks are protected by Supabase Row Level Security. Only you can access your data — not even admins can read it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-4 pt-2 flex items-center justify-center gap-1.5 border-t border-stone-100">
          <img src={notelyLogo} alt="" className="w-4 h-4 object-contain opacity-50" />
          <span className="text-[10px] text-stone-400 font-semibold tracking-widest uppercase">Notely — Your Digital Notebook</span>
        </div>
      </div>
    </div>
  );
}
