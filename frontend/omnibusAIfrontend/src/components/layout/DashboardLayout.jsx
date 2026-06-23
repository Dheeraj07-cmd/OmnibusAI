import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-screen bg-white dark:bg-neutral-900 overflow-hidden text-neutral-900 dark:text-neutral-50">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}