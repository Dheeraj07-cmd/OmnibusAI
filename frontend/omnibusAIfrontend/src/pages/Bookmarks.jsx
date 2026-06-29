import { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon, Plus, ExternalLink, Trash2, Loader2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setIsAdding(true);

    let fUrl = url.startsWith('http') ? url : 'https://' + url;
    try {
      const res = await api.post('/bookmarks', { title, url: fUrl, description });
      setBookmarks(prev => [res.data, ...prev]);
      setTitle('');
      setUrl('');
      setDescription('');
    } catch (err) {
      alert('Failed to save bookmark.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getSafeHostname = (u) => {
    try { return new URL(u).hostname; } catch { return u; }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-10 overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3 relative z-10 text-neutral-900 dark:text-white">
            <BookmarkIcon className="text-blue-500" size={32} /> Reading List
          </h1>
          <p className="text-sm text-neutral-500 mt-2 relative z-10">Save important research links, articles, and references for quick access.</p>
        </motion.div>

        {/* Input Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="p-5 md:p-8 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <form onSubmit={handleAddBookmark} className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mt-2">
              <div className="w-full lg:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spring Boot Docs" required className="text-sm h-11 bg-neutral-50 dark:bg-neutral-950 shadow-inner" />
              </div>
              <div className="w-full lg:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://spring.io" required className="text-sm h-11 bg-neutral-50 dark:bg-neutral-950 shadow-inner" />
              </div>
              <div className="w-full lg:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Notes (Optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reference notes..." className="text-sm h-11 bg-neutral-50 dark:bg-neutral-950 shadow-inner" />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full lg:w-auto">
                <Button type="submit" disabled={isAdding || !title || !url} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-11 px-8 shadow-lg shadow-blue-500/20 cursor-pointer">
                  {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="mr-2" />} Save Link
                </Button>
              </motion.div>
            </form>
          </Card>
        </motion.div>

        {/* Loading / Grid States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : bookmarks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-neutral-400 py-24 bg-white/50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Globe size={48} className="mx-auto mb-4 text-blue-500/30" />
            </motion.div>
            <p className="text-base font-medium text-neutral-600 dark:text-neutral-300">Your reading list is empty.</p>
            <p className="text-sm opacity-70 mt-1">Save your first link above to start organizing.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            <AnimatePresence>
              {bookmarks.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  layout
                >
                  <Card className="flex flex-col justify-between p-5 md:p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl group h-full relative overflow-hidden">

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">

                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0 group-hover:bg-white dark:group-hover:bg-neutral-700 transition-colors shadow-sm">
                            <img src={`https://www.google.com/s2/favicons?domain=${getSafeHostname(b.url)}&sz=64`} alt="" className="w-5 h-5 rounded-md" />
                          </div>
                          <h3 className="font-bold text-base line-clamp-2 text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={b.title}>{b.title}</h3>
                        </div>

                        <button onClick={() => handleDelete(b.id)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {b.description && <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4 leading-relaxed">
                        {b.description}
                      </p>}
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs relative z-10">
                      <span className="text-neutral-400 truncate max-w-[140px] font-mono bg-neutral-50 dark:bg-neutral-950 px-2 py-1 rounded-md border border-neutral-100 dark:border-neutral-800">
                        {getSafeHostname(b.url)}
                      </span>
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors">
                        Visit Site <ExternalLink size={14} />
                      </a>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}