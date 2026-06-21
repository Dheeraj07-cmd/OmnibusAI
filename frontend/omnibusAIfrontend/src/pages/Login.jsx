import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault(); setIsLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.token, { email }); navigate('/dashboard');
    }
    catch (err) {
      setError('Invalid credentials.');
    }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 relative overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-72 md:w-96 h-72 md:h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 md:w-96 h-72 md:h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10">
        <Card className="border-white/10 dark:border-neutral-800 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 rounded-[2rem] p-4 md:p-8">

          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-sm">Sign in to your OmnibusAI workspace</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required className="h-11 text-sm rounded-xl" /></div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Link to="/register" className="text-xs font-semibold text-blue-600 hover:text-blue-500">Need an account?</Link>
                </div>
                <Input id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required className="h-11 text-sm rounded-xl" />
              </div>

              {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-11 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                disabled={isLoading}>{isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

        </Card>
      </motion.div>
    </div>
  );
}