import { motion } from 'framer-motion';
import { Rocket, Sparkles, Shield, Zap } from 'lucide-react';

export default function ReleaseNotes() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Rocket size={48} className="mx-auto text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Release Notes</h1>
          <p className="text-lg text-neutral-500">Discover what's new in OmnibusAI.</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 md:p-12">
          <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-6">
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold tracking-widest uppercase">Version 1.0.0</span>
            <span className="text-neutral-500 text-sm font-medium">July 2026</span>
          </div>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <Sparkles className="text-purple-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">File Intelligence (RAG)</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">Upload PDFs, CSVs, and text documents. The AI instantly reads, vectorizes, and allows you to chat directly with your files to extract deep insights.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Zap className="text-orange-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Code Copilot & Artifact Canvas</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">A built-in Monaco editor that supports generating, editing, and copying code natively inside the workspace via the new slide-out artifact canvas.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Enterprise Security</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">Implemented Time-Based One-Time Passwords (TOTP) for 2FA, secure Cloudinary integrations, and hard-deleted relational data scrubbing.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}