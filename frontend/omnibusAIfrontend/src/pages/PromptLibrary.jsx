import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Search, Trash2, Copy, Check, Terminal, BookOpen, Briefcase, GraduationCap, Share2, ArrowRight, X, Loader2 } from 'lucide-react';
import usePromptStore from '../store/promptStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const CATEGORIES = [
  { id: 'All', label: 'All Prompts', icon: Sparkles, color: 'group-hover:text-blue-500', glow: 'group-hover:shadow-blue-500/20' },
  { id: 'Programming', label: 'Programming', icon: Terminal, color: 'group-hover:text-emerald-500', glow: 'group-hover:shadow-emerald-500/20' },
  { id: 'Resume', label: 'Career & Resume', icon: Briefcase, color: 'group-hover:text-orange-500', glow: 'group-hover:shadow-orange-500/20' },
  { id: 'Marketing', label: 'Marketing & Sales', icon: Share2, color: 'group-hover:text-pink-500', glow: 'group-hover:shadow-pink-500/20' },
  { id: 'Education', label: 'Education', icon: GraduationCap, color: 'group-hover:text-purple-500', glow: 'group-hover:shadow-purple-500/20' },
];

export default function PromptLibrary() {
  const navigate = useNavigate();
  const { prompts, isLoading, fetchPrompts, deletePrompt, createPrompt, selectedCategory, setCategory, searchQuery, setSearchQuery, getFilteredPrompts } = usePromptStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setFormCategory] = useState('Programming');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => { fetchPrompts(); }, []);

  const filteredPrompts = getFilteredPrompts();

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (templateContent) => {
    navigate(`/dashboard/chat?prompt=${encodeURIComponent(templateContent)}`);
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await createPrompt({ title, description, category, tags, content });
      setTitle(''); setDescription(''); setTags(''); setContent('');
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save custom prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryConfig = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-10 overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="z-10">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm border border-purple-200 dark:border-purple-800/50">
              <Sparkles size={14} className="animate-pulse" /> Enterprise System Templates
            </motion.div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Prompt Engineering Hub</h1>
            <p className="text-sm text-neutral-500 mt-1">Launch pre-built executive templates or standardize team workflows.</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="z-10">
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 px-5 shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer">
              <Plus size={16} className="mr-2" /> New Custom Prompt
            </Button>
          </motion.div>
        </motion.div>

        {/* Controls & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between z-10 relative">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                >
                  <Icon size={14} className={isActive ? 'text-blue-400 dark:text-blue-600' : ''} />
                  {cat.label}
                </motion.button>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative w-full md:w-72 shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or tags..."
              className="pl-10 h-10 text-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm focus-visible:ring-blue-500 transition-all"
            />
          </motion.div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={36} /></div>
        ) : filteredPrompts.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white/50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center">
            <Sparkles size={48} className="text-neutral-300 dark:text-neutral-700 mb-4 opacity-50" />
            <p className="text-sm font-medium text-neutral-500">No prompts found matching your criteria.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPrompts.map((p, idx) => {
                const config = getCategoryConfig(p.category);
                return (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24, delay: idx * 0.05 }}
                  >
                    <Card
                      onClick={() => handleUseTemplate(p.content)}
                      className={`p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm transition-all duration-300 group flex flex-col justify-between h-full cursor-pointer relative overflow-hidden hover:-translate-y-1 hover:shadow-xl ${config.glow}`}
                    >
                      {p.systemTemplate && (
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-bl-xl tracking-wider uppercase shadow-md">
                          Official
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-1.5">
                            <config.icon size={12} className={config.color.replace('group-hover:', '')} /> {p.category}
                          </span>
                        </div>
                        <h3 className={`font-bold text-lg text-neutral-900 dark:text-neutral-100 transition-colors ${config.color}`}>
                          {p.title}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>

                        {p.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {p.tags.split(',').map((t, i) => (
                              <span key={i} className="text-[11px] text-neutral-400 bg-neutral-50 dark:bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-100 dark:border-neutral-800 font-mono transition-colors group-hover:border-neutral-200 dark:group-hover:border-neutral-700">
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={(e) => handleCopy(e, p.content, p.id)}
                            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            title="Copy raw prompt"
                          >
                            {copiedId === p.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </Button>
                          {!p.systemTemplate && (
                            <Button
                              variant="ghost" size="icon"
                              onClick={(e) => { e.stopPropagation(); deletePrompt(p.id); }}
                              className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete custom prompt"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>

                        <span className={`text-xs font-bold flex items-center gap-1 transition-all transform group-hover:translate-x-1 ${config.color.replace('group-hover:', '')}`}>
                          Use in Workspace <ArrowRight size={14} />
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Prompt Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles size={20} className="text-purple-500" /> Create Engineering Template</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors p-1 bg-neutral-100 dark:bg-neutral-800 rounded-full cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreatePrompt} className="space-y-4 mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Template Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Code Reviewer" required className="text-sm h-10 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Category</label>
                    <select value={category} onChange={(e) => setFormCategory(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                      <option value="Programming">Programming</option>
                      <option value="Resume">Career & Resume</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Short Description</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this prompt solve?" className="text-sm h-10 shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Tags (comma separated)</label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sql, react, audit" className="text-sm h-10 font-mono shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    System Instructions
                    <span className="text-[10px] font-normal text-neutral-400 normal-case bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">Markdown Supported</span>
                  </label>
                  <textarea
                    value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="Act as a Principal Engineer. Review the following code for memory leaks..."
                    rows={5} required
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono shadow-inner custom-scrollbar"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-sm cursor-pointer">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 shadow-md cursor-pointer">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Prompt'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}