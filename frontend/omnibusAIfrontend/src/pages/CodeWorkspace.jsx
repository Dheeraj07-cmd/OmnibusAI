import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal, Code2, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Button } from '@/components/ui/button';

export default function CodeWorkspace() {
  const [instruction, setInstruction] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Write your code here or ask AI Copilot to generate it...\n\nfunction calculateTotal() {\n  \n}');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const typingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const handleAssist = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    // Clear typing loops to prevent overlapping glitches
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    setIsGenerating(true);
    const prevCode = code;

    setCode('// Copilot is analyzing and thinking...\n');

    try {
      const res = await api.post('/code/assist', { code: prevCode, language, instruction });

      let clean = res.data.code.replace(/^```[a-z]*\s*[\r\n]/gim, '').replace(/```\s*$/gim, '').trim();

      let currentText = "";
      let index = 0;

      setCode('');

      // Typewriter engine
      typingIntervalRef.current = setInterval(() => {
        if (index < clean.length) {
          const chars = clean.substring(index, index + 3);
          currentText += chars;
          setCode(currentText);
          index += 3;
        } else {
          clearInterval(typingIntervalRef.current);
          setCode(clean);
          setInstruction('');
          setIsGenerating(false);
        }
      }, 25);

    } catch (err) {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setCode(prevCode + '\n\n// Error: Copilot connection failed.');
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExtension = (lang) => {
    switch (lang) {
      case 'javascript': return 'js';
      case 'typescript': return 'ts';
      case 'python': return 'py';
      case 'java': return 'java';
      case 'sql': return 'sql';
      case 'html': return 'html';
      default: return 'txt';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col xl:flex-row h-full bg-white dark:bg-neutral-950 overflow-hidden relative">

      {/* Control Panel */}
      <div className="w-full xl:w-[360px] border-b xl:border-b-0 xl:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-2xl flex flex-col p-6 space-y-6 shrink-0 z-20 relative">

        {/* Soft glow behind the panel */}
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-inner">
              <Terminal size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">AI Copilot</h1>
          </div>
          <p className="text-xs text-neutral-500 font-medium">Describe changes to edit the workspace instantly.</p>
        </div>

        <form onSubmit={handleAssist} className="flex flex-col space-y-5 flex-1 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Environment</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer transition-all"
            >
              <option value="javascript">JavaScript / Node.js</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java (Spring Boot)</option>
              <option value="python">Python</option>
              <option value="html">HTML / React JSX</option>
              <option value="sql">SQL / MySQL</option>
            </select>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
              Instruction
              {isGenerating && <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-[10px] text-blue-500 normal-case">AI is thinking...</motion.span>}
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., 'Refactor to arrow functions' or 'Add error handling'"
              className="w-full flex-1 min-h-[120px] xl:min-h-[250px] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all placeholder:text-neutral-400 custom-scrollbar"
              disabled={isGenerating}
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isGenerating || !instruction.trim()}
              className={`w-full text-white text-sm h-12 rounded-xl shadow-lg cursor-pointer transition-all duration-300 relative overflow-hidden ${isGenerating ? 'bg-neutral-800' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'}`}
            >
              {isGenerating && (
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
                />
              )}

              {isGenerating ?
                <><Loader2 size={16} className="animate-spin mr-2" /> Applying Edits...</>
                : <><Sparkles size={16} className="mr-2" /> Execute Prompt</>
              }
            </Button>
          </motion.div>
        </form>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col relative bg-[#1e1e1e] overflow-hidden">

        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full h-1 z-20 overflow-hidden"
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-14 border-b border-neutral-800 bg-[#181818] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-400 text-sm font-mono bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">
            <Code2 size={16} className={isGenerating ? "text-blue-500" : ""} />
            <span className="text-neutral-300">workspace.{getExtension(language)}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs h-9 px-4 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-neutral-700">
            {copied ? <Check size={16} className="mr-1.5 text-emerald-500" /> : <Copy size={16} className="mr-1.5" />} {copied ? 'Copied to Clipboard' : 'Copy Code'}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative">

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
              >
                <motion.div
                  animate={{ y: ["-100%", "800px"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  className="w-full h-32 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Editor
            height="100%"
            language={language === 'java' ? 'java' : language === 'python' ? 'python' : language}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v)}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: 'on',
              padding: { top: 24, bottom: 24 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on"
            }}
          />
        </div>
      </div>

    </motion.div>
  );
}