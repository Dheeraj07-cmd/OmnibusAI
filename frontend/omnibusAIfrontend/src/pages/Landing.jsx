import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Code2, FileText, Sparkles, Database, Shield, Zap } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const features = [
    { icon: <Bot className="text-blue-500" size={24} />, title: "Real-Time AI Streaming", description: "Experience ultra-fast, chunk-by-chunk AI responses powered by reactive WebFlux." },
    { icon: <FileText className="text-purple-500" size={24} />, title: "Intelligent Documents", description: "A Notion-style rich text editor with context-aware AI text generation." },
    { icon: <Code2 className="text-green-500" size={24} />, title: "Code Copilot", description: "An integrated Monaco Editor environment to refactor and analyze code instantly." },
    { icon: <Database className="text-orange-500" size={24} />, title: "Cloud File Storage", description: "Secure, persistent file uploads and image management powered by Cloudinary." },
    { icon: <Shield className="text-red-500" size={24} />, title: "Enterprise Security", description: "Stateless JWT authentication and role-based access control built on Spring Security." },
    { icon: <Zap className="text-yellow-500" size={24} />, title: "Perplexity-Style Research", description: "Deep, synthesized research reports formatted beautifully in markdown." }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Sparkles className="text-blue-600" size={24} />
            <span>OmnibusAI</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* The Theme Toggle injected into the Navbar */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 text-xs md:text-sm">
                  Dashboard <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-xs md:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:scale-105 shadow-lg text-white rounded-full px-5 text-xs md:text-sm font-semibold transition-transform border-0">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs md:text-sm font-medium mb-6 border border-blue-200 dark:border-blue-800/50">
            <Sparkles size={14} /> Powered by Spring Boot 3 & React 18
          </div>
          
          {/* Animated Floating Headline */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              The Ultimate <br /> AI Workspace.
            </h1>
          </motion.div>

          <p className="text-base md:text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A full-stack, enterprise-grade AI platform featuring real-time streaming, rich-text document intelligence, and integrated code editing.
          </p>
          
          <Link to={isAuthenticated ? "/dashboard" : "/register"}>
            <Button size="lg" className="h-12 md:h-14 px-8 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:scale-105 transition-all">
              {isAuthenticated ? "Enter Workspace" : "Start Building for Free"} <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">Everything you need to work faster.</h2>
            <p className="text-xs md:text-sm text-neutral-500 max-w-xl mx-auto">Built with a robust Java backend and a lightning-fast frontend.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div key={i} whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.2 }} className="p-6 md:p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center mb-5 border border-neutral-100 dark:border-neutral-800">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <p>© 2026 OmnibusAI. Full-Stack Engineering Showcase.</p>
      </footer>
    </div>
  );
}