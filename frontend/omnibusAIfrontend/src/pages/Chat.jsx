import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, ChevronDown, PanelRightOpen, PanelRightClose, Code2, Copy, Check, Sparkles } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_MODELS } from '../lib/aiModels';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useAuthStore((state) => state.token);

  const {
    messages,
    currentConversation,
    isLoadingHistory,
    loadConversation,
    clearCurrentChat,
    createConversation,
    addMessage,
    fetchConversations
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [canvas, setCanvas] = useState(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [copiedCanvas, setCopiedCanvas] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (id) {
        const activeId = useChatStore.getState().currentConversation?.id;
        if (activeId !== Number(id)) {
          await loadConversation(id);
        }
      } else {
        clearCurrentChat();
        setIsCanvasOpen(false);
      }
    };

    initializeChat();
  }, [id]);

  useEffect(() => {
    const promptQuery = searchParams.get('prompt');
    if (promptQuery && !id) {
      setInput(promptQuery);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, id]);

  useEffect(() => {
    if (currentConversation?.aiModel) {
      const found = AI_MODELS.find(m => m.id === currentConversation.aiModel);
      if (found && found.id !== selectedModel.id) {
        setSelectedModel(found);
      }
    }
  }, [currentConversation?.aiModel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopyCanvas = () => {
    if (canvas) {
      navigator.clipboard.writeText(canvas.content);
      setCopiedCanvas(true);
      setTimeout(() => setCopiedCanvas(false), 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    let convId = id;
    const userText = input;
    setInput('');
    setShowDropdown(false);

    if (!convId) {
      const newTitle = userText.length > 30 ? userText.substring(0, 30) + '...' : userText;
      const newConv = await createConversation(newTitle, selectedModel.id);
      convId = newConv.id;
      navigate(`/dashboard/chat/${convId}`, { replace: true });
      fetchConversations();
    }

    const userMessageObj = { role: 'user', content: userText };
    addMessage(userMessageObj);
    setIsLoading(true);
    addMessage({ role: 'assistant', content: '' });

    api.post(`/conversations/${convId}/messages`, userMessageObj).catch(console.error);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream?message=${encodeURIComponent(userText)}&model=${selectedModel.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let resultQueue = "";
      let currentText = "";
      let fullAssistantResponse = "";
      let isTyping = false;
      let buffer = "";

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;

        while (resultQueue.length > 0) {
          const charsToType = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          currentText += charsToType;

          useChatStore.setState((state) => {
            const newMessages = [...state.messages];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: currentText };
            }
            return { messages: newMessages };
          });

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
              fullAssistantResponse += cleanChunk;
              processQueue();
            }
          }
        }
      }

      while (isTyping) await new Promise((r) => setTimeout(r, 100));

      await api.post(`/conversations/${convId}/messages`, { role: 'assistant', content: fullAssistantResponse, tokensUsed: 0 });
      fetchConversations();

    } catch (error) {
      useChatStore.setState((state) => {
        const newMessages = [...state.messages];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: '**Error:** Unable to connect to AI Provider.' };
        }
        return { messages: newMessages };
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHistory) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      if (!inline && match) {
        return (
          <div className="relative group mt-4 mb-4 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 text-neutral-400 text-xs border-b border-neutral-800">
              <span className="font-mono uppercase text-neutral-300">{match[1]}</span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCanvas({ language: match[1], content: codeString });
                  setIsCanvasOpen(true);
                }}
                className="flex items-center gap-1.5 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 px-3 py-1.5 rounded-lg transition-all border border-neutral-700/50 cursor-pointer shadow-sm"
              >
                <PanelRightOpen size={14} className="text-blue-400" />
                <span className="font-medium">Open Canvas</span>
              </motion.button>
            </div>

            <div className="p-4 overflow-x-auto text-sm text-neutral-300 font-mono custom-scrollbar">
              <code className={className} {...props}>{children}</code>
            </div>
          </div>
        );
      }

      return <code className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md text-sm font-mono text-pink-600 dark:text-pink-400" {...props}>{children}</code>;
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-neutral-900 overflow-hidden relative">
      {/* Chat */}
      <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isCanvasOpen ? 'w-full lg:w-1/2 border-r border-neutral-200 dark:border-neutral-800 hidden lg:flex' : 'w-full'}`}>
        <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-8 shrink-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md relative z-30">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-2">
            {currentConversation ? currentConversation.title : 'New Workspace'}
          </h2>
          <div className="relative">

            <motion.button
              whileHover={!currentConversation ? { scale: 1.02 } : {}}
              whileTap={!currentConversation ? { scale: 0.98 } : {}}
              onClick={() => !currentConversation && setShowDropdown(!showDropdown)}
              disabled={!!currentConversation}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm transition-all ${!currentConversation ? 'hover:shadow-md cursor-pointer' : 'opacity-70 cursor-default'}`}
            >
              <selectedModel.icon size={16} className={selectedModel.color} />
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{selectedModel.name}</span>
              {!currentConversation && <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />}
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">Select AI Engine</div>
                  <div className="p-1.5 space-y-1">
                    {AI_MODELS.map((model) => (
                      <button key={model.id} onClick={() => { setSelectedModel(model); setShowDropdown(false); }} className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${selectedModel.id === model.id ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${model.bgColor}`}><model.icon size={16} className={model.color} /></div>
                        <div>
                          <div className={`text-xs font-bold ${selectedModel.id === model.id ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-neutral-100'}`}>{model.name}</div>
                          <div className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{model.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-6 custom-scrollbar relative z-10">
          {messages.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="h-full flex flex-col items-center justify-center text-neutral-400 relative">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20 ${selectedModel.bgColor}`} />

              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`p-5 rounded-3xl mb-6 shadow-xl border border-white/20 dark:border-white/5 ${selectedModel.bgColor}`}>
                <selectedModel.icon size={48} className={selectedModel.color} />
              </motion.div>

              <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200 relative z-10">Chat with {selectedModel.name}</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-sm text-center relative z-10">{selectedModel.description}</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 md:gap-4 ${isCanvasOpen ? 'max-w-full' : 'max-w-4xl mx-auto'} ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${selectedModel.bgColor}`}>
                    <Bot size={18} className={selectedModel.color} />
                  </div>
                )}

                <div className={`px-4 py-3 md:px-5 md:py-3.5 rounded-3xl max-w-[95%] shadow-sm ${isCanvasOpen ? 'md:max-w-[95%]' : 'md:max-w-[85%]'} ${msg.role === 'user' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tr-sm' : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 w-full min-w-0 rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
                  ) : msg.content === '' ? (
                    <div className="flex items-center gap-1.5 h-6 px-1">
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-blue-500" />
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-purple-500" />
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed overflow-hidden">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shrink-0 z-20">
          <form onSubmit={handleSend} className={`${isCanvasOpen ? 'w-full' : 'max-w-4xl mx-auto'} relative flex items-center group`}>

            <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[1.5rem] blur-md transition-opacity duration-500 ${isInputFocused ? 'opacity-20' : 'opacity-0'}`} />

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={`Message ${selectedModel.name}...`}
              className="w-full pr-14 py-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-base relative z-10 focus-visible:ring-0"
              disabled={isLoading}
            />

            <motion.div className="absolute right-2 z-20" whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}} whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}>
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className={`rounded-xl transition-all duration-300 ${input.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 cursor-pointer' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className={input.trim() ? 'translate-x-[-1px] translate-y-[1px]' : ''} />}
              </Button>
            </motion.div>

          </form>
          <div className="text-center mt-2 text-[10px] text-neutral-400">AI can make mistakes. Verify important information.</div>
        </div>
      </div>

      {/* Artifact Canvas */}
      <AnimatePresence>
        {isCanvasOpen && canvas && (
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full lg:w-1/2 h-full flex flex-col bg-[#1e1e1e] shadow-2xl z-40 absolute lg:relative right-0 border-l border-neutral-800"
          >
            <div className="h-14 border-b border-neutral-800 bg-[#181818] flex items-center justify-between px-4 shrink-0 shadow-sm">

              <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">
                <Sparkles size={14} className="text-blue-500" />
                <span className="text-neutral-300">artifact.{canvas.language === 'javascript' ? 'js' : canvas.language === 'python' ? 'py' : canvas.language === 'java' ? 'java' : 'txt'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopyCanvas} className="text-neutral-400 hover:text-white text-xs h-8 cursor-pointer hover:bg-neutral-800 transition-colors">
                  {copiedCanvas ? <Check size={14} className="text-emerald-500 mr-1" /> : <Copy size={14} className="mr-1" />}
                  {copiedCanvas ? 'Copied' : 'Copy Code'}
                </Button>

                <div className="w-px h-4 bg-neutral-700 mx-1"></div>

                <Button variant="ghost" size="sm" onClick={() => setIsCanvasOpen(false)} className="text-neutral-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 h-8 w-8 p-0 cursor-pointer transition-colors rounded-full">
                  <PanelRightClose size={16} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <Editor height="100%" language={canvas.language === 'javascript' || canvas.language === 'jsx' ? 'javascript' : canvas.language}
                theme="vs-dark" value={canvas.content}
                options={{
                  minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                  wordWrap: 'on', padding: { top: 24, bottom: 24 }, scrollBeyondLastLine: false, readOnly: true, smoothScrolling: true
                }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}