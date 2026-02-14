
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users, Building2, TrendingUp, TrendingDown, Clock, DollarSign,
    AlertTriangle, CalendarDays
} from 'lucide-react';

const DevDashboard: React.FC = () => {
    const { user } = useAuth();

    const today = new Date().toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Demo data
    const stats = {
        pendingUsers: 5,
        pendingBrands: 3,
        activeBrands: 12,
        monthlyRevenue: 18750,
        revenueChange: 12.5,
    };

    const upcomingExpirations = [
        { id: '1', brand: 'Oakberry', store: 'Alvalade', plan: 'Business', dueDate: '2026-03-01', value: 149.90 },
        { id: '2', brand: 'Spike', store: 'Saldanha', plan: 'Starter', dueDate: '2026-02-28', value: 49.90 },
        { id: '3', brand: 'Green Bowl', store: 'Rossio', plan: 'Business', dueDate: '2026-03-05', value: 149.90 },
        { id: '4', brand: 'Oakberry', store: 'Rossio', plan: 'Business', dueDate: '2026-03-10', value: 149.90 },
        { id: '5', brand: 'Green Bowl', store: 'Colombo', plan: 'Starter', dueDate: '2026-03-15', value: 49.90 },
    ];

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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Usuários Pendentes</p>
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
                            {upcomingExpirations.map(item => {
                                const dueDate = new Date(item.dueDate + 'T12:00:00');
                                const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={item.id} className="border-b hover:bg-gray-50/50">
                                        <td className="p-3 font-medium">{item.brand}</td>
                                        <td className="p-3 text-gray-600">{item.store}</td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className={item.plan === 'Business' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                                {item.plan}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>{dueDate.toLocaleDateString('pt-PT')}</span>
                                                {daysUntil <= 7 && (
                                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                                        {daysUntil <= 0 ? 'Vencido' : `${daysUntil}d`}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-semibold">{fmt(item.value)}</td>
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
