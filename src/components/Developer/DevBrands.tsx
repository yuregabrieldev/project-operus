
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Store, DollarSign, Search, Edit, CheckCircle, Trash2,
    ArrowLeft, Upload, X, Power, AlertTriangle, Plus, UserPlus, Image as ImageIcon
} from 'lucide-react';

type BrandStatus = 'active' | 'pending' | 'inactive';

interface DemoStore {
    id: string;
    name: string;
    address: string;
    responsible: string;
    contact: string;
    plan: 'Starter' | 'Business';
    planValue: number;
    status: BrandStatus;
    imageUrl?: string;
}

interface DemoBrand {
    id: string;
    name: string;
    storesCount: number;
    responsible: string;
    monthlyRevenue: number;
    status: BrandStatus;
    totalRevenue: number;
    stores: DemoStore[];
    imageUrl?: string;
}

interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

const DevBrands: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<DemoBrand | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'brand' | 'store'; id: string } | null>(null);
    const [showCreateBrand, setShowCreateBrand] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);

    // Create Brand form state
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandImage, setNewBrandImage] = useState('');
    const [adminSearch, setAdminSearch] = useState('');
    const [selectedAdmin, setSelectedAdmin] = useState<SystemUser | null>(null);

    // Add Store form state
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreAddress, setNewStoreAddress] = useState('');
    const [newStoreImage, setNewStoreImage] = useState('');
    const [newStorePlan, setNewStorePlan] = useState<'Starter' | 'Business'>('Starter');
    const [storeAdminSearch, setStoreAdminSearch] = useState('');
    const [selectedStoreAdmin, setSelectedStoreAdmin] = useState<SystemUser | null>(null);

    const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    // System users for admin assignment
    const systemUsers: SystemUser[] = [
        { id: 'u1', name: 'João Silva', email: 'joao@operus.com', role: 'admin' },
        { id: 'u2', name: 'Maria Santos', email: 'maria@operus.com', role: 'manager' },
        { id: 'u3', name: 'Pedro Costa', email: 'pedro@operus.com', role: 'admin' },
        { id: 'u4', name: 'Ana Lima', email: 'ana@operus.com', role: 'manager' },
        { id: 'u5', name: 'Carlos Mendes', email: 'carlos@operus.com', role: 'admin' },
        { id: 'u6', name: 'Sofia Oliveira', email: 'sofia@operus.com', role: 'admin' },
        { id: 'u7', name: 'Rita Ferreira', email: 'rita@operus.com', role: 'manager' },
        { id: 'u8', name: 'Miguel Sousa', email: 'miguel@operus.com', role: 'assistant' },
    ];

    const demoBrands: DemoBrand[] = [
        {
            id: '1', name: 'Oakberry', storesCount: 3, responsible: 'João Silva',
            monthlyRevenue: 8500, status: 'active', totalRevenue: 102000,
            stores: [
                { id: 's1', name: 'Alvalade', address: 'Av. da Igreja 42, Lisboa', responsible: 'Maria Santos', contact: '+351 912 345 678', plan: 'Business', planValue: 149.90, status: 'active' },
                { id: 's2', name: 'Rossio', address: 'Praça Dom Pedro IV, Lisboa', responsible: 'Pedro Costa', contact: '+351 913 456 789', plan: 'Business', planValue: 149.90, status: 'active' },
                { id: 's3', name: 'Colombo', address: 'Centro Colombo, Lisboa', responsible: 'Ana Lima', contact: '+351 914 567 890', plan: 'Starter', planValue: 49.90, status: 'pending' },
            ]
        },
        {
            id: '2', name: 'Spike', storesCount: 2, responsible: 'Carlos Mendes',
            monthlyRevenue: 3200, status: 'active', totalRevenue: 38400,
            stores: [
                { id: 's4', name: 'Saldanha', address: 'Av. da República, Lisboa', responsible: 'Rita Ferreira', contact: '+351 915 678 901', plan: 'Business', planValue: 149.90, status: 'active' },
                { id: 's5', name: 'Benfica', address: 'Estrada de Benfica, Lisboa', responsible: 'Miguel Sousa', contact: '+351 916 789 012', plan: 'Starter', planValue: 49.90, status: 'inactive' },
            ]
        },
        {
            id: '3', name: 'Green Bowl', storesCount: 1, responsible: 'Sofia Oliveira',
            monthlyRevenue: 1500, status: 'pending', totalRevenue: 0,
            stores: [
                { id: 's6', name: 'Amoreiras', address: 'Centro Amoreiras, Lisboa', responsible: 'Sofia Oliveira', contact: '+351 917 890 123', plan: 'Starter', planValue: 49.90, status: 'pending' },
            ]
        },
        {
            id: '4', name: 'Bao Bao', storesCount: 0, responsible: 'Paulo Rodrigues',
            monthlyRevenue: 0, status: 'inactive', totalRevenue: 4800,
            stores: []
        },
    ];

    const filtered = demoBrands.filter(b => {
        const matchSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.responsible.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalActive = demoBrands.filter(b => b.status === 'active').length;
    const totalPending = demoBrands.filter(b => b.status === 'pending').length;
    const totalStores = demoBrands.reduce((s, b) => s + b.storesCount, 0);
    const totalRevenue = demoBrands.reduce((s, b) => s + b.monthlyRevenue, 0);

    const statusBadge = (status: BrandStatus) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            inactive: 'bg-gray-100 text-gray-600 border-gray-200',
        };
        const labels = { active: 'Ativa', pending: 'Pendente', inactive: 'Inativa' };
        return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
    };

    const handleDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    };

    const filteredAdminUsers = systemUsers.filter(u =>
        u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(adminSearch.toLowerCase())
    );

    const filteredStoreAdminUsers = systemUsers.filter(u =>
        u.name.toLowerCase().includes(storeAdminSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(storeAdminSearch.toLowerCase())
    );

    const resetCreateBrand = () => {
        setNewBrandName('');
        setNewBrandImage('');
        setAdminSearch('');
        setSelectedAdmin(null);
        setShowCreateBrand(false);
    };

    const resetAddStore = () => {
        setNewStoreName('');
        setNewStoreAddress('');
        setNewStoreImage('');
        setNewStorePlan('Starter');
        setStoreAdminSearch('');
        setSelectedStoreAdmin(null);
        setShowAddStore(false);
    };

    // Brand Detail View
    if (selectedBrand) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => setSelectedBrand(null)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Voltar
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {selectedBrand.name} {statusBadge(selectedBrand.status)}
                            </h1>
                        </div>
                    </div>
                    <Button className="gap-2" onClick={() => setShowAddStore(true)}>
                        <Plus className="h-4 w-4" /> Nova Loja
                    </Button>
                </div>

                {/* Brand Revenue */}
                <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <CardContent className="p-5">
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Receita Total da Marca</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(selectedBrand.totalRevenue)}</p>
                    </CardContent>
                </Card>

                {/* Stores Table */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Store className="h-5 w-5 text-blue-600" /> Lojas ({selectedBrand.stores.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50/80">
                                    <th className="text-left p-3 font-semibold text-gray-600">Loja</th>
                                    <th className="text-left p-3 font-semibold text-gray-600">Endereço</th>
                                    <th className="text-left p-3 font-semibold text-gray-600">Responsável</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Plano</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Valor</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBrand.stores.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhuma loja cadastrada</td></tr>
                                ) : (
                                    selectedBrand.stores.map(store => (
                                        <tr key={store.id} className="border-b hover:bg-gray-50/50">
                                            <td className="p-3 font-medium">{store.name}</td>
                                            <td className="p-3 text-gray-500 text-xs">{store.address}</td>
                                            <td className="p-3 text-gray-600">{store.responsible}</td>
                                            <td className="p-3 text-center">
                                                <Badge variant="outline" className={store.plan === 'Business' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                                                    {store.plan}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right font-semibold">{fmt(store.planValue)}</td>
                                            <td className="p-3 text-center">{statusBadge(store.status)}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={store.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                        <Power className={`h-3.5 w-3.5 ${store.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Excluir" onClick={() => { setDeleteTarget({ type: 'store', id: store.id }); setShowDeleteConfirm(true); }}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Delete Brand */}
                <div className="flex justify-end">
                    <Button variant="destructive" className="gap-2" onClick={() => { setDeleteTarget({ type: 'brand', id: selectedBrand.id }); setShowDeleteConfirm(true); }}>
                        <Trash2 className="h-4 w-4" /> Excluir Marca
                    </Button>
                </div>

                {/* Delete Confirmation */}
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
                            </DialogTitle>
                            <DialogDescription>
                                {deleteTarget?.type === 'brand'
                                    ? `Tem certeza que deseja excluir a marca "${selectedBrand.name}" e todas as suas lojas?`
                                    : 'Tem certeza que deseja excluir esta loja?'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleDelete}>Sim, Excluir</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Store Dialog */}
                <Dialog open={showAddStore} onOpenChange={(open) => { if (!open) resetAddStore(); }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" /> Adicionar Loja a {selectedBrand.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome da Loja *</Label>
                                <Input value={newStoreName} onChange={e => setNewStoreName(e.target.value)} placeholder="Ex: Centro Colombo" />
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço *</Label>
                                <Input value={newStoreAddress} onChange={e => setNewStoreAddress(e.target.value)} placeholder="Ex: Av. Lusíada, Lisboa" />
                            </div>
                            <div className="space-y-2">
                                <Label>Imagem da Loja</Label>
                                <div className="flex items-center gap-3">
                                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Upload className="h-3.5 w-3.5" /> Carregar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Plano *</Label>
                                <Select value={newStorePlan} onValueChange={(v: 'Starter' | 'Business') => setNewStorePlan(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Starter">Starter — €29,00/mês</SelectItem>
                                        <SelectItem value="Business">Business — €35,00/mês</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Administrador da Loja *</Label>
                                {selectedStoreAdmin ? (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-700">
                                            {selectedStoreAdmin.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{selectedStoreAdmin.name}</p>
                                            <p className="text-xs text-gray-500">{selectedStoreAdmin.email}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedStoreAdmin(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Input placeholder="Buscar utilizador por nome ou email..." value={storeAdminSearch} onChange={e => setStoreAdminSearch(e.target.value)} />
                                        {storeAdminSearch.length >= 2 && (
                                            <div className="border rounded-lg max-h-32 overflow-y-auto">
                                                {filteredStoreAdminUsers.length === 0 ? (
                                                    <p className="p-3 text-sm text-gray-500 text-center">Nenhum utilizador encontrado</p>
                                                ) : (
                                                    filteredStoreAdminUsers.map(u => (
                                                        <button key={u.id} onClick={() => { setSelectedStoreAdmin(u); setStoreAdminSearch(''); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
                                                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{u.name}</p>
                                                                <p className="text-[11px] text-gray-400">{u.email} · {u.role}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={resetAddStore}>Cancelar</Button>
                            <Button disabled={!newStoreName || !newStoreAddress || !selectedStoreAdmin} onClick={resetAddStore} className="gap-2">
                                <Plus className="h-4 w-4" /> Adicionar Loja
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Brand List View
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Marcas</h1>
                <Button className="gap-2" onClick={() => setShowCreateBrand(true)}>
                    <Plus className="h-4 w-4" /> Nova Marca
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Marcas Ativas</p>
                        <p className="text-2xl font-bold mt-1">{totalActive}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase">Marcas Pendentes</p>
                        <p className="text-2xl font-bold mt-1">{totalPending}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase">Total de Lojas</p>
                        <p className="text-2xl font-bold mt-1">{totalStores}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-purple-600 uppercase">Receita Total</p>
                        <p className="text-2xl font-bold mt-1">{fmt(totalRevenue)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Pesquisar marca ou responsável..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Brand Table */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left p-3 font-semibold text-gray-600">Marca</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Lojas</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Responsável</th>
                                <th className="text-right p-3 font-semibold text-gray-600">Receita/Mês</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(brand => (
                                <tr key={brand.id} className="border-b hover:bg-gray-50/50">
                                    <td className="p-3 font-medium">{brand.name}</td>
                                    <td className="p-3 text-center">{brand.storesCount}</td>
                                    <td className="p-3 text-gray-600">{brand.responsible}</td>
                                    <td className="p-3 text-right font-semibold">{fmt(brand.monthlyRevenue)}</td>
                                    <td className="p-3 text-center">{statusBadge(brand.status)}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedBrand(brand)} title="Editar">
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            {brand.status === 'pending' && (
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Aprovar">
                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDeleteTarget({ type: 'brand', id: brand.id }); setShowDeleteConfirm(true); }} title="Excluir">
                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>Tem certeza que deseja excluir esta marca e todas as suas lojas?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Sim, Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Brand Dialog */}
            <Dialog open={showCreateBrand} onOpenChange={(open) => { if (!open) resetCreateBrand(); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" /> Criar Nova Marca
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Marca *</Label>
                            <Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Ex: Oakberry" />
                        </div>
                        <div className="space-y-2">
                            <Label>Imagem / Logo da Marca</Label>
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Upload className="h-3.5 w-3.5" /> Carregar
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Administrador da Marca *</Label>
                            <p className="text-xs text-gray-500">Busque e selecione um utilizador existente no sistema</p>
                            {selectedAdmin ? (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-700">
                                        {selectedAdmin.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{selectedAdmin.name}</p>
                                        <p className="text-xs text-gray-500">{selectedAdmin.email}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedAdmin(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Buscar utilizador por nome ou email..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="pl-10" />
                                    </div>
                                    {adminSearch.length >= 2 && (
                                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                                            {filteredAdminUsers.length === 0 ? (
                                                <p className="p-3 text-sm text-gray-500 text-center">Nenhum utilizador encontrado</p>
                                            ) : (
                                                filteredAdminUsers.map(u => (
                                                    <button key={u.id} onClick={() => { setSelectedAdmin(u); setAdminSearch(''); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
                                                        <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{u.name}</p>
                                                            <p className="text-[11px] text-gray-400">{u.email} · {u.role}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetCreateBrand}>Cancelar</Button>
                        <Button disabled={!newBrandName || !selectedAdmin} onClick={resetCreateBrand} className="gap-2">
                            <Plus className="h-4 w-4" /> Criar Marca
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevBrands;
