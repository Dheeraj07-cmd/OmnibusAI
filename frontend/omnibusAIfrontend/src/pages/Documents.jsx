import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Save, Loader2, Sparkles, CornerDownLeft, Trash2, Eye, Edit3, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const sidebarContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const sidebarItem = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');

  const [showAiBar, setShowAiBar] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState('');

  const token = useAuthStore((state) => state.token);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
      if (res.data.length > 0 && !activeDoc) {
        loadDoc(res.data[0]);
      }
    } catch (e) { console.error(e); }
  };

  const loadDoc = (doc) => {
    setActiveDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setAiDraft('');
    setShowAiBar(false);
  };

  const createNewDocument = () => {
    setActiveDoc({ title: 'Untitled Document', content: '' });
    setTitle('Untitled Document');
    setContent('');
    setIsPreview(false);
    setAiDraft('');
    setShowAiBar(false);
  };

  const saveDocument = async () => {
    if (!activeDoc) return;
    setIsSaving(true);
    try {
      const res = await api.post('/documents', { ...activeDoc, title, content });
      setActiveDoc(res.data);
      fetchDocuments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      const newDocs = documents.filter(d => d.id !== id);
      setDocuments(newDocs);
      if (activeDoc?.id === id) {
        newDocs.length > 0 ? loadDoc(newDocs[0]) : createNewDocument();
      }
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const handleAiAssist = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiDraft('');

    try {
      const response = await fetch(`${API_BASE_URL}/documents/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: content, instruction: aiPrompt })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let resultQueue = "";
      let isTyping = false;
      let accumulatedText = "";
      let buffer = "";

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;
        while (resultQueue.length > 0) {
          const chars = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          accumulatedText += chars;
          setAiDraft(accumulatedText);
          await new Promise((r) => setTimeout(r, 25));
        }
        isTyping = false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop();

          for (const event of events) {
            const dataLines = event.split('\n').filter(l => l.startsWith('data:')).map(l => l.replace(/^data:\s*/, ''));
            if (dataLines.length > 0) {
              const cleanChunk = dataLines.join('\n').replace(/\\n/g, '\n');
              if (cleanChunk.trim() === '[DONE]') continue;
              resultQueue += cleanChunk;
              processQueue();
            }
          }
        }
      }

      while (isTyping) await new Promise((r) => setTimeout(r, 100));

    } catch (err) {
      setAiDraft('**Error:** Connection failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const appendDraft = () => {
    setContent(prev => prev + (prev && !prev.endsWith('\n\n') ? '\n\n' : '') + aiDraft);
    setAiDraft('');
    setShowAiBar(false);
    setAiPrompt('');
  };

  const discardDraft = () => {
    setAiDraft('');
    setAiPrompt('');
    setShowAiBar(false);
  }

  return (
    <div className="flex h-full bg-white dark:bg-neutral-900 overflow-hidden">

      {/* Sidebar */}
      <div className="hidden md:flex w-72 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex-col shrink-0">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={createNewDocument} className="w-full justify-start shadow-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
              <Plus size={18} className="mr-2" /> New Document
            </Button>
          </motion.div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {documents.length === 0 && <div className="text-center text-xs text-neutral-500 mt-10">
            No documents yet.</div>
          }

          <motion.div variants={sidebarContainer} initial="hidden" animate="show" className="space-y-1">
            {documents.map((doc) => (
              <motion.div variants={sidebarItem} key={doc.id} className="relative group">
                <button onClick={() => loadDoc(doc)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${activeDoc?.id === doc.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}>

                  {activeDoc?.id === doc.id && (
                    <motion.div layoutId="activeDocIndicator" className="absolute left-1 w-1 h-5 bg-blue-500 rounded-full" />
                  )}

                  <FileText size={16} className={`mr-3 shrink-0 ${activeDoc?.id === doc.id ? 'text-blue-500' : ''}`} />
                  <span className="truncate pr-6">{doc.title}</span>
                </button>
                <button onClick={(e) => handleDelete(e, doc.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-100 dark:bg-neutral-950">

        {/* Top Toolbar */}
        <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shrink-0 shadow-sm z-20">

          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button onClick={() => setIsPreview(false)} className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${!isPreview ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
              {!isPreview && <motion.div layoutId="docToggle" className="absolute inset-0 bg-white dark:bg-neutral-700 shadow-sm rounded-md" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
              <span className="relative z-10 flex items-center"><Edit3 size={14} className="mr-1.5" /> Edit</span>
            </button>

            <button onClick={() => setIsPreview(true)} className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${isPreview ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
              {isPreview && <motion.div layoutId="docToggle" className="absolute inset-0 bg-white dark:bg-neutral-700 shadow-sm rounded-md" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
              <span className="relative z-10 flex items-center"><Eye size={14} className="mr-1.5" /> Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="lg" onClick={() => setShowAiBar(!showAiBar)} className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-white dark:bg-neutral-900 cursor-pointer transition-colors">
              <Sparkles size={16} className={`mr-1 md:mr-2 ${showAiBar ? 'animate-pulse text-purple-500' : ''}`} />
              <span className="hidden sm:inline">AI Draft</span>
            </Button>

            <Button onClick={saveDocument} size="lg" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-1 md:mr-2" />} <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>


        <AnimatePresence>
          {showAiBar && activeDoc && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="border-b border-purple-200 dark:border-purple-800/50 bg-gradient-to-r from-purple-50 via-white to-blue-50 dark:from-purple-900/20 dark:via-neutral-900 dark:to-blue-900/10 overflow-hidden shrink-0 z-10 shadow-md relative"
            >
              {isAiLoading && (
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute top-0 left-0 w-full h-0.5 z-20"
                >
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                </motion.div>
              )}

              <div className="max-w-4xl mx-auto p-4 md:p-6 relative">

                <button onClick={discardDraft} className="absolute top-10 right-8 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer z-20">
                  <X size={20} />
                </button>

                <form onSubmit={handleAiAssist} className="flex items-center relative group">
                  <Sparkles size={16} className={`absolute left-4 transition-colors duration-300 hidden sm:block z-10 ${isAiLoading ? 'text-purple-500' : 'text-purple-400'}`} />
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. 'Write an introduction about quantum computing...'"
                    className="sm:pl-12 pr-14 py-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-800/50 rounded-2xl shadow-sm text-sm focus-visible:ring-purple-500 transition-all"
                    disabled={isAiLoading}
                    autoFocus
                  />
                  <Button type="submit" size="icon" disabled={isAiLoading || !aiPrompt.trim()} className="absolute right-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-9 w-9 cursor-pointer transition-transform active:scale-90 z-10">
                    {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <CornerDownLeft size={16} />}
                  </Button>
                </form>

                <AnimatePresence>
                  {aiDraft && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-5 p-6 bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800/50 rounded-3xl shadow-xl">
                      <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed max-h-[40vh] md:max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiDraft}</ReactMarkdown>
                      </div>

                      {!isAiLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                          <Button size="sm" onClick={appendDraft} className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full px-5 cursor-pointer shadow-md shadow-purple-500/20">
                            <Check size={14} className="mr-1.5" /> Append to Document
                          </Button>
                          <Button size="sm" variant="ghost" onClick={discardDraft} className="text-xs text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full cursor-pointer transition-colors">
                            Discard
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scrollbar-none relative">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          <motion.div layout className="max-w-5xl mx-auto bg-white dark:bg-neutral-900 min-h-[800px] border border-neutral-200/60 dark:border-neutral-800 shadow-2xl rounded-[2rem] p-8 md:p-14 lg:p-20 transition-all duration-300 relative z-10">
            {activeDoc ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPreview}
                  className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white bg-transparent border-none outline-none w-full mb-8 md:mb-12 placeholder-neutral-300 dark:placeholder-neutral-700 leading-tight transition-colors focus:text-blue-600 dark:focus:text-blue-400"
                  placeholder="Untitled Document"
                />

                {isPreview ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-500 custom-scrollbar">
                    {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-neutral-400 italic">Document is empty.</p>}
                  </motion.div>
                ) : (
                  <motion.textarea
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Press AI Draft above or start writing using Markdown..."
                    className="w-full h-[600px] resize-none bg-transparent outline-none text-neutral-800 dark:text-neutral-200 text-base md:text-md leading-relaxed font-mono custom-scrollbar placeholder:italic"
                  />
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-neutral-400 mt-32">
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <FileText size={80} className="mb-6 opacity-20" />
                </motion.div>
                <p className="text-lg font-medium text-neutral-500">Select a document or create a new one.</p>
              </motion.div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}