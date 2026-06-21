import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
// Protects internal routes from logged-out users
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
        {/* Public Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;