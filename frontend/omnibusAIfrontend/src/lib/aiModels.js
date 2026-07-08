import { Sparkles, Zap, BrainCircuit, Code2 } from 'lucide-react';

export const AI_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash',
    provider: 'Google',
    description: 'Fast, versatile, and highly capable for everyday tasks.',
    icon: Sparkles,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Advanced reasoning for complex, multi-step problems.',
    icon: BrainCircuit,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'Groq',
    description: 'Open-source powerhouse running at lightning speed.',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'OpenRouter',
    description: 'Elite programming and refactoring assistant.',
    icon: Code2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
  }
];