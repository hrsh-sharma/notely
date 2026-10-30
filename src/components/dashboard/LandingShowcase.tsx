import React, { useState } from 'react';
import {
  BookOpen, Sparkles, Cloud, ShieldCheck, Download, Search,
  PenTool, CheckCircle2, ArrowRight, Layers, FileText, LogIn,
  Grid, CircleDot, Eye, Bookmark
} from 'lucide-react';

interface LandingShowcaseProps {
  onSignIn: () => void;
}

export default function LandingShowcase({ onSignIn }: LandingShowcaseProps) {
  const [activePaper, setActivePaper] = useState<'ruled' | 'grid' | 'dotted' | 'plain'>('ruled');
  const [activeFont, setActiveFont] = useState<'handwriting' | 'editorial'>('handwriting');

  // Background style computation for mockup
  const getPaperBackground = () => {
    switch (activePaper) {
      case 'grid':
        return {
          backgroundImage: 'linear-gradient(to right, rgba(190, 205, 225, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(190, 205, 225, 0.6) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      case 'dotted':
        return {
          backgroundImage: 'radial-gradient(rgba(160, 180, 210, 0.8) 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        };
      case 'plain':
        return {
          backgroundImage: 'none',
        };
      case 'ruled':
      default:
        return {
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #D2DEEB 27px, #D2DEEB 28px)',
          backgroundPosition: '0 45px',
        };
    }
  };

  return (
    <div className="w-full pb-24 animate-fade-in text-stone-900">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-8 pb-16 text-center max-w-4xl mx-auto px-4">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-glow" />

        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 text-xs font-semibold mb-6 shadow-sm hover:scale-105 transition-transform cursor-default">
          <Sparkles size={14} className="text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="tracking-wide">Realistic Virtual Stationery • Built For Thinkers</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-6">
          Write in a Real Notebook.
          <br />
          <span className="font-editorial italic font-normal text-amber-800 drop-shadow-xs">
            Without the Paper Limits.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed mb-9">
          Experience the tactile focus of physical ruled pages, margin lines, and cloth bindings — paired with instant Supabase cloud synchronization, full-text search, and infinite pages.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-200 font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
          >
            <LogIn size={18} />
            <span>Open Your Notebook Library</span>
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
          <a
            href="#interactive-demo"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/90 hover:bg-white text-stone-700 font-semibold text-sm border border-stone-200/90 shadow-sm hover:shadow-md transition-all text-center hover:-translate-y-0.5"
          >
            Try Live Paper Demo
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Supabase Cloud Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Zero-Distraction Writing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Offline Local-First Storage</span>
          </div>
        </div>
      </section>

      {/* ─── Interactive Virtual Notebook Mockup Preview ─── */}
      <section id="interactive-demo" className="max-w-5xl mx-auto px-4 mb-28">
        {/* Interactive Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-stone-200 shadow-sm">
          {/* Paper Style Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-2">Paper:</span>
            <button
              onClick={() => setActivePaper('ruled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePaper === 'ruled' ? 'bg-stone-900 text-amber-200 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FileText size={13} />
              <span>Ruled</span>
            </button>
            <button
              onClick={() => setActivePaper('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePaper === 'grid' ? 'bg-stone-900 text-amber-200 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Grid size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setActivePaper('dotted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePaper === 'dotted' ? 'bg-stone-900 text-amber-200 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <CircleDot size={13} />
              <span>Dotted</span>
            </button>
            <button
              onClick={() => setActivePaper('plain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePaper === 'plain' ? 'bg-stone-900 text-amber-200 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>Plain</span>
            </button>
          </div>

          {/* Typography Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-2">Font:</span>
            <button
              onClick={() => setActiveFont('handwriting')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFont === 'handwriting' ? 'bg-amber-900 text-amber-100 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Handwriting
            </button>
            <button
              onClick={() => setActiveFont('editorial')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFont === 'editorial' ? 'bg-amber-900 text-amber-100 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Editorial Serif
            </button>
          </div>
        </div>

        {/* Notebook Outer Casing with Depth */}
        <div className="relative rounded-3xl p-3 sm:p-7 bg-gradient-to-b from-stone-200/70 via-stone-100/50 to-stone-300/60 border border-stone-300/80 shadow-2xl overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-amber-200/20 rounded-full blur-3xl pointer-events-none animate-glow" />

          {/* Decorative Floating Badges */}
          <div className="absolute top-9 left-9 hidden lg:flex items-center gap-2 bg-stone-900/90 text-amber-200 px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md z-30 animate-float border border-stone-700/50">
            <PenTool size={14} className="text-amber-400" />
            <span>Authentic Red/Pink Margin & Line Alignment</span>
          </div>

          <div className="absolute bottom-9 right-9 hidden lg:flex items-center gap-2 bg-stone-900/90 text-amber-200 px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md z-30 animate-float-reverse border border-stone-700/50">
            <Cloud size={14} className="text-emerald-400" />
            <span>Instant Auto-Save & Cloud Persistence</span>
          </div>

          {/* Two-Page Notebook Spread Body */}
          <div className="relative bg-[#FEFCF7] rounded-2xl shadow-2xl border border-stone-300/90 overflow-hidden flex flex-col md:flex-row min-h-[420px] sm:min-h-[480px] transition-all">
            {/* Center Book Spine Shadow & Binding Seam */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r from-stone-400/25 via-stone-500/35 to-stone-400/25 pointer-events-none z-20 hidden md:block" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-stone-400/50 z-20 hidden md:block" />

            {/* Red Silk Ribbon Bookmark Hanging from center top */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-36 bg-gradient-to-b from-red-700 via-rose-600 to-red-800 shadow-md rounded-b-sm z-25 pointer-events-none hidden md:block transform rotate-1" />

            {/* Left Page */}
            <div
              className="flex-1 p-6 sm:p-10 relative border-b md:border-b-0 md:border-r border-stone-200/80 transition-all duration-300"
              style={getPaperBackground()}
            >
              {/* Pink vertical margin line */}
              {activePaper === 'ruled' && (
                <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-px bg-rose-400/75 z-10" />
              )}
              <div className="absolute top-3.5 right-6 text-[10px] text-stone-400 font-mono tracking-widest font-semibold">
                VOL. 1 • PAGE 01
              </div>

              <div className="pl-8 sm:pl-11 pt-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                  Personal Journal & Notes
                </span>
                <h3 className={`text-xl sm:text-2xl font-bold text-stone-900 leading-snug mb-4 ${
                  activeFont === 'handwriting' ? 'font-kalam text-2xl sm:text-3xl' : 'font-editorial'
                }`}>
                  The Joy of Tangible Thought
                </h3>
                <p className={`text-xs sm:text-sm text-stone-800 leading-[28px] ${
                  activeFont === 'handwriting' ? 'font-kalam text-base sm:text-lg text-stone-900' : 'font-sans'
                }`}>
                  When you write on ruled paper, your brain slows down just enough to clarify what truly matters. Digital documents are designed for office bureaucracy — notebooks are designed for human contemplation.
                </p>
                <p className={`text-xs sm:text-sm text-stone-800 leading-[28px] mt-2 ${
                  activeFont === 'handwriting' ? 'font-kalam text-base sm:text-lg text-stone-900' : 'font-sans'
                }`}>
                  Here, you get the calm of physical copybooks without ever running out of paper, losing notes, or carrying a heavy backpack.
                </p>
              </div>
            </div>

            {/* Right Page */}
            <div
              className="flex-1 p-6 sm:p-10 relative bg-[#FEFCF7] transition-all duration-300"
              style={getPaperBackground()}
            >
              {/* Pink vertical margin line */}
              {activePaper === 'ruled' && (
                <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-px bg-rose-400/75 z-10" />
              )}
              <div className="absolute top-3.5 right-6 text-[10px] text-stone-400 font-mono tracking-widest font-semibold">
                PAGE 02 • CORE PRINCIPLES
              </div>

              <div className="pl-8 sm:pl-11 pt-4">
                <h4 className={`text-base sm:text-lg font-bold text-stone-900 mb-3 ${
                  activeFont === 'handwriting' ? 'font-kalam text-xl sm:text-2xl' : 'font-editorial'
                }`}>
                  Everything You Love About Notebooks:
                </h4>
                <ul className={`text-xs sm:text-sm text-stone-800 leading-[28px] space-y-1 list-disc pl-4 ${
                  activeFont === 'handwriting' ? 'font-kalam text-base sm:text-lg' : 'font-sans'
                }`}>
                  <li><strong>Tactile Page Spreads:</strong> Open book viewing that feels natural.</li>
                  <li><strong>4 Paper Textures:</strong> Ruled, engineer grid, dotted, or blank.</li>
                  <li><strong>TipTap Inks & Highlighters:</strong> Highlight, color, and format.</li>
                  <li><strong>Full-Text Search:</strong> Search through hundreds of handwritten notes.</li>
                  <li><strong>Instant PDF Export:</strong> Turn spreads into printable books.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why It's Useful Section ─── */}
      <section className="max-w-6xl mx-auto px-6 mb-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3.5 py-1 rounded-full bg-stone-200/80 text-stone-800 text-xs font-bold uppercase tracking-wider mb-3">
            Why A Digital Notebook?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-4">
            The Intimacy of Paper, The Superpowers of Cloud
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Designed specifically for anyone who feels drained by cold corporate editors and misses the natural flow of writing in a real notebook.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {/* Pillar 1 */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <PenTool size={26} />
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2.5">
                Psychological Focus
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Word processors distract you with complex document settings, tables, and corporate bloat. Writing on ruled pages triggers deep focus, natural memory retention, and creative flow.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span>Stimulates organic thought flow</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Cloud size={26} />
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2.5">
                Never Lost or Damaged
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Physical notebooks can be lost, spilled on, or left at your desk. Your virtual copy travels with you anywhere in the world and persists securely with your private Supabase account.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span>Always accessible on all devices</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Search size={26} />
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2.5">
                Instant Search & Infinite Leaves
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Never run out of pages midway through a project. Add infinite pages, reorganize chapters with drag-and-drop, and search across thousands of words in a fraction of a second.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <span>No more manual flipping through pages</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="max-w-6xl mx-auto px-6 mb-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3.5 py-1 rounded-full bg-stone-200/80 text-stone-800 text-xs font-bold uppercase tracking-wider mb-3">
            Features & Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-4">
            Authentic Stationery Details
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Every element is tailored to look and feel like physical paper, from the cloth spine to the ink highlighters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">4 Paper Styles</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Standard ruled lines, engineering graph paper, dot grid bullet journaling, and blank artist sketch sheets.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">Two-Page Book Spread</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              True dual-page open book layout with center binding seam, gutter depth shadows, and single page mobile mode.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <PenTool size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">Handwriting & Rich Text</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Custom font families including Kalam handwriting, ink colors, highlighter pens, and flexible typographic scaling.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Download size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">High-Res PDF Export</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Export full notebooks or individual spreads into high-resolution printable PDFs ready to archive or share.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">Stationery Cover Plates</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cloth spine tape, authentic cardstock label plates, Classmate orange, and leather bound cover palettes.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-stone-900 text-base">Secure Supabase Auth</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Row-Level Security ensures your private journals, thoughts, and writings remain completely private to you.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Bottom Final CTA Card ─── */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-stone-100 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden border border-stone-700/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-glow" />
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-200/15 text-amber-300 flex items-center justify-center mx-auto mb-5 border border-amber-300/30 shadow-inner">
              <BookOpen size={28} />
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Open Your First Notebook Today
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mb-8 leading-relaxed">
              Create a free account in seconds or sign in to start writing in your personal virtual copybooks.
            </p>
            <button
              onClick={onSignIn}
              className="px-9 py-4 rounded-2xl bg-amber-200 hover:bg-amber-100 text-stone-900 font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 mx-auto hover:-translate-y-1 active:translate-y-0"
            >
              <LogIn size={18} />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
