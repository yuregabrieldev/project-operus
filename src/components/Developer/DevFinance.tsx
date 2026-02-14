
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, Clock,
    Search, Eye, Mail, Bell, BarChart3, ArrowUpRight, Users, Repeat
} from 'lucide-react';

type PaymentStatus = 'late' | 'pending' | 'paid';
type FinanceTab = 'financas' | 'receitas';

interface DemoPayment {
    id: string;
    storeName: string;
    brandName: string;
    plan: string;
    value: number;
    dueDate: string;
    responsible: string;
    status: PaymentStatus;
}

const DevFinance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FinanceTab>('financas');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailTarget, setEmailTarget] = useState<DemoPayment | null>(null);

    const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    const stats = {
        revenue: 18750,
        revenueChange: 12.5,
        recurringRevenue: 15200,
        recurringChange: 8.3,
        avgTicket: 112.50,
        avgTicketChange: -2.1,
        pendingPayments: 4,
        latePayments: 2,
        activeSubscriptions: 18,
        churnRate: 2.1,
        arpu: 1041.67,
        arpuChange: 5.4,
    };

    const payments: DemoPayment[] = [
        { id: '1', storeName: 'Alvalade', brandName: 'Oakberry', plan: 'Business', value: 149.90, dueDate: '2026-01-15', responsible: 'João Silva', status: 'late' },
        { id: '2', storeName: 'Saldanha', brandName: 'Spike', plan: 'Business', value: 149.90, dueDate: '2026-02-01', responsible: 'Carlos Mendes', status: 'late' },
        { id: '3', storeName: 'Colombo', brandName: 'Oakberry', plan: 'Starter', value: 49.90, dueDate: '2026-02-15', responsible: 'João Silva', status: 'pending' },
        { id: '4', storeName: 'Amoreiras', brandName: 'Green Bowl', plan: 'Starter', value: 49.90, dueDate: '2026-02-20', responsible: 'Sofia Oliveira', status: 'pending' },
        { id: '5', storeName: 'Rossio', brandName: 'Oakberry', plan: 'Business', value: 149.90, dueDate: '2026-02-10', responsible: 'João Silva', status: 'paid' },
        { id: '6', storeName: 'Benfica', brandName: 'Spike', plan: 'Starter', value: 49.90, dueDate: '2026-02-05', responsible: 'Carlos Mendes', status: 'paid' },
    ];

    const revenueMonthly = [
        { month: 'Set', value: 12400 },
        { month: 'Out', value: 13800 },
        { month: 'Nov', value: 14500 },
        { month: 'Dez', value: 16200 },
        { month: 'Jan', value: 16900 },
        { month: 'Fev', value: 18750 },
    ];
    const maxRevenue = Math.max(...revenueMonthly.map(r => r.value));

    const sortedPayments = [...payments].sort((a, b) => {
        const order: Record<PaymentStatus, number> = { late: 0, pending: 1, paid: 2 };
        return order[a.status] - order[b.status];
    });

    const filtered = sortedPayments.filter(p => {
        const matchSearch = !searchTerm || p.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || p.brandName.toLowerCase().includes(searchTerm.toLowerCase()) || p.responsible.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusBadge = (status: PaymentStatus) => {
        const styles = { late: 'bg-red-100 text-red-700 border-red-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', paid: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        const labels = { late: 'Atrasado', pending: 'Pendente', paid: 'Pago' };
        return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
    };

    const handleSendEmail = () => {
        setShowEmailDialog(false);
        toast({ title: 'Email enviado!', description: `Cobrança enviada para ${emailTarget?.responsible}` });
        setEmailTarget(null);
    };

    const handleNotifyAllLate = () => {
        const lateCount = payments.filter(p => p.status === 'late').length;
        toast({ title: 'Notificações enviadas!', description: `${lateCount} emails de cobrança enviados para pagamentos atrasados` });
    };

    const changeIndicator = (change: number) => (
        <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-gray-400">vs mês anterior</span>
        </div>
    );

    const renderFinancasTab = () => (
        <>
            {/* Finance Stats (only pending/late) */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase">Pagamentos Pendentes</p>
                                <p className="text-3xl font-bold mt-1">{stats.pendingPayments}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-red-50 to-rose-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-red-600 uppercase">Pagamentos Atrasados</p>
                                <p className="text-3xl font-bold mt-1">{stats.latePayments}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Pesquisar loja, marca ou responsável..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" placeholder="De" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" placeholder="Até" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="late">Atrasados</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" className="gap-2" onClick={handleNotifyAllLate}>
                    <Bell className="h-3.5 w-3.5" /> Notificar Atrasados
                </Button>
            </div>

            {/* Payments Table */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" /> Gestão de Pagamentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left p-3 font-semibold text-gray-600">Loja</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Plano</th>
                                <th className="text-right p-3 font-semibold text-gray-600">Valor</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Vencimento</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Responsável</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(payment => (
                                <tr key={payment.id} className={`border-b hover:bg-gray-50/50 ${payment.status === 'late' ? 'bg-red-50/30' : ''}`}>
                                    <td className="p-3">
                                        <div>
                                            <p className="font-medium">{payment.storeName}</p>
                                            <p className="text-xs text-gray-400">{payment.brandName}</p>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant="outline" className={payment.plan === 'Business' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                            {payment.plan}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right font-semibold">{fmt(payment.value)}</td>
                                    <td className="p-3 text-center text-gray-600">{new Date(payment.dueDate + 'T12:00:00').toLocaleDateString('pt-PT')}</td>
                                    <td className="p-3 text-gray-600">{payment.responsible}</td>
                                    <td className="p-3 text-center">{statusBadge(payment.status)}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Enviar cobrança" onClick={() => { setEmailTarget(payment); setShowEmailDialog(true); }}>
                                                <Mail className="h-3.5 w-3.5 text-blue-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );

    const renderReceitasTab = () => (
        <>
            {/* Revenue Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase">Receita Total</p>
                                <p className="text-xl font-bold mt-1">{fmt(stats.revenue)}</p>
                                {changeIndicator(stats.revenueChange)}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-600 uppercase">Receita Recorrente</p>
                                <p className="text-xl font-bold mt-1">{fmt(stats.recurringRevenue)}</p>
                                {changeIndicator(stats.recurringChange)}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Repeat className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-purple-600 uppercase">Ticket Médio</p>
                                <p className="text-xl font-bold mt-1">{fmt(stats.avgTicket)}</p>
                                {changeIndicator(stats.avgTicketChange)}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-teal-600 uppercase">ARPU</p>
                                <p className="text-xl font-bold mt-1">{fmt(stats.arpu)}</p>
                                {changeIndicator(stats.arpuChange)}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue extra metrics */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-indigo-600 uppercase">Subscrições Ativas</p>
                                <p className="text-3xl font-bold mt-1">{stats.activeSubscriptions}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-rose-50 to-pink-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-rose-600 uppercase">Taxa de Churn</p>
                                <p className="text-3xl font-bold mt-1">{stats.churnRate}%</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-600" /> Evolução de Receita Mensal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-3 h-52">
                        {revenueMonthly.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">{fmt(item.value)}</span>
                                <div
                                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500"
                                    style={{ height: `${(item.value / maxRevenue) * 100}%`, minHeight: '12px' }}
                                />
                                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Revenue by Plan */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" /> Receita por Plano
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Business</Badge>
                                    <span className="text-sm text-gray-500">12 lojas</span>
                                </div>
                                <span className="text-sm font-bold">{fmt(14400)}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: '77%' }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Starter</Badge>
                                    <span className="text-sm text-gray-500">6 lojas</span>
                                </div>
                                <span className="text-sm font-bold">{fmt(4350)}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '23%' }} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Finanças & Receitas</h1>

            {/* Tab Switch */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab('financas')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'financas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Finanças
                </button>
                <button
                    onClick={() => setActiveTab('receitas')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'receitas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Receitas
                </button>
            </div>

            {activeTab === 'financas' ? renderFinancasTab() : renderReceitasTab()}

            {/* Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-600" /> Enviar Cobrança
                        </DialogTitle>
                        <DialogDescription>
                            Enviar email de cobrança para <strong>{emailTarget?.responsible}</strong> referente à loja <strong>{emailTarget?.storeName}</strong> no valor de <strong>{emailTarget ? fmt(emailTarget.value) : ''}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSendEmail} className="gap-2"><Mail className="h-4 w-4" /> Enviar Email</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevFinance;
