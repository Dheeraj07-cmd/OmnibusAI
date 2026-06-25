import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Activity, MessageSquare, Search, BookOpen, FileText, Bookmark, Settings, PanelLeftClose, PanelLeft, LogOut, Plus, Code2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '@/components/ui/button';
import ThemeToggle from '../ThemeToggle'; 

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768) setIsCollapsed(true); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Chat', icon: MessageSquare, path: '/dashboard/chat' },
    { name: 'Research', icon: Search, path: '/dashboard/research' },
    { name: 'Documents', icon: FileText, path: '/dashboard/documents' },
  ];

  return (
    <>
      {!isCollapsed && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs" onClick={() => setIsCollapsed(true)} />}
      <motion.div initial={false} animate={{ width: isCollapsed ? 80 : 260 }} className="fixed md:relative left-0 top-0 h-screen bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 z-50 shrink-0 shadow-2xl md:shadow-none">
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          {!isCollapsed && <span className="font-bold text-lg tracking-tight truncate">OmnibusAI</span>}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto">
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </Button>
        </div>
        <div className="p-4">
          <Button onClick={() => { navigate('/dashboard/chat'); if (window.innerWidth < 768) setIsCollapsed(true); }} className={`w-full justify-start ${isCollapsed ? 'px-0 justify-center' : ''}`}>
            <Plus size={20} className={!isCollapsed ? 'mr-2' : ''} />
            {!isCollapsed && <span>New Thread</span>}
          </Button>
        </div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.name} to={item.path} onClick={() => { if (window.innerWidth < 768) setIsCollapsed(true); }} className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'}`}>
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          {/* Settings & Logout */}
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" className={`w-full justify-start ${isCollapsed ? 'px-0 justify-center' : ''}`}>
              <Settings size={20} className={!isCollapsed ? 'mr-2' : ''} /> {!isCollapsed && <span>Settings</span>}
            </Button>

            <Button variant="ghost" onClick={handleLogout} className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 justify-start ${isCollapsed ? 'px-0 justify-center' : ''}`}>
              <LogOut size={20} className={!isCollapsed ? 'mr-2' : ''} /> {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>

          {/* Theme Toggle */}
          <div className={`pt-2 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
            <ThemeToggle />
          </div>

        </div>
      </motion.div>
    </>
  );
}