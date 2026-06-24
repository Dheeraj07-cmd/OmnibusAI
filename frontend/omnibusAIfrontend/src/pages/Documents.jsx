import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { FileText, Plus, Save, Loader2, Sparkles, CornerDownLeft } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [title, setTitle] = useState('Untitled Document');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiBar, setShowAiBar] = useState(false);
  const token = useAuthStore((state) => state.token);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Start typing or press AI Assist...' })],
    content: '',
    editorProps: { attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full min-h-[500px]' } },
    onUpdate: ({ editor }) => { if (activeDoc) setActiveDoc(prev => ({ ...prev, content: editor.getHTML() })); }
  });

  useEffect(() => { fetchDocuments(); }, []);

  useEffect(() => {
    if (editor && activeDoc) {
      if (editor.getHTML() !== activeDoc.content) editor.commands.setContent(activeDoc.content || '');
      setTitle(activeDoc.title);
    }
  }, [activeDoc?.id, editor]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
      if (res.data.length > 0 && !activeDoc) setActiveDoc(res.data[0]);
    } catch (e) { console.error(e); }
  };

  const createNewDocument = () => {
    setActiveDoc({ title: 'Untitled Document', content: '' });
    setTitle('Untitled Document');
    if (editor) editor.commands.setContent('');
  };

  const saveDocument = async () => {
    if (!activeDoc || !editor) return;
    setIsSaving(true);
    try {
      const res = await api.post('/documents', { ...activeDoc, title, content: editor.getHTML() });
      setActiveDoc(res.data);
      fetchDocuments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiAssist = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !editor) return;
    setIsAiLoading(true);

    const textContext = editor.getText();
    editor.commands.focus();

    try {
      const response = await fetch(`http://localhost:8080/api/documents/ai/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: textContext, instruction: aiPrompt })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let resultQueue = "";
      let isTyping = false;

      const processQueue = async () => {
        if (isTyping) return;
        isTyping = true;
        while (resultQueue.length > 0) {
          const c = resultQueue.substring(0, 2);
          resultQueue = resultQueue.substring(2);
          editor.commands.insertContent(c);
          await new Promise((r) => setTimeout(r, 15));
        }
        isTyping = false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const parsed = chunk.split('\n').filter(l => l.startsWith('data:')).map(l => l.replace('data:', '')).join('');
          if (parsed) { resultQueue += parsed; processQueue(); }
        }
        if (done) break;
      }

      while (isTyping) await new Promise((r) => setTimeout(r, 100));
      setAiPrompt('');
      setShowAiBar(false);
    } catch (err) {
      editor.commands.insertContent('\n**[AI Connection Failed]**\n');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:flex w-72 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex-col shrink-0">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <Button onClick={createNewDocument} className="w-full justify-start shadow-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Plus size={18} className="mr-2" /> New Document
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {documents.map((doc) => (
            <button key={doc.id} onClick={() => setActiveDoc(doc)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${activeDoc?.id === doc.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}>
              <FileText size={16} className="mr-3 shrink-0" /> <span className="truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-neutral-900 shrink-0">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base md:text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 max-w-xs md:max-w-md bg-transparent" placeholder="Document Title" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAiBar(!showAiBar)} className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <Sparkles size={16} className="mr-1 md:mr-2" />
              <span className="hidden sm:inline">AI Assist</span>
            </Button>
            <Button onClick={saveDocument} size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-1 md:mr-2" />} <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>

        {showAiBar && activeDoc && (
          <div className="absolute top-14 left-0 right-0 z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-8 py-3 shadow-md animate-in slide-in-from-top-2">
            <form onSubmit={handleAiAssist}
              className="max-w-4xl mx-auto flex items-center relative">
              <Sparkles size={16} className="absolute left-3 text-purple-500 animate-pulse hidden sm:block" />
              <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Tell AI what to write..." className="sm:pl-10 pr-12 py-5 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-lg shadow-inner" disabled={isAiLoading} autoFocus />
              <Button type="submit" size="icon" variant="ghost" disabled={isAiLoading || !aiPrompt.trim()} className="absolute right-2 text-neutral-400 hover:text-purple-500">
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <CornerDownLeft size={16} />}
              </Button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12"
          onClick={() => editor?.commands.focus()}>
          <div className="max-w-4xl mx-auto">
            {activeDoc ? <EditorContent editor={editor} /> : <div className="text-center text-neutral-400 mt-20">Select a document to start writing.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}