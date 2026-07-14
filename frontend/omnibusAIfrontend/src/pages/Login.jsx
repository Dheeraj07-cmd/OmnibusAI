import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, CornerDownLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });

      // Check if 2FA is Required
      if (res.data.requires2FA) {
        setNeeds2FA(true);
        setIsLoading(false);
        return;
      }

      // If no 2FA required, login normally
      setAuth(res.data.token, {
        email: res.data.email,
        name: res.data.name,
        profilePicture: res.data.profilePicture,
        isTwoFactorEnabled: res.data.isTwoFactorEnabled
      });
      navigate('/dashboard');
    }
    catch (err) {
      setError('Invalid email or password.');
      setIsLoading(false);
    }
  };


  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-2fa', { email, code: parseInt(otpCode) });
      setAuth(res.data.token, { email: res.data.email, name: res.data.name, profilePicture: res.data.profilePicture, isTwoFactorEnabled: res.data.isTwoFactorEnabled });
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid Authenticator Code.');
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 relative overflow-hidden">

      <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]" />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-[420px] z-10">
        <Card className="border-white/20 dark:border-neutral-800/50 shadow-2xl backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Show Password Form OR 2FA Form */}
          <AnimatePresence mode="wait">
            {!needs2FA ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <CardHeader className="space-y-3 text-center pb-8 pt-4 px-0">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
                    <span className="text-3xl text-white font-black -rotate-3">O</span>
                  </div>
                  <CardTitle className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Welcome Back</CardTitle>
                  <CardDescription className="text-neutral-500 font-medium">Sign in to your Enterprise AI Workspace</CardDescription>
                </CardHeader>

                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className={`text-sm font-semibold transition-colors ${focusedField === 'email' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Email</Label>
                      <div className="relative group">
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-blue-500' : 'text-neutral-400'}`} size={18} />
                        <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} required className="pl-11 h-12 text-sm rounded-2xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 shadow-sm transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className={`text-sm font-semibold transition-colors ${focusedField === 'password' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Password</Label>
                        <Link to="/register" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">Create account</Link>
                      </div>
                      <div className="relative group">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-blue-500' : 'text-neutral-400'}`} size={18} />
                        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} required className="pl-11 h-12 text-sm rounded-2xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 shadow-sm transition-all" />
                      </div>
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}

                    <div className="pt-2">
                      <Button type="submit" disabled={isLoading || !email || !password} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12 rounded-2xl shadow-xl shadow-blue-500/20 transition-all relative overflow-hidden group cursor-pointer">
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </motion.div>
            ) : (
              // 2FA
              <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <CardHeader className="space-y-3 text-center pb-8 pt-4 px-0">
                  <div className="w-16 h-16 bg-neutral-900 dark:bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-3">
                    <ShieldCheck size={28} className="text-white dark:text-neutral-900 rotate-3" />
                  </div>
                  <CardTitle className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Two-Factor Auth</CardTitle>
                  <CardDescription className="text-neutral-500 font-medium">Enter the 6-digit code from your authenticator app.</CardDescription>
                </CardHeader>

                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Authenticator Code</Label>
                      <Input id="otp" type="text" placeholder="123456" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} required className="h-14 text-2xl tracking-[0.5em] text-center font-mono rounded-2xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 shadow-sm transition-all" autoFocus />
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}

                    <div className="pt-2 flex flex-col gap-3">
                      <Button type="submit" disabled={isLoading || otpCode.length !== 6} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12 rounded-2xl shadow-xl shadow-blue-500/20 transition-all cursor-pointer">
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                      </Button>

                      <Button type="button" variant="ghost" onClick={() => { setNeeds2FA(false); setOtpCode(''); setError(''); }} className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer h-10">
                        <CornerDownLeft size={14} className="mr-1.5" /> Back to Login
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}