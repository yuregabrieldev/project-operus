import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
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
            case 'ativa': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
            case 'expirada': return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
            case 'cancelada': return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
            case 'pendente': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
            default: return 'bg-muted/50 text-muted-foreground border-border';
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
            <div className="min-h-screen bg-background">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)} className="shadow-sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('common.back')}
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-foreground">
                                {selectedLicense ? t('licenses.editLicense') : t('licenses.newLicense')}
                            </h1>
                            {selectedLicense && (
                                <p className="text-sm text-muted-foreground">{selectedLicense.name}</p>
                            )}
                        </div>
                    </div>

                    <Card className="shadow-sm border-border bg-card max-w-4xl">
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
        <div className="min-h-screen bg-background">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground">
                            {t('licenses.title')}
                        </h1>
                        <p className="text-muted-foreground">{t('licenses.subtitle')}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant={showFilters ? "default" : "outline"}
                            className="shadow-sm"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                        </Button>
                        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 shadow-sm text-primary-foreground">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('licenses.newLicense')}
                        </Button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatsCard
                        title={t('common.total')}
                        value={stats.total}
                        icon={Shield}
                        variant="default"
                    />
                    <StatsCard
                        title={t('licenses.active')}
                        value={stats.ativa}
                        icon={CheckCircle}
                        variant="success"
                    />
                    <StatsCard
                        title={t('licenses.expired')}
                        value={stats.expirada}
                        icon={AlertCircle}
                        variant="destructive"
                    />
                    <StatsCard
                        title={t('licenses.totalValue')}
                        value={`€${stats.totalValue.toFixed(2)}`}
                        icon={FileText}
                        variant="default"
                    />
                </div>

                {/* Search Bar */}
                <Card className="shadow-sm border-border bg-card">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input
                                    placeholder={t('licenses.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 text-lg border-input focus:border-primary focus:ring-primary/20"
                                />
                            </div>
                            <Button onClick={clearFilters} variant="outline" className="h-12 px-6">
                                <X className="h-4 w-4 mr-2" />
                                {t('common.clear')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Filters */}
                {showFilters && (
                    <Card className="shadow-sm border-border bg-card">
                        <CardHeader className="bg-muted/50 border-b border-border py-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-5 w-5 text-primary" />
                                {t('licenses.advancedFilters')}
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
                                    <Label className="text-sm font-semibold">{t('licenses.issueDate')}</Label>
                                    <div className="flex gap-2">
                                        <Input type="date" value={issueDateStart} onChange={(e) => setIssueDateStart(e.target.value)} className="text-sm bg-background" placeholder={t('common.start')} />
                                        <Input type="date" value={issueDateEnd} onChange={(e) => setIssueDateEnd(e.target.value)} className="text-sm bg-background" placeholder={t('common.end')} />
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
                <Card className="shadow-sm border-border bg-card">
                    <CardHeader className="bg-muted/50 border-b border-border py-4">
                        <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <Shield className="h-6 w-6 text-primary" />
                                <span className="text-lg font-bold text-foreground">{t('licenses.licenseList')}</span>
                                <Badge variant="outline" className="bg-background text-foreground border-border">
                                    {filteredLicenses.length} {t('common.of')} {licenses.length}
                                </Badge>
                            </div>
                            <Button size="sm" variant="outline" className="shadow-sm bg-background" onClick={exportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                {t('common.exportCSV')}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.license')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.store')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.description')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.periodicity')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.value')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground text-center">
                                            <Paperclip className="h-4 w-4 inline" />
                                        </TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.issue')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.renewal')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('licenses.status')}</TableHead>
                                        <TableHead className="font-semibold text-muted-foreground">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLicenses.map((license) => {
                                        const latestRenewal = getLatestRenewal(license);
                                        const latestIssue = getLatestIssueDate(license);
                                        return (
                                            <TableRow key={license.id} className={`hover:bg-muted/50 transition-colors ${license.status === 'expirada' ? 'bg-destructive/5' : ''}`}>
                                                <TableCell className="font-medium text-foreground">{license.name}</TableCell>
                                                <TableCell className="text-muted-foreground max-w-[150px] truncate">{getStoreNames(license.storeIds)}</TableCell>
                                                <TableCell className="text-muted-foreground max-w-[180px] truncate">{license.description || '-'}</TableCell>
                                                <TableCell className="text-muted-foreground">{getPeriodicityLabel(license.periodicity)}</TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    {latestRenewal ? `${latestRenewal.currency}${latestRenewal.value.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">{license.attachments.length}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {latestIssue ? formatDate(latestIssue.issueDate) : '-'}
                                                </TableCell>
                                                <TableCell className={license.status === 'expirada' ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                                                    {latestRenewal ? formatDate(latestRenewal.renewalDate) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getStatusColor(license.status)} transition-colors border ${license.status === 'expirada' ? 'animate-pulse' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(license.status)}
                                                            <span className="font-medium">{getStatusLabel(license.status)}</span>
                                                        </div>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(license)} className="h-8 w-8 p-0 hover:bg-muted">
                                                        <Edit className="h-4 w-4 text-muted-foreground" />
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
                                <Shield className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground text-lg">
                                    {searchTerm || storeFilter || statusFilter || issueDateStart || renewalDateStart
                                        ? t('licenses.noLicensesFoundFilter')
                                        : t('licenses.noLicensesFound')}
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
