
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    DollarSign, TrendingUp, CreditCard, AlertTriangle, Clock,
    Search, Eye, Mail, Bell
} from 'lucide-react';

type PaymentStatus = 'late' | 'pending' | 'paid';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailTarget, setEmailTarget] = useState<DemoPayment | null>(null);

    const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    const stats = {
        revenue: 18750,
        recurringRevenue: 15200,
        avgTicket: 112.50,
        pendingPayments: 4,
        latePayments: 2,
    };

    const payments: DemoPayment[] = [
        { id: '1', storeName: 'Alvalade', brandName: 'Oakberry', plan: 'Business', value: 149.90, dueDate: '2026-01-15', responsible: 'João Silva', status: 'late' },
        { id: '2', storeName: 'Saldanha', brandName: 'Spike', plan: 'Business', value: 149.90, dueDate: '2026-02-01', responsible: 'Carlos Mendes', status: 'late' },
        { id: '3', storeName: 'Colombo', brandName: 'Oakberry', plan: 'Starter', value: 49.90, dueDate: '2026-02-15', responsible: 'João Silva', status: 'pending' },
        { id: '4', storeName: 'Amoreiras', brandName: 'Green Bowl', plan: 'Starter', value: 49.90, dueDate: '2026-02-20', responsible: 'Sofia Oliveira', status: 'pending' },
        { id: '5', storeName: 'Rossio', brandName: 'Oakberry', plan: 'Business', value: 149.90, dueDate: '2026-02-10', responsible: 'João Silva', status: 'paid' },
        { id: '6', storeName: 'Benfica', brandName: 'Spike', plan: 'Starter', value: 49.90, dueDate: '2026-02-05', responsible: 'Carlos Mendes', status: 'paid' },
    ];

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

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Receitas</p>
                        <p className="text-xl font-bold mt-1">{fmt(stats.revenue)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase">Recorrente</p>
                        <p className="text-xl font-bold mt-1">{fmt(stats.recurringRevenue)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-purple-600 uppercase">Ticket Médio</p>
                        <p className="text-xl font-bold mt-1">{fmt(stats.avgTicket)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase">Pendentes</p>
                        <p className="text-xl font-bold mt-1">{stats.pendingPayments}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-red-50 to-rose-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-red-600 uppercase">Atrasados</p>
                        <p className="text-xl font-bold mt-1">{stats.latePayments}</p>
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
