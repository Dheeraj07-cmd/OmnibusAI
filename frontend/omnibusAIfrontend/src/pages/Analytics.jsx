import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Server, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import api from '../lib/api';

export default function Analytics() {
    const [data, setData] = useState({
        totalTokens: 0,
        totalCalls: 0,
        tokenData: [],
        apiData: [],
        recentActivity: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics');
                setData(res.data);
            } catch (error) {
                console.error("Failed to load live analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full space-y-8">

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="text-blue-500" /> Platform Analytics
                    </h1>
                    <p className="text-xs md:text-sm text-neutral-500 mt-1">Live metrics tracking your API requests and usage over the last 7 days.</p>
                </motion.div>

                {/* Top Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Zap size={20} /></div>
                                <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full"><ArrowUpRight size={14} className="mr-1" /> Live</span>
                            </div>
                            <p className="text-sm font-medium text-neutral-500">Total Tokens Used</p>
                            <h3 className="text-3xl font-bold mt-1">{data.totalTokens.toLocaleString()}</h3>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <   Server size={20} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-neutral-500">Total API Requests</p>
                            <h3 className="text-3xl font-bold mt-1">{data.totalCalls}</h3>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-neutral-500">System Status</p>
                            <h3 className="text-xl font-bold mt-2 text-emerald-500">Operational</h3>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm h-[350px] flex flex-col">
                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-6">
                                Token Consumption (Last 7 Days)
                            </h3>
                            <div className="flex-1 w-full h-full min-h-62.5">
                                {data.tokenData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                        <LineChart data={data.tokenData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} vertical={false} />
                                            <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#3b82f6' }} />
                                            <Line type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-neutral-500 text-sm">No token data yet.</div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm h-[350px] flex flex-col">
                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-6">API Calls by Module</h3>
                            <div className="flex-1 w-full h-full min-h-62.5">
                                {data.apiData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                        <BarChart data={data.apiData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} vertical={false} />
                                            <XAxis dataKey="module" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#3f3f46', opacity: 0.1 }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} />
                                            <Bar dataKey="calls" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-neutral-500 text-sm">No API call data yet.</div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Recent Activity Table */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm">
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">System Activity Log</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 font-medium rounded-tl-lg">Action</th>
                                        <th className="px-4 py-3 font-medium">Module</th>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                        <th className="px-4 py-3 font-medium rounded-tr-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {data.recentActivity.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-neutral-500">No recent activity found.</td>
                                        </tr>
                                    ) : (
                                        data.recentActivity.map((log, index) => (
                                            <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{log.action}</td>
                                                <td className="px-4 py-3 text-neutral-500">{log.module}</td>
                                                <td className="px-4 py-3 text-neutral-500">{log.time}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
}