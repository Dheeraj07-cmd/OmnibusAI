import { useState, useRef, useEffect } from 'react';
import { Search, Globe, Library, Loader2, Sparkles, ArrowRight, Compass, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Loading phrases
const LOADING_PHRASES = [
  "Initializing deep search...",
  "Scanning global knowledge graph...",
  "Analyzing primary sources...",
  "Cross-referencing data points...",
  "Synthesizing final report..."
];

export default function Research() {
  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [result, setResult] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const resultEndRef = useRef(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (isSearching && result) {
      resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result, isSearching]);

  // Cycle loading phrases
  useEffect(() => {
    let interval;
    if (isSearching && !result) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_PHRASES.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isSearching, result]);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    setIsSearching(true);
    setActiveSearch(query);
    setResult('');
    setLoadingStep(0);

    try {
      const response = await fetch(`${API_BASE_URL}/research/stream?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let resultQueue = "";
      let currentText = "";
      let isTyping = false;
      let buffer = "";

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;
        while (resultQueue.length > 0) {
          const charsToType = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          currentText += charsToType;
          setResult(currentText);
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
            const dataLines = event.split('\n')
              .filter(line => line.startsWith('data:'))
              .map(line => line.replace(/^data:\s*/, ''));

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

    } catch (error) {
      setResult('**Error:** Unable to connect to the research engine.');
    } finally {
      setIsSearching(false);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(0,0,0,0))] pointer-events-none" />

      <motion.div layout initial={false} animate={{ height: hasSearched ? 'auto' : '100%', paddingTop: hasSearched ? '2rem' : '0' }} className={`flex flex-col items-center z-10 w-full px-4 ${hasSearched ? 'pb-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-sm' : 'justify-center'}`}>

        <AnimatePresence>
          {!hasSearched && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }} transition={{ duration: 0.4 }} className="text-center mb-10 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full" />
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500 mb-4 animate-float relative z-10">
                Deep Research
              </h1>
              <p className="text-neutral-500 text-lg md:text-xl font-medium relative z-10">Synthesize global knowledge instantly.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form layoutId="searchForm" onSubmit={handleResearch} className={`w-full relative flex items-center transition-all duration-300 ${hasSearched ? 'max-w-4xl' : 'max-w-3xl'}`}>
          {/* Glowing Effect behind search bar */}
          <div className={`absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-[2rem] blur-lg transition-opacity duration-500 ${isFocused && !hasSearched ? 'opacity-30' : 'opacity-0'}`} />

          <div className="relative w-full flex items-center bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden group">
            <Globe className={`absolute left-5 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-neutral-400'}`} size={hasSearched ? 20 : 24} />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a question or enter a complex topic to research..."
              className={`w-full border-none shadow-none focus-visible:ring-0 bg-transparent transition-all duration-300 ${hasSearched ? 'pl-14 pr-16 py-6 text-base' : 'pl-14 pr-16 py-8 text-lg md:text-xl'}`}
              disabled={isSearching}
            />

            <Button type="submit" size="icon" disabled={isSearching || !query.trim()} className={`absolute right-2.5 rounded-xl transition-all duration-300 cursor-pointer ${hasSearched ? 'h-10 w-10' : 'h-12 w-12'} ${query.trim() && !isSearching ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
              {isSearching
                ? <Loader2 className="animate-spin" size={hasSearched ? 18 : 22} />
                : <ArrowRight size={hasSearched ? 18 : 22} />}
            </Button>
          </div>
        </motion.form>
      </motion.div>

      {/* Results Area */}
      {hasSearched && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 scrollbar-none">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="max-w-4xl mx-auto w-full space-y-8 pb-10">

            <div className="flex items-start gap-4 text-neutral-900 dark:text-white px-2">
              <div className="p-3 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-2xl shrink-0 mt-1">
                <Search className="text-neutral-500" size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{activeSearch}</h2>
            </div>

            <Card className="rounded-3xl shadow-xl shadow-black/5 border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-2">
                  <Library size={18} className="text-blue-500" />
                  <span className="font-bold text-sm uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Synthesized Report</span>
                </div>

                {/* Typing Indicator */}
                {isSearching && result.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Receiving Data
                  </div>
                )}
              </div>

              <div className="p-6 md:p-10 min-h-[300px]">
                {result ? (
                  <div className="prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600 prose-li:marker:text-blue-500 custom-scrollbar">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    {/* Scanning Animation */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute inset-4 border-2 border-blue-500/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full animate-spin" style={{ animationDuration: '4s' }} />
                      <Compass size={32} className="text-blue-500 relative z-10" />
                    </div>

                    <div className="h-6 flex items-center justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={loadingStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-neutral-500 font-medium"
                        >
                          {LOADING_PHRASES[loadingStep]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                <div ref={resultEndRef} className="h-4" />
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}