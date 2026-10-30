import React, { useEffect, useRef, useState } from "react";
import { User, Settings, LogOut, ChevronDown, Cloud, Shield } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "../../stores/profileStore";
import notelyLogo from "../../assets/Notely.png";

interface ProfileDropdownProps {
  user: SupabaseUser;
  profile: UserProfile | null;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export default function ProfileDropdown({
  user,
  profile,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarLetter = displayName[0].toUpperCase();
  const email = user.email || "";

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        id="profile-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/90 border border-stone-200 rounded-2xl px-2.5 py-1.5 shadow-sm hover:shadow-md hover:bg-white transition-all group"
      >
        <div
          className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-xs shadow flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
        >
          {avatarLetter}
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-[11px] font-bold text-stone-800 leading-tight max-w-[110px] truncate">{displayName}</span>
          <span className="text-[9px] text-emerald-600 font-semibold leading-none flex items-center gap-1">
            <Cloud size={8} /> Cloud Synced
          </span>
        </div>
        <ChevronDown size={12} className={`text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute right-0 mt-2.5 w-72 bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden z-50 animate-pop-in"
          style={{ transformOrigin: "top right", fontFamily: "'Inter', 'Outfit', sans-serif" }}
        >
          {/* Header */}
          <div className="relative overflow-hidden px-4 py-4"
            style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a00 70%, #1a1a1a 100%)" }}>
            {/* glow */}
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #E85D26 0%, transparent 60%)" }} />

            <div className="flex items-center gap-3 relative z-10">
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ring-2 ring-white/10 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
              >
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-white/40 truncate">{email}</p>
              </div>
              {/* Notely logo */}
              <img src={notelyLogo} alt="Notely" className="w-7 h-7 object-contain opacity-60 flex-shrink-0" />
            </div>

            {/* UUID chip */}
            <div className="mt-2.5 flex items-center gap-1.5 relative z-10">
              <Shield size={9} className="text-orange-400" />
              <span className="text-[9px] font-mono text-white/30">{user.id.slice(0, 16)}…</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              id="profile-menu-my-profile"
              onClick={() => { onOpenProfile(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left group/item"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                <User size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800 leading-tight">My Profile</p>
                <p className="text-[10px] text-stone-400 leading-tight">View & edit your details</p>
              </div>
            </button>

            <button
              id="profile-menu-settings"
              onClick={() => { onOpenSettings(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left group/item"
            >
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                <Settings size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800 leading-tight">Account Settings</p>
                <p className="text-[10px] text-stone-400 leading-tight">Manage account preferences</p>
              </div>
            </button>

            <div className="mx-4 my-1 border-t border-stone-100" />

            <button
              id="profile-menu-signout"
              onClick={() => { onSignOut(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group/item"
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                <LogOut size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-red-500 leading-tight">Sign Out</p>
                <p className="text-[10px] text-stone-400 leading-tight">End your current session</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-stone-100 flex items-center justify-center gap-1.5 bg-stone-50/50">
            <img src={notelyLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-40" />
            <span className="text-[9px] text-stone-400 font-bold tracking-widest uppercase">Notely</span>
          </div>
        </div>
      )}
    </div>
  );
}
