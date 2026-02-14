
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    Users, UserPlus, Search, Eye, Power, Trash2, AlertTriangle,
    Shield, Clock, Mail, Building2, Store
} from 'lucide-react';

type UserStatus = 'active' | 'pending' | 'inactive';
type UserRole = 'admin' | 'manager' | 'assistant';

interface DemoUser {
    id: string;
    name: string;
    email: string;
    brand: string;
    stores: string[];
    status: UserStatus;
    role: UserRole;
    createdAt: string;
    lastLogin: string;
}

const DevUsers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDetail, setShowDetail] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', brand: '', store: '', role: 'assistant' as UserRole });

    const demoUsers: DemoUser[] = [
        { id: '1', name: 'João Silva', email: 'joao@oakberry.com', brand: 'Oakberry', stores: ['Alvalade', 'Rossio', 'Colombo'], status: 'active', role: 'admin', createdAt: '2025-01-15', lastLogin: '2026-02-14' },
        { id: '2', name: 'Maria Santos', email: 'maria@oakberry.com', brand: 'Oakberry', stores: ['Alvalade'], status: 'active', role: 'manager', createdAt: '2025-03-10', lastLogin: '2026-02-13' },
        { id: '3', name: 'Pedro Costa', email: 'pedro@spike.com', brand: 'Spike', stores: ['Saldanha'], status: 'active', role: 'manager', createdAt: '2025-06-01', lastLogin: '2026-02-12' },
        { id: '4', name: 'Ana Lima', email: 'ana@oakberry.com', brand: 'Oakberry', stores: ['Colombo'], status: 'pending', role: 'assistant', createdAt: '2026-02-10', lastLogin: '-' },
        { id: '5', name: 'Carlos Mendes', email: 'carlos@spike.com', brand: 'Spike', stores: ['Saldanha', 'Benfica'], status: 'active', role: 'admin', createdAt: '2025-02-20', lastLogin: '2026-02-14' },
        { id: '6', name: 'Sofia Oliveira', email: 'sofia@greenbowl.com', brand: 'Green Bowl', stores: ['Amoreiras'], status: 'pending', role: 'admin', createdAt: '2026-02-01', lastLogin: '-' },
        { id: '7', name: 'Rita Ferreira', email: 'rita@spike.com', brand: 'Spike', stores: ['Saldanha'], status: 'inactive', role: 'assistant', createdAt: '2025-04-15', lastLogin: '2025-12-20' },
    ];

    const filtered = demoUsers.filter(u => {
        const matchSearch = !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBrand = brandFilter === 'all' || u.brand === brandFilter;
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchSearch && matchBrand && matchRole && matchStatus;
    });

    const stats = {
        active: demoUsers.filter(u => u.status === 'active').length,
        pending: demoUsers.filter(u => u.status === 'pending').length,
        inactive: demoUsers.filter(u => u.status === 'inactive').length,
        admins: demoUsers.filter(u => u.role === 'admin').length,
    };

    const brands = [...new Set(demoUsers.map(u => u.brand))];

    const statusBadge = (status: UserStatus) => {
        const s = { active: 'bg-emerald-100 text-emerald-700 border-emerald-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', inactive: 'bg-gray-100 text-gray-600 border-gray-200' };
        const l = { active: 'Ativo', pending: 'Pendente', inactive: 'Inativo' };
        return <Badge variant="outline" className={s[status]}>{l[status]}</Badge>;
    };

    const roleBadge = (role: UserRole) => {
        const s = { admin: 'bg-purple-100 text-purple-700 border-purple-200', manager: 'bg-blue-100 text-blue-700 border-blue-200', assistant: 'bg-gray-100 text-gray-600 border-gray-200' };
        const l = { admin: 'Administrador', manager: 'Gerente', assistant: 'Assistente' };
        return <Badge variant="outline" className={s[role]}>{l[role]}</Badge>;
    };

    const handleCreate = () => {
        toast({ title: 'Usuário criado!', description: `${newUser.name} adicionado com sucesso` });
        setShowCreate(false);
        setNewUser({ name: '', email: '', brand: '', store: '', role: 'assistant' });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                <Button className="gap-2" onClick={() => setShowCreate(true)}>
                    <UserPlus className="h-4 w-4" /> Criar Usuário
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Ativos</p>
                        <p className="text-2xl font-bold mt-1">{stats.active}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase">Pendentes</p>
                        <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-gray-50 to-slate-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-gray-600 uppercase">Inativos</p>
                        <p className="text-2xl font-bold mt-1">{stats.inactive}</p>
                    </CardContent>
                </Card>
                <Card className="shadow border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-purple-600 uppercase">Administradores</p>
                        <p className="text-2xl font-bold mt-1">{stats.admins}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Pesquisar nome ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas Marcas</SelectItem>
                        {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Tipos</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="assistant">Assistente</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Email</th>
                                <th className="text-left p-3 font-semibold text-gray-600">Marca</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Tipo</th>
                                <th className="text-center p-3 font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => (
                                <tr key={user.id} className="border-b hover:bg-gray-50/50">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3 text-gray-500 text-xs">{user.email}</td>
                                    <td className="p-3">{user.brand}</td>
                                    <td className="p-3 text-center">{statusBadge(user.status)}</td>
                                    <td className="p-3 text-center">{roleBadge(user.role)}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar" onClick={() => { setSelectedUser(user); setShowDetail(true); }}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={user.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                <Power className={`h-3.5 w-3.5 ${user.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Excluir" onClick={() => { setSelectedUser(user); setShowDelete(true); }}>
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

            {/* User Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Usuário</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{selectedUser.name}</p>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 font-semibold">Marca</p>
                                    <p className="font-medium mt-0.5 flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-blue-500" />{selectedUser.brand}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 font-semibold">Tipo</p>
                                    <div className="mt-0.5">{roleBadge(selectedUser.role)}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 font-semibold">Criado em</p>
                                    <p className="font-medium mt-0.5 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" />{new Date(selectedUser.createdAt + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 font-semibold">Último Login</p>
                                    <p className="font-medium mt-0.5 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" />{selectedUser.lastLogin === '-' ? '-' : new Date(selectedUser.lastLogin + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Lojas</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedUser.stores.map(s => (
                                        <Badge key={s} variant="outline" className="bg-white">
                                            <Store className="h-3 w-3 mr-1" />{s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => { setShowDelete(false); toast({ title: 'Usuário excluído!' }); }}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-600" /> Criar Usuário
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Nome</Label>
                            <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Email</Label>
                            <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Marca</Label>
                                <Select value={newUser.brand} onValueChange={v => setNewUser(p => ({ ...p, brand: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                                    <SelectContent>
                                        {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Tipo de Usuário</Label>
                                <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="assistant">Assistente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="gap-2"><UserPlus className="h-4 w-4" /> Criar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevUsers;
