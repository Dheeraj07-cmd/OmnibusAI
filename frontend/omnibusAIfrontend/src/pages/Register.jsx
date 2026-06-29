import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Email might already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 relative overflow-hidden">

      <motion.div animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]" />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-[460px] z-10 my-8">
        <Card className="border-white/20 dark:border-neutral-800/50 shadow-2xl backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/70 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <CardHeader className="space-y-3 text-center pb-8 pt-4 px-0">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-16 h-16 bg-neutral-900 dark:bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-3">
              <ShieldCheck size={28} className="text-white dark:text-neutral-900 rotate-3" />
            </motion.div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Create Account</CardTitle>
            <CardDescription className="text-neutral-500 font-medium">Join the next generation of AI workspaces.</CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleRegister} className="space-y-5">

              <div className="grid grid-cols-1 gap-5">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === 'name' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}>Full Name</Label>
                  <div className="relative group">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'name' ? 'text-purple-500' : 'text-neutral-400'}`} size={16} />
                    <Input
                      id="name" type="text" placeholder="John Doe"
                      value={name} onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                      required
                      className="pl-10 h-11 text-sm rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-purple-500 shadow-sm transition-all"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === 'email' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}>Email</Label>
                  <div className="relative group">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-purple-500' : 'text-neutral-400'}`} size={16} />
                    <Input
                      id="email" type="email" placeholder="name@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      required
                      className="pl-10 h-11 text-sm rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-purple-500 shadow-sm transition-all"
                    />
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === 'password' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}>Password</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-purple-500' : 'text-neutral-400'}`} size={16} />
                    <Input
                      id="password" type="password" placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                      required
                      className="pl-10 h-11 text-sm rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-purple-500 shadow-sm transition-all"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="confirmPassword" className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === 'confirm' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-500'}`}>Confirm</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'confirm' ? 'text-purple-500' : 'text-neutral-400'}`} size={16} />
                    <Input
                      id="confirmPassword" type="password" placeholder="••••••••"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                      required
                      className="pl-10 h-11 text-sm rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-purple-500 shadow-sm transition-all"
                    />
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4">
                <Button type="submit" disabled={isLoading || !name || !email || !password} className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-white font-semibold text-base h-12 rounded-2xl shadow-xl transition-all relative overflow-hidden group">
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Create Account <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center mt-6">
                <span className="text-sm text-neutral-500 font-medium">Already have an account? </span>
                <Link to="/login" className="text-sm font-bold text-purple-600 hover:text-purple-500 transition-colors">Sign in</Link>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}