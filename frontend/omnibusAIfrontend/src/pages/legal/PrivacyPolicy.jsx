import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <ShieldCheck size={48} className="mx-auto text-emerald-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Privacy Policy</h1>
          <p className="text-lg text-neutral-500">How we protect and manage your data.</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 md:p-12 prose dark:prose-invert max-w-none">
          <h3>1. Information We Collect</h3>
          <p>When you register for OmnibusAI, we collect your name, email address, and encrypted password. If you enable Two-Factor Authentication, we securely generate and store a TOTP secret.</p>
          
          <h3>2. AI Data Processing</h3>
          <p>Any prompts, files, or documents you upload are securely vectorized for your personal workspace. We do not use your private documents to train our base AI models. File uploads are securely stored in isolated Cloudinary folders.</p>

          <h3>3. Data Deletion</h3>
          <p>You maintain full control over your data. By using the "Delete Account" feature in your Settings, our cascading delete system will immediately and permanently erase your user profile, chat history, documents, and cloud storage files.</p>
          
          <p className="text-sm text-neutral-400 mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">Last updated: July 2026</p>
        </div>
      </motion.div>
    </div>
  );
}