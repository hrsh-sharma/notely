import React, { useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown, Cloud } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "../../stores/profileStore";

interface ProfileDropdownProps {
  user: SupabaseUser;
  profile: UserProfile | null;
  onSignOut: () => void;
  onOpenProfile: () => void;
}

export default function ProfileDropdown({
  user,
  profile,
  onSignOut,
  onOpenProfile,
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
        className="flex items-center gap-2.5 bg-white/90 border border-stone-200 rounded-2xl px-3 py-1.5 shadow-sm hover:shadow-md hover:bg-white transition-all group"
      >
        <div
          className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
        >
          {avatarLetter}
        </div>
        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-[12px] font-semibold text-stone-800 leading-tight max-w-[120px] truncate">{displayName}</span>
          <span className="text-[10px] text-emerald-600 font-medium leading-none flex items-center gap-1 mt-0.5">
            <Cloud size={9} /> Cloud Synced
          </span>
        </div>
        <ChevronDown size={13} className={`text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 bg-[#FEFDF9] rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden z-50 animate-pop-in p-1.5"
          style={{ transformOrigin: "top right" }}
        >
          {/* Header user info */}
          <div className="px-3 py-2.5 flex items-center gap-3 border-b border-stone-100">
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #E85D26, #f59e0b)" }}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 truncate leading-snug">{displayName}</p>
              <p className="text-[11px] text-stone-400 truncate leading-snug">{email}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="pt-1 pb-0.5 space-y-0.5">
            <button
              id="profile-menu-profile"
              onClick={() => { onOpenProfile(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors text-left group"
            >
              <User size={15} className="text-stone-400 group-hover:text-stone-700 transition-colors" />
              <span>Profile</span>
            </button>

            <div className="my-1 border-t border-stone-100" />

            <button
              id="profile-menu-signout"
              onClick={() => { onSignOut(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors text-left group"
            >
              <LogOut size={15} className="text-stone-400 group-hover:text-red-500 transition-colors" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
