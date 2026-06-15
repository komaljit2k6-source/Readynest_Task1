'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FileText, ArrowRight, Layout, Share2, BarChart3, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white min-h-screen">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-2 rounded-lg text-white">
            <FileText size={24} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            FormForge
          </span>
        </div>
        <div>
          {loading ? (
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          Build <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Dynamic Forms</span> <br />
          In Seconds, Collect Real-time Data
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Create customized forms with a robust builder, publish instantly, share with a simple link, and watch responses flow in with real-time analytics.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg shadow-xl shadow-indigo-500/10 transition text-base"
          >
            <span>Start Building for Free</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-lg border border-slate-700 transition text-base"
          >
            Explore Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl inline-block mb-5">
              <Layout size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Dynamic Form Builder</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Add fields (text, numbers, emails, multiple choice, select dropdowns) with a few clicks. Set custom layouts and styling easily.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl inline-block mb-5">
              <Share2 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Form Sharing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate a unique shareable public link for your form instantly. Send it to anyone on social media, email, or chat.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl inline-block mb-5">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track view counts, total submissions, conversion rates, and view chart summaries for choice questions automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/85 text-center py-8 text-slate-500 text-sm">
        <p>© 2026 FormForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
