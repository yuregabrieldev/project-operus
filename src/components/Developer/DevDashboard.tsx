import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users, Building2, TrendingUp, TrendingDown, DollarSign,
    AlertTriangle, CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExpirationRow {
    id: string;
    brand: string;
    store: string;
    plan: string;
    dueDate: string;
    value: number;
}

const DevDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ pendingUsers: 0, pendingBrands: 0, activeBrands: 0, monthlyRevenue: 0, revenueChange: 0 });
    const [upcomingExpirations, setUpcomingExpirations] = useState<ExpirationRow[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date().toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [reqRes, brandsRes, licensesRes, invoicesRes] = await Promise.all([
                    supabase.from('registration_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('brands').select('id, stores_count'),
                    supabase.from('licenses').select('id, brand_id, name, status, periodicity, renewals, store_ids, created_at').eq('status', 'ativa'),
                    supabase.from('invoices').select('amount').gte('issue_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
                ]);
                if (cancelled) return;
                const pendingUsers = reqRes.count ?? 0;
                const brands = brandsRes.data ?? [];
                const activeBrands = brands.length;
                const monthlyRevenue = (invoicesRes.data ?? []).reduce((s, i) => s + (i.amount ?? 0), 0);
                setStats({
                    pendingUsers,
                    pendingBrands: 0,
                    activeBrands,
                    monthlyRevenue,
                    revenueChange: 0,
                });

                const licenses = licensesRes.data ?? [];
                const brandIds = [...new Set(licenses.map((l: any) => l.brand_id))];
                const { data: brandsData } = await supabase.from('brands').select('id, name').in('id', brandIds);
                const { data: storesData } = await supabase.from('stores').select('id, name, brand_id');
                const brandsMap = new Map((brandsData ?? []).map((b: any) => [b.id, b.name]));
                const storesMap = new Map((storesData ?? []).map((s: any) => [s.id, { name: s.name, brand_id: s.brand_id }]));

                const rows: ExpirationRow[] = [];
                for (const lic of licenses) {
                    const renewals = (lic.renewals as any[]) ?? [];
                    const nextRenewal = renewals.filter((r: any) => r.renewalDate).sort((a: any, b: any) => (a.renewalDate || '').localeCompare(b.renewalDate || ''))[0];
                    const dueDate = nextRenewal?.renewalDate || (lic as any).created_at?.slice(0, 10) || '';
                    const value = nextRenewal?.value ?? 0;
                    const storeIds = (lic.store_ids as string[]) ?? [];
                    const storeName = storeIds.length && storesMap.get(storeIds[0]) ? storesMap.get(storeIds[0])!.name : '-';
                    const periodicity = (lic as any).periodicity;
                    rows.push({
                        id: lic.id,
                        brand: brandsMap.get(lic.brand_id) ?? '-',
                        store: storeName,
                        plan: periodicity === 'anual' ? 'Anual' : periodicity === 'mensal' ? 'Mensal' : periodicity || 'Outro',
                        dueDate,
                        value,
                    });
                }
                rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
                setUpcomingExpirations(rows.slice(0, 20));
            } catch (_) {
                if (!cancelled) setStats(s => ({ ...s }));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    return (
        <div className="p-6 space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Olá {user?.name}, bom te ver novamente! 👋
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {today}
                </p>
            </div>

            {loading && (
                <p className="text-gray-500">A carregar dados...</p>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Solicitações de Registo</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingUsers}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Marcas Pendentes</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingBrands}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">(reservado)</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Marcas Ativas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeBrands}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Receita Mensal</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.monthlyRevenue)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {stats.revenueChange >= 0 ? (
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                    <span className={`text-xs font-semibold ${stats.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                                    </span>
                                    <span className="text-xs text-gray-400">vs mês anterior</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Expirations */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Próximos Vencimentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left p-3 font-semibold text-gray-600">Marca</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Loja</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Plano</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Vencimento</th>
                                <th className="text-right p-3 font-semibold text-gray-600">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingExpirations.length === 0 && !loading && (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhum vencimento próximo</td></tr>
                            )}
                            {upcomingExpirations.map(item => {
                                const dueDate = new Date(item.dueDate + 'T12:00:00');
                                const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={item.id} className="border-b hover:bg-gray-50/50">
                                        <td className="p-3 font-medium">{item.brand}</td>
                                        <td className="p-3 text-gray-600">{item.store}</td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className={item.plan === 'Anual' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                                {item.plan}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>{item.dueDate ? dueDate.toLocaleDateString('pt-PT') : '-'}</span>
                                                {item.dueDate && daysUntil <= 30 && (
                                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                                        {daysUntil <= 0 ? 'Vencido' : `${daysUntil}d`}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-semibold">{item.value ? fmt(item.value) : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default DevDashboard;
