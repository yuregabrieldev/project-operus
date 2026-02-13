import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    FileText, Plus, Edit, Search, Filter, Download, X, Calendar, ArrowLeft,
    Paperclip, Shield, AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { LicenseForm } from './LicenseForm';
import type { License, LicenseStatus } from '@/contexts/DataContext';

const LicenseManager: React.FC = () => {
    const { t } = useLanguage();
    const { licenses, stores, getStoreById } = useData();

    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [storeFilter, setStoreFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [issueDateStart, setIssueDateStart] = useState('');
    const [issueDateEnd, setIssueDateEnd] = useState('');
    const [renewalDateStart, setRenewalDateStart] = useState('');
    const [renewalDateEnd, setRenewalDateEnd] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Helpers
    const getStatusColor = (status: LicenseStatus) => {
        switch (status) {
            case 'ativa': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
            case 'expirada': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
            case 'cancelada': return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
            case 'pendente': return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
        }
    };

    const getStatusIcon = (status: LicenseStatus) => {
        switch (status) {
            case 'ativa': return <CheckCircle className="h-4 w-4" />;
            case 'expirada': return <AlertCircle className="h-4 w-4" />;
            case 'cancelada': return <XCircle className="h-4 w-4" />;
            case 'pendente': return <Clock className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusLabel = (status: LicenseStatus) => {
        switch (status) {
            case 'ativa': return 'Ativa';
            case 'expirada': return 'Expirada';
            case 'cancelada': return 'Cancelada';
            case 'pendente': return 'Pendente';
            default: return status;
        }
    };

    const getPeriodicityLabel = (p: string) => {
        switch (p) {
            case 'mensal': return 'Mensal';
            case 'trimestral': return 'Trimestral';
            case 'semestral': return 'Semestral';
            case 'anual': return 'Anual';
            default: return p;
        }
    };

    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

    const getStoreNames = (storeIds: string[]) => {
        return storeIds.map(id => getStoreById(id)?.name).filter(Boolean).join(', ');
    };

    // Get latest renewal dates for a license
    const getLatestRenewal = (license: License) => {
        if (license.renewals.length === 0) return null;
        return license.renewals.reduce((latest, r) =>
            new Date(r.renewalDate) > new Date(latest.renewalDate) ? r : latest
        );
    };

    const getLatestIssueDate = (license: License) => {
        if (license.renewals.length === 0) return null;
        return license.renewals.reduce((latest, r) =>
            new Date(r.issueDate) > new Date(latest.issueDate) ? r : latest
        );
    };

    // Filtered licenses
    const filteredLicenses = useMemo(() => {
        return licenses.filter(license => {
            const matchesSearch = !searchTerm ||
                license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (license.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStore = !storeFilter || license.storeIds.includes(storeFilter);

            const matchesStatus = !statusFilter || license.status === statusFilter;

            // Issue date filter — check latest renewal's issue date
            let matchesIssueDate = true;
            if (issueDateStart || issueDateEnd) {
                const latestIssue = getLatestIssueDate(license);
                if (latestIssue) {
                    const issueDate = new Date(latestIssue.issueDate);
                    if (issueDateStart && issueDate < new Date(issueDateStart)) matchesIssueDate = false;
                    if (issueDateEnd && issueDate > new Date(issueDateEnd + 'T23:59:59')) matchesIssueDate = false;
                } else {
                    matchesIssueDate = false;
                }
            }

            // Renewal date filter
            let matchesRenewalDate = true;
            if (renewalDateStart || renewalDateEnd) {
                const latestRenewal = getLatestRenewal(license);
                if (latestRenewal) {
                    const renewalDate = new Date(latestRenewal.renewalDate);
                    if (renewalDateStart && renewalDate < new Date(renewalDateStart)) matchesRenewalDate = false;
                    if (renewalDateEnd && renewalDate > new Date(renewalDateEnd + 'T23:59:59')) matchesRenewalDate = false;
                } else {
                    matchesRenewalDate = false;
                }
            }

            return matchesSearch && matchesStore && matchesStatus && matchesIssueDate && matchesRenewalDate;
        });
    }, [licenses, searchTerm, storeFilter, statusFilter, issueDateStart, issueDateEnd, renewalDateStart, renewalDateEnd]);

    // Stats
    const stats = useMemo(() => ({
        total: filteredLicenses.length,
        ativa: filteredLicenses.filter(l => l.status === 'ativa').length,
        expirada: filteredLicenses.filter(l => l.status === 'expirada').length,
        pendente: filteredLicenses.filter(l => l.status === 'pendente').length,
        totalValue: filteredLicenses.reduce((sum, l) => {
            const latest = getLatestRenewal(l);
            return sum + (latest?.value || 0);
        }, 0),
    }), [filteredLicenses]);

    const clearFilters = () => {
        setSearchTerm('');
        setStoreFilter('');
        setStatusFilter('');
        setIssueDateStart('');
        setIssueDateEnd('');
        setRenewalDateStart('');
        setRenewalDateEnd('');
    };

    const handleEdit = (license: License) => {
        setSelectedLicense(license);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedLicense(null);
        setIsFormOpen(true);
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ['Nome', 'Lojas', 'Descrição', 'Periodicidade', 'Valor', 'Status', 'Emissão', 'Renovação', 'Anexos'];
        const rows = filteredLicenses.map(l => {
            const latest = getLatestRenewal(l);
            return [
                l.name,
                getStoreNames(l.storeIds),
                l.description || '',
                getPeriodicityLabel(l.periodicity),
                latest ? `${latest.currency}${latest.value.toFixed(2)}` : '',
                getStatusLabel(l.status),
                latest ? formatDate(latest.issueDate) : '',
                latest ? formatDate(latest.renewalDate) : '',
                l.attachments.length.toString(),
            ];
        });

        const csvContent = [headers, ...rows].map(row =>
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `licencas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast({ title: 'CSV exportado com sucesso!' });
    };

    // Form view
    if (isFormOpen) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} className="shadow-sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar à Lista
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                {selectedLicense ? 'Editar Licença' : 'Nova Licença'}
                            </h1>
                            {selectedLicense && (
                                <p className="text-sm text-gray-500">{selectedLicense.name}</p>
                            )}
                        </div>
                    </div>

                    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm max-w-4xl">
                        <CardContent className="p-8">
                            <LicenseForm
                                license={selectedLicense}
                                onClose={() => setIsFormOpen(false)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Licenças
                        </h1>
                        <p className="text-gray-600">Gestão de licenças e renovações</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant={showFilters ? "default" : "outline"}
                            className="shadow-md"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Esconder Filtros' : 'Mostrar Filtros'}
                        </Button>
                        <Button onClick={handleAddNew} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Licença
                        </Button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                </div>
                                <Shield className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ativas</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.ativa}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Expiradas</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.expirada}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Valor Total</p>
                                    <p className="text-2xl font-bold text-purple-600">€{stats.totalValue.toFixed(2)}</p>
                                </div>
                                <FileText className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    placeholder="Buscar licenças por nome ou descrição..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 text-lg border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                                />
                            </div>
                            <Button onClick={clearFilters} variant="outline" className="h-12 px-6">
                                <X className="h-4 w-4 mr-2" />
                                Limpar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Filters */}
                {showFilters && (
                    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-purple-600" />
                                Filtros Avançados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Store filter */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Loja</Label>
                                    <Select value={storeFilter || '__all__'} onValueChange={(v) => setStoreFilter(v === '__all__' ? '' : v)}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todas as Lojas</SelectItem>
                                            {stores.map(store => (
                                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status filter */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                    <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todos</SelectItem>
                                            <SelectItem value="ativa"><span className="text-green-600">Ativa</span></SelectItem>
                                            <SelectItem value="expirada"><span className="text-red-600">Expirada</span></SelectItem>
                                            <SelectItem value="pendente"><span className="text-yellow-600">Pendente</span></SelectItem>
                                            <SelectItem value="cancelada"><span className="text-gray-500">Cancelada</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Issue date range */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Data de Emissão</Label>
                                    <div className="flex gap-2">
                                        <Input type="date" value={issueDateStart} onChange={(e) => setIssueDateStart(e.target.value)} className="text-sm" placeholder="Início" />
                                        <Input type="date" value={issueDateEnd} onChange={(e) => setIssueDateEnd(e.target.value)} className="text-sm" placeholder="Fim" />
                                    </div>
                                </div>

                                {/* Renewal date range */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Data de Renovação</Label>
                                    <div className="flex gap-2">
                                        <Input type="date" value={renewalDateStart} onChange={(e) => setRenewalDateStart(e.target.value)} className="text-sm" placeholder="Início" />
                                        <Input type="date" value={renewalDateEnd} onChange={(e) => setRenewalDateEnd(e.target.value)} className="text-sm" placeholder="Fim" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* License Table */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                        <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <Shield className="h-6 w-6 text-purple-600" />
                                <span>Lista de Licenças</span>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {filteredLicenses.length} de {licenses.length}
                                </Badge>
                            </div>
                            <Button size="sm" variant="outline" className="shadow-sm" onClick={exportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead className="font-semibold text-gray-700">Licença</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Loja</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Periodicidade</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Valor</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-center">
                                            <Paperclip className="h-4 w-4 inline" />
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Emissão</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Renovação</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLicenses.map((license) => {
                                        const latestRenewal = getLatestRenewal(license);
                                        const latestIssue = getLatestIssueDate(license);
                                        return (
                                            <TableRow key={license.id} className={`hover:bg-gray-50/50 transition-colors ${license.status === 'expirada' ? 'bg-red-50/30' : ''}`}>
                                                <TableCell className="font-medium text-gray-900">{license.name}</TableCell>
                                                <TableCell className="text-gray-700 max-w-[150px] truncate">{getStoreNames(license.storeIds)}</TableCell>
                                                <TableCell className="text-gray-600 max-w-[180px] truncate">{license.description || '-'}</TableCell>
                                                <TableCell className="text-gray-600">{getPeriodicityLabel(license.periodicity)}</TableCell>
                                                <TableCell className="font-semibold text-gray-900">
                                                    {latestRenewal ? `${latestRenewal.currency}${latestRenewal.value.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Paperclip className="h-3 w-3 text-gray-400" />
                                                        <span className="text-sm text-gray-600">{license.attachments.length}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {latestIssue ? formatDate(latestIssue.issueDate) : '-'}
                                                </TableCell>
                                                <TableCell className={license.status === 'expirada' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                                    {latestRenewal ? formatDate(latestRenewal.renewalDate) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getStatusColor(license.status)} transition-colors border ${license.status === 'expirada' ? 'animate-heartbeat' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(license.status)}
                                                            <span className="font-medium">{getStatusLabel(license.status)}</span>
                                                        </div>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(license)} className="h-8 w-8 p-0">
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredLicenses.length === 0 && (
                            <div className="text-center py-12">
                                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">
                                    {searchTerm || storeFilter || statusFilter || issueDateStart || renewalDateStart
                                        ? 'Nenhuma licença encontrada com os filtros aplicados'
                                        : 'Nenhuma licença cadastrada'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LicenseManager;
