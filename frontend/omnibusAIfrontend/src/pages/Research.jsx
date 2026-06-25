import { useState, useRef, useEffect } from 'react';
import { Search, Globe, Library, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Research() {
  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [result, setResult] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const resultEndRef = useRef(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => { if (isSearching) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [result, isSearching]);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true); setIsSearching(true); setActiveSearch(query); setResult('');
    try {
      const response = await fetch(`http://localhost:8080/api/research/stream?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let resultQueue = "";
      let currentText = "";
      let isTyping = false;

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;
        while (resultQueue.length > 0) {
          const charsToType = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          currentText += charsToType;
          setResult(currentText);
          await new Promise((r) => setTimeout(r, 15));
        }
        isTyping = false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const parsedText = chunk.split('\n').filter(l => l.startsWith('data:')).map(l => l.replace('data:', '')).join('');
          if (parsedText) { resultQueue += parsedText; processQueue(); }
        }
        if (done) break;
      }
      while (isTyping) await new Promise((r) => setTimeout(r, 100));
    } catch (error) {
      setResult('**Error:** Unable to connect to the research engine.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <motion.div initial={false} animate={{ height: hasSearched ? 'auto' : '100%', paddingTop: hasSearched ? '2rem' : '0' }} className={`flex flex-col items-center z-10 w-full px-4 ${hasSearched ? 'pb-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md' : 'justify-center'}`}>

        <AnimatePresence>
          {!hasSearched && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }} className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4 animate-float">What do you want to know?</h1>
              <p className="text-neutral-500 text-lg">Omnibus Deep Research synthesizes information instantly.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleResearch} className="w-full max-w-3xl relative flex items-center">
          <Globe className="absolute left-4 text-blue-500" size={20} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or enter a topic to research..."
            className="w-full pl-12 pr-14 py-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg text-lg focus-visible:ring-blue-500" disabled={isSearching} />

          <Button type="submit" size="icon" disabled={isSearching || !query.trim()} className="absolute right-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-12 w-12">
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
          </Button>
        </form>
      </motion.div>

      {hasSearched && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full space-y-8">
            <div className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
              <Library className="text-blue-500" size={24} />
              <h2 className="text-xl md:text-2xl font-bold">{activeSearch}</h2>
            </div>

            <Card className="p-4 md:p-8 rounded-3xl shadow-xl border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <Sparkles size={18} className="text-purple-500" />
                <span className="font-semibold text-xs md:text-sm uppercase tracking-wider text-neutral-500">Synthesized Answer</span>
              </div>

              {result ? (
                <div className="prose dark:prose-invert max-w-none text-sm md:text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-neutral-400">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <p>Searching knowledge base...</p>
                </div>
              )}
              <div ref={resultEndRef} />
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}