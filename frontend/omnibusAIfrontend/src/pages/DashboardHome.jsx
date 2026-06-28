import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Database, Bookmark, ArrowRight, MessageSquare, Code2, Search, Activity, Sparkles } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Card } from '@/components/ui/card';

export default function DashboardHome() {
  const [stats, setStats] = useState({ documents: 0, files: 0, bookmarks: 0, activePlan: 'Loading...' });
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickLinks = [
    { name: "Start a Chat", icon: <MessageSquare size={20} />, path: "/dashboard/chat", color: "bg-blue-500", text: "text-blue-500" },
    { name: "Write Code", icon: <Code2 size={20} />, path: "/dashboard/code", color: "bg-green-500", text: "text-green-500" },
    { name: "Deep Research", icon: <Search size={20} />, path: "/dashboard/research", color: "bg-purple-500", text: "text-purple-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-10">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold tracking-wide uppercase mb-3">
              <Sparkles size={14} /> {stats.activePlan}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Welcome back, {user?.email ? user.email.split('@')[0] : 'Engineer'}
            </h1>
            <p className="text-neutral-500 mt-2">Here is what is happening in your workspace today.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4 rounded-3xl">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                <FileText size={28} />
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-500">Total Documents</p>
                <h3 className="text-3xl font-bold">{isLoading ? '-' : stats.documents}</h3>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4 rounded-3xl">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                <Database size={28} />
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-500">Files Stored</p>
                <h3 className="text-3xl font-bold">{isLoading ? '-' : stats.files}</h3>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4 rounded-3xl">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                <Bookmark size={28} />
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-500">Saved Bookmarks</p>
                <h3 className="text-3xl font-bold">{isLoading ? '-' : stats.bookmarks}</h3>
              </div>
            </Card>
          </motion.div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-neutral-400" size={20} />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.05) }} whileHover={{ y: -5 }}>
                <Link to={link.path}>

                  <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-all group rounded-3xl">
                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-opacity-10 dark:bg-opacity-20 ${link.text} bg-current`}>
                      {link.icon}
                    </div>

                    <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-500 transition-colors">{link.name}</h3>
                    <p className="text-sm text-neutral-500 flex items-center gap-1">
                      Launch module <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}