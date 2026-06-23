import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const token = useAuthStore((state) => state.token);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`http://localhost:8080/api/chat/stream?message=${encodeURIComponent(userMessage.content)}`, {
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
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: currentText };
            return newMessages;
          });
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
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'assistant', content: '**Error:** Unable to connect.' };
        return newMessages;
      });
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
      <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400">
            <Bot size={48} className="mb-4 opacity-50 animate-float" />
            <h2 className="text-xl md:text-2xl font-medium text-neutral-800 dark:text-neutral-200">How can I help you today?</h2>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={18} className="text-white" />
                </div>
              )}
              <div className={`px-4 py-3 md:px-5 md:py-3.5 rounded-2xl max-w-[95%] md:max-w-[80%] ${msg.role === 'user' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tr-xs' : 'bg-transparent text-neutral-800 dark:text-neutral-200'}`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask OmnibusAI anything..." className="w-full pr-12 py-6 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none shadow-inner text-base" disabled={isLoading} />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="absolute right-2 rounded-lg">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </form>
      </div>
    </div>
  );
}