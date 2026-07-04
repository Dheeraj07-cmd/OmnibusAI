import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import Research from './pages/Research';
import Files from './pages/Files';
import CodeWorkspace from './pages/CodeWorkspace';
import Bookmarks from './pages/Bookmarks';
import DashboardHome from './pages/DashboardHome';
import Analytics from './pages/Analytics';
import PromptLibrary from './pages/PromptLibrary';

// Protects internal routes from logged-out users
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Protects auth routes from logged-in users
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Placeholder for unbuilt modules
const PlaceholderPage = ({ title }) => (
  <div className="h-full w-full flex items-center justify-center p-8">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">{title}</h1>
      <p className="text-neutral-500">Module under construction.</p>
    </div>
  </div>
);

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="chat" element={<Chat />} />
          <Route path="prompts" element={<PromptLibrary />} />
          <Route path="research" element={<Research />} />
          <Route path="documents" element={<Documents />} />
          <Route path="files" element={<Files />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="code" element={<CodeWorkspace />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;