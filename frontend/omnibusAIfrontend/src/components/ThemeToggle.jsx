import { useState, useLayoutEffect, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      // If the class is already there (thanks to index.html), trust the DOM.
      if (root.classList.contains('dark')) return 'dark';

      const savedTheme = localStorage.getItem('omnibus_theme');
      if (savedTheme) {
        return savedTheme;
      }

      // If no saved theme, fallback to user's OS preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Theme changes update save to localStorage
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('omnibus_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail === 'dark' || e.detail === 'light') {
        setTheme(e.detail);
      }
    };

    window.addEventListener('omnibus-theme-sync', handleSync);
    return () => window.removeEventListener('omnibus-theme-sync', handleSync);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('omnibus-theme-sync', { detail: newTheme }));
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm overflow-hidden cursor-pointer"
      aria-label="Toggle Theme"
    >

      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="dark"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Moon size={18} className="text-blue-400" />
          </motion.div>
        ) : (
          <motion.div
            key="light"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Sun size={18} className="text-orange-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}