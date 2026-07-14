import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Palette, CreditCard, Globe, Check, Loader2, Sparkles, Info, AlertTriangle, Trash2, ExternalLink, Camera } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ThemeToggle from '../components/ThemeToggle';
import { Link } from 'react-router-dom';

export default function SettingsModal({ isOpen, onClose }) {
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [region, setRegion] = useState(localStorage.getItem('omnibus_region') || 'US-East (N. Virginia)');
    const fileInputRef = useRef(null);
    const toastTimeoutRef = useRef(null);

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.isTwoFactorEnabled || false);
    const [twoFactorSetup, setTwoFactorSetup] = useState(null);
    const [otpCode, setOtpCode] = useState('');

    const triggerToast = (message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type });
        toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/user/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data && res.data.profilePicture) {
                useAuthStore.setState((state) => ({ user: { ...state.user, profilePicture: res.data.profilePicture } }));
                triggerToast('Avatar updated successfully!', 'success');
            }
        } catch (error) {
            triggerToast(error.response?.data?.message || 'Failed to upload image.', 'error');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 2FA Setup Flow
    const handleInit2FA = async () => {
        setIsSaving(true);
        try {
            const res = await api.post('/user/2fa/generate');
            setTwoFactorSetup(res.data);
        } catch (error) {
            triggerToast('Failed to generate 2FA setup.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerify2FA = async () => {
        setIsSaving(true);
        try {
            await api.post('/user/2fa/verify', { code: parseInt(otpCode) });
            setTwoFactorEnabled(true);
            setTwoFactorSetup(null);
            setOtpCode('');
            useAuthStore.setState((state) => ({ user: { ...state.user, isTwoFactorEnabled: true } }));
            triggerToast('Two-Factor Authentication Enabled!', 'success');
        } catch (error) {
            triggerToast('Invalid OTP Code.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisable2FA = async () => {
        setIsSaving(true);
        try {
            await api.post('/user/2fa/disable');
            setTwoFactorEnabled(false);
            useAuthStore.setState((state) => ({ user: { ...state.user, isTwoFactorEnabled: false } }));
            triggerToast('2FA Disabled.', 'success');
        } catch (error) {
            triggerToast('Failed to disable 2FA.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (activeTab === 'profile') {
                const newName = e.target.profileName.value;
                await api.put('/user/profile', { name: newName });
                useAuthStore.setState((state) => ({ user: { ...state.user, name: newName } }));
                triggerToast('Profile updated successfully!', 'success');
            }
            else if (activeTab === 'security') {
                const currentPassword = e.target.currentPassword.value;
                const newPassword = e.target.newPassword.value;
                const confirmPassword = e.target.confirmPassword.value;

                if (newPassword !== confirmPassword) {
                    triggerToast("New passwords do not match!", 'error');
                    setIsSaving(false);
                    return;
                }

                await api.put('/user/password', { currentPassword, newPassword });
                e.target.reset();
                triggerToast('Password changed securely.', 'success');
            }
            else if (activeTab === 'preferences') {
                localStorage.setItem('omnibus_region', region);
                triggerToast('Preferences saved successfully!', 'success');
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            triggerToast(error.response?.data?.message || "Failed to update settings.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsSaving(true);
        try {
            await api.delete('/user/account');
            useAuthStore.getState().logout();
            window.location.href = '/login';
        } catch (error) {
            triggerToast("Failed to delete account. Ensure all processes are stopped.", 'error');
            setShowDeleteConfirm(false);
        } finally {
            setIsSaving(false);
        }
    };

    const SETTINGS_TABS = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Palette },
        { id: 'plan', label: 'Billing & Plan', icon: CreditCard },
        { id: 'about', label: 'About', icon: Info },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" />

                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[600px] border border-neutral-200 dark:border-neutral-800">

                        <AnimatePresence>
                            {toast && (
                                <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 16, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
                                    className={`absolute top-0 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border text-sm font-semibold whitespace-nowrap ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/80 dark:text-red-400 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-900/50'}`}>
                                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />} {toast.message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-500 transition-colors z-20 cursor-pointer">
                            <X size={18} />
                        </button>

                        <div className="w-full md:w-64 bg-neutral-50 dark:bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 p-6 shrink-0 flex flex-col">
                            <h2 className="text-xl font-extrabold tracking-tight mb-6">
                                Settings
                            </h2>
                            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
                                {SETTINGS_TABS.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
                                            {isActive && <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 w-1 h-full bg-blue-600 rounded-r-full hidden md:block" />}
                                            <tab.icon size={18} /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white dark:bg-neutral-900 relative custom-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.form key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleSaveSettings} className="space-y-8">

                                    {/* Profile Tab */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-6">
                                            <div><h3 className="text-2xl font-bold">My Profile</h3><p className="text-sm text-neutral-500 mt-1">
                                                Manage your personal information.
                                            </p>
                                            </div>

                                            <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                                {user?.profilePicture ? (
                                                    <img src={user.profilePicture} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-inner border border-neutral-200 dark:border-neutral-800" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-inner uppercase">
                                                        {user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                )}

                                                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarUpload} />
                                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()} disabled={isUploadingAvatar} className="h-8 text-xs font-semibold cursor-pointer shadow-sm">
                                                    {isUploadingAvatar ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Camera size={14} className="mr-1.5" />}
                                                    {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Full Name</Label>
                                                    <Input name="profileName" defaultValue={user?.name || ''} required className="h-11 bg-neutral-50 dark:bg-neutral-950" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</Label>
                                                    <Input defaultValue={user?.email || ''} type="email" className="h-11 bg-neutral-50 dark:bg-neutral-950 text-neutral-400 cursor-not-allowed" readOnly />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Tab */}
                                    {activeTab === 'security' && (
                                        <div className="space-y-8">
                                            <div><h3 className="text-2xl font-bold">Security</h3><p className="text-sm text-neutral-500 mt-1">Protect your account and manage active sessions.</p></div>

                                            <div className="space-y-4 max-w-md">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Password</Label>
                                                    <Input name="currentPassword" type="password" placeholder="••••••••" required className="h-11 bg-neutral-50 dark:bg-neutral-950" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Password</Label>
                                                    <Input name="newPassword" type="password" placeholder="••••••••" required className="h-11 bg-neutral-50 dark:bg-neutral-950" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Confirm New Password</Label>
                                                    <Input name="confirmPassword" type="password" placeholder="••••••••" required className="h-11 bg-neutral-50 dark:bg-neutral-950" />
                                                </div>
                                            </div>

                                            {/* 2FA Setup Flow */}
                                            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">
                                                    Two-Factor Authentication
                                                </h4>

                                                {!twoFactorSetup ? (
                                                    <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 mt-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'}`}><Shield size={18} /></div>
                                                            <div>
                                                                <p className="font-semibold text-sm">Authenticator App</p>
                                                                <p className="text-xs text-neutral-500">{twoFactorEnabled ? 'Currently Enabled' : 'Not Configured'}</p>
                                                            </div>
                                                        </div>
                                                        <Button type="button" onClick={twoFactorEnabled ? handleDisable2FA : handleInit2FA} variant={twoFactorEnabled ? 'destructive' : 'default'} size="sm" disabled={isSaving} className="text-xs font-bold cursor-pointer shadow-sm">
                                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : (twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 border border-blue-200 dark:border-blue-900/50 rounded-2xl bg-blue-50 dark:bg-blue-950/20 mt-4 space-y-4">
                                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Scan this QR code with Google Authenticator or Authy</p>
                                                        <img src={twoFactorSetup.qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 rounded-xl border-4 border-white shadow-sm" />
                                                        <div className="flex gap-2">
                                                            <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className="max-w-[150px] h-10 text-center tracking-widest font-mono" maxLength={6} />
                                                            <Button type="button" onClick={handleVerify2FA} disabled={otpCode.length !== 6 || isSaving} className="h-10 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm shadow-blue-500/20">
                                                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Enable'}
                                                            </Button>
                                                            <Button type="button" variant="ghost"
                                                                onClick={() => { setTwoFactorSetup(null); setOtpCode(''); }}
                                                                disabled={isSaving} className="h-10 cursor-pointer">
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-red-100 dark:border-red-900/30">
                                                <div className="p-5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div><h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
                                                        <AlertTriangle size={16} /> Danger Zone
                                                    </h4>
                                                        <p className="text-xs text-red-500/80 dark:text-red-400/80">
                                                            Permanently delete your account and all data.
                                                        </p>
                                                    </div>
                                                    <Button type="button" onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-9 shrink-0 shadow-md border-0 cursor-pointer shadow-red-500/20">
                                                        <Trash2 size={14} className="mr-1.5" /> Delete Account
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preferance Tab */}
                                    {activeTab === 'preferences' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-bold">Preferences</h3>
                                                <p className="text-sm text-neutral-500 mt-1">Customize your workspace experience.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                                                    <div>
                                                        <p className="font-semibold text-neutral-900 dark:text-white">Theme & Appearance</p>
                                                        <p className="text-xs text-neutral-500">Toggle light/dark mode.</p>
                                                    </div>
                                                    <ThemeToggle />
                                                </div>

                                                <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-950">
                                                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">Server Location</p>
                                                    <p className="text-xs text-neutral-500 mb-4">Choose the closest AI proxy server for faster response times.</p>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                                        <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full pl-10 h-11 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
                                                            <option value="US-East (N. Virginia)">US-East (N. Virginia)</option>
                                                            <option value="US-West (Oregon)">US-West (Oregon)</option>
                                                            <option value="EU-Central (Frankfurt)">EU-Central (Frankfurt)</option>
                                                            <option value="AP-South (Mumbai)">AP-South (Mumbai)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* About Tab */}
                                    {activeTab === 'about' && (
                                        <div className="space-y-6">
                                            <div><h3 className="text-2xl font-bold">About OmnibusAI</h3>
                                                <p className="text-sm text-neutral-500 mt-1">System information and legal resources.</p>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center text-center"><p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Version</p><p className="text-lg font-mono font-bold text-neutral-900 dark:text-white">v1.0.0</p></div>
                                                <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center text-center"><p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Build</p><p className="text-lg font-mono font-bold text-neutral-900 dark:text-white">2026.07.09</p></div>
                                                <div className="col-span-2 md:col-span-1 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center text-center"><p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">License</p><p className="text-sm font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md dark:bg-blue-900/30 dark:text-blue-400">MIT</p></div>
                                            </div>

                                            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900">
                                                <Link to="/releases" target="_blank" className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors group border-b border-neutral-100 dark:border-neutral-800">
                                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 transition-colors">Release Notes</span>
                                                    <ExternalLink size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                                </Link>

                                                <Link to="/privacy" target="_blank" className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors group border-b border-neutral-100 dark:border-neutral-800">
                                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 transition-colors">Privacy Policy</span>
                                                    <ExternalLink size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                                </Link>

                                                <Link to="/terms" target="_blank" className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors group border-b border-neutral-100 dark:border-neutral-800">
                                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 transition-colors">Terms of Service</span>
                                                    <ExternalLink size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                                </Link>

                                                <a href="https://github.com/Dheeraj07-cmd/OmnibusAI" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors group">
                                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 transition-colors">GitHub Repository</span>
                                                    <ExternalLink size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Plan Tab */}
                                    {activeTab === 'plan' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-bold">Billing & Plan</h3>
                                                <p className="text-sm text-neutral-500 mt-1">Manage your enterprise subscription.</p>
                                            </div>
                                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-black text-white shadow-xl overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-20"><Sparkles size={100} /></div>
                                                <div className="relative z-10">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">Current Plan</span>
                                                    <h4 className="text-3xl font-extrabold mb-1">Developer Free</h4>
                                                    <p className="text-sm text-neutral-400 mb-6 max-w-sm">Standard rate limits applied.</p>
                                                    <Button type="button" className="bg-white text-black hover:bg-neutral-200 font-bold rounded-xl shadow-lg border-0 cursor-pointer">Upgrade</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Save Button */}
                                    {activeTab !== 'plan' && activeTab !== 'about' && (
                                        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end sticky bottom-0 bg-white dark:bg-neutral-900 pb-2 z-10">
                                            <Button type="submit" disabled={isSaving || saved} className={`h-11 px-8 rounded-xl font-bold shadow-md cursor-pointer ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}>
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} className="mr-2" /> Saved</> : 'Save Changes'}
                                            </Button>
                                        </div>
                                    )}

                                </motion.form>
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md p-6">
                                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                                        </div>

                                        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">Delete Account?</h3>
                                        <p className="text-sm text-neutral-500 mb-8">This action cannot be undone. All your chats, files, and settings will be permanently erased.</p>

                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl h-11 cursor-pointer">Cancel</Button>
                                            <Button type="button" onClick={handleDeleteAccount} disabled={isSaving} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 cursor-pointer shadow-md">
                                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}