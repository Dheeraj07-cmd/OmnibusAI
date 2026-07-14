import { useState, useEffect, useRef } from 'react';
import { UploadCloud, File, Image as ImageIcon, FileText, Download, Loader2, Sparkles, Send, AlertCircle, X, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const token = useAuthStore((state) => state.token);

  const [query, setQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    try { const res = await api.get('/files'); setFiles(res.data); } catch (e) { console.error(e); }
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchFiles();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. The AI provider may be busy.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAskFiles = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setChatResponse('');

    try {
      const response = await fetch(`${API_BASE_URL}/files/chat/stream?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let resultQueue = "";
      let currentDisplayedText = "";
      let isTyping = false;
      let buffer = "";

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;

        while (resultQueue.length > 0) {
          const charsToType = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          currentDisplayedText += charsToType;
          setChatResponse(currentDisplayedText);
          await new Promise((resolve) => setTimeout(resolve, 25));
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
            const dataLines = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.replace(/^data:\s*/, ''));
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
      setChatResponse('**Error:** Unable to search documents. Ensure you have uploaded files first.');
    } finally {
      setIsSearching(false);
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files[0]); };

  const formatBytes = (b) => { if (b === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };
  const getFileIcon = (t) => { if (!t) return <File className="text-neutral-500" size={28} />; if (t.includes('image')) return <ImageIcon className="text-blue-500" size={28} />; if (t.includes('pdf') || t.includes('text')) return <FileText className="text-purple-500" size={28} />; return <File className="text-neutral-500" size={28} />; };

  const gridContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const gridItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-10 overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Header Styling */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Database className="text-blue-500" size={32} /> File Intelligence
          </h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-xl">Upload complex documents, PDFs, and CSVs to instantly query them using Enterprise Retrieval-Augmented Generation (RAG).</p>
        </motion.div>

        {/* Chat Box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="p-5 md:p-8 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/30 dark:from-blue-950/30 dark:to-neutral-900/50 shadow-md rounded-3xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={120} /></div>

            <form onSubmit={handleAskFiles} className="relative z-10 max-w-3xl">
              <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500 animate-pulse" /> Chat with your Vector Database
              </h3>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 'Summarize the Q3 report' or 'What is the refund policy?'"
                  className="flex-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-blue-100 dark:border-blue-800 text-sm h-12 shadow-inner focus-visible:ring-blue-500"
                  disabled={isSearching}
                />

                <Button type="submit" disabled={isSearching || !query} className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 shadow-lg shadow-blue-500/20 cursor-pointer w-full sm:w-auto">
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2" /> Query Data</>}
                </Button>
              </div>
            </form>

            {/* Response Container */}
            <AnimatePresence>
              {chatResponse && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-blue-100 dark:border-blue-900/40 shadow-sm relative z-10">
                  <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{chatResponse}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Drag and Drop Files */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 transition-all duration-300 cursor-pointer p-10 md:p-16 text-center rounded-3xl relative overflow-hidden group
              ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02] border-solid shadow-xl'
                : 'border-dashed border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600'}
              ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {/* Animated dotted border effect */}
            {!isDragging && !isUploading && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(90deg,transparent_50%,rgba(59,130,246,0.1)_50%)] bg-[length:20px_100%] animate-[slide_1s_linear_infinite]" />
            )}

            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleUpload(e.target.files[0])} accept=".txt,.pdf,.md,.csv,.json" />
            <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
              <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-neutral-100 dark:bg-neutral-800'} transition-colors duration-300`}>
                {isUploading ? <Loader2 size={48} className="text-blue-500 animate-spin" /> : <UploadCloud size={48} className={`text-blue-500 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:-translate-y-1'}`} />}
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                  {isUploading ? 'Extracting & Vectorizing...' : isDragging ? 'Drop to Upload!' : 'Click or Drag & Drop'}
                </h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">Supports PDF, TXT, MD, and CSV. Files are automatically chunked and embedded.</p>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          <AnimatePresence>
            {uploadError && (
              <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 shadow-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span className="flex-1 font-medium">{uploadError}</span>

                <button onClick={() => setUploadError("")} className="text-red-500 hover:text-red-700 dark:hover:text-red-200 p-1 bg-red-100 dark:bg-red-900/50 rounded-full cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Files Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Database size={20} className="text-neutral-400" /> Vectorized Library
          </h2>

          {files.length === 0 ? (
            <div className="text-center text-neutral-400 py-16 bg-white/50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700 text-sm">
              <File size={40} className="mx-auto mb-4 opacity-20" />
              No documents embedded yet.
            </div>
          ) : (
            <motion.div variants={gridContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {files.map((file) => (
                <motion.div key={file.id} variants={gridItem} whileHover={{ y: -5 }}>
                  <Card className="p-5 flex flex-col items-center text-center space-y-4 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all h-full rounded-3xl group">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="w-full flex-1">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate px-2" title={file.fileName}>{file.fileName}</p>
                      <p className="text-xs text-neutral-500 mt-1 font-mono bg-neutral-100 dark:bg-neutral-800 inline-block px-2 py-0.5 rounded-md">{formatBytes(file.fileSize)}</p>
                    </div>
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl cursor-pointer transition-colors mt-2">
                      <Download size={14} /> Download File
                    </a>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
