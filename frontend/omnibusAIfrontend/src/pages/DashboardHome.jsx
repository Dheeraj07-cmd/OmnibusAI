import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Code2, Sparkles, BookOpen, Clock, Activity, FileText, ArrowRight, Loader2, Zap, Bookmark } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper for dynamic greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardHome() {
  const [stats, setStats] = useState({ totalCalls: 0, recentActivity: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredAction, setHoveredAction] = useState(null); 
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const res = await api.get('/analytics');
        setStats({
          totalCalls: res.data.totalCalls,
          recentActivity: res.data.recentActivity.slice(0, 5) // Show top 5
        });
      } catch (error) {
        console.error("Failed to load overview data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  const ACTIONS = [
    { id: 'chat', title: "Start Chat", desc: "Talk with the AI Assistant", icon: MessageSquare, path: "/dashboard/chat", color: "from-blue-500 to-blue-600", lightBg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600 dark:text-blue-400" },
    { id: 'code', title: "Code Copilot", desc: "Refactor or generate code", icon: Code2, path: "/dashboard/code", color: "from-emerald-400 to-emerald-600", lightBg: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { id: 'research', title: "Deep Research", desc: "Generate a Perplexity report", icon: Sparkles, path: "/dashboard/research", color: "from-purple-500 to-purple-600", lightBg: "bg-purple-50 dark:bg-purple-900/20", iconColor: "text-purple-600 dark:text-purple-400" },
    { id: 'files', title: "File Intelligence", desc: "Upload & Query PDF/Data", icon: FileText, path: "/dashboard/files", color: "from-orange-400 to-orange-600", lightBg: "bg-orange-50 dark:bg-orange-900/20", iconColor: "text-orange-600 dark:text-orange-400" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-neutral-500 font-medium animate-pulse">Initializing Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 lg:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent dark:from-blue-600/20 dark:via-purple-600/10 pointer-events-none" />
          
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
            <div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
                  <Zap size={14} className="animate-pulse" /> System Online
                </span>
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
                {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">{user?.name?.split(' ')[0] || 'Explorer'}</span>.
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base max-w-lg">
                Your Enterprise AI Workspace is ready. Select a module below to begin building.
              </p>
            </div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 bg-white dark:bg-neutral-950 p-4 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 shrink-0 cursor-default"
            >
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Weekly Activity</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalCalls.toLocaleString()} <span className="text-sm font-normal text-neutral-500">Calls</span></p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {ACTIONS.map((action) => (
            <motion.div key={action.id} variants={itemVariants}>
              <Card 
                onClick={() => navigate(action.path)}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
                className={`p-6 rounded-3xl shadow-sm cursor-pointer border transition-all duration-300 relative overflow-hidden group
                  ${hoveredAction === action.id 
                    ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-900 -translate-y-1 shadow-md' 
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
              >
          
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-20 bg-gradient-to-br ${action.color}`} />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${action.lightBg} ${action.iconColor}`}>
                  <action.icon size={22} />
                </div>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-neutral-500">{action.desc}</p>
                
                <div className="mt-4 flex items-center text-sm font-semibold text-neutral-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                  Launch Module <ArrowRight size={14} className="ml-1" />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="lg:col-span-2">
            <Card className="p-6 md:p-8 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-neutral-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" /> Recent Activity
                </h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/analytics')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-full px-4">
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {stats.recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-400 bg-neutral-50 dark:bg-neutral-950/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                     <Activity size={32} className="mb-3 opacity-20" />
                     <p className="text-sm font-medium">No recent activity.</p>
                     <p className="text-sm opacity-70">Start exploring the modules to see logs here.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {stats.recentActivity.map((log, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="group flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-white dark:bg-neutral-950/50 dark:hover:bg-neutral-900 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{log.action}</span>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5 tracking-wider">{log.module}</span>
                          </div>
                        </div>
                        <span className="text-sm text-neutral-500 font-mono bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-700">{log.time}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Resources & Shortcuts */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Card className="relative p-6 md:p-8 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm h-full overflow-hidden">
               
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="font-bold text-xl text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                <BookOpen size={20} className="text-blue-500" /> Quick Links
              </h2>
              
              <div className="space-y-3 relative z-10">
                {[
                  { name: "Reading List", path: "/dashboard/bookmarks", icon: Bookmark, color: "text-pink-500" },
                  { name: "Prompt Hub", path: "/dashboard/prompts", icon: Sparkles, color: "text-purple-500" },
                  { name: "My Documents", path: "/dashboard/documents", icon: FileText, color: "text-emerald-500" },
                  { name: "Analytics Dashboard", path: "/dashboard/analytics", icon: Activity, color: "text-blue-500" }
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => navigate(item.path)} 
                    className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className={`${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                      <span>{item.name}</span>
                    </div>

                    <ArrowRight size={14} className="text-neutral-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}