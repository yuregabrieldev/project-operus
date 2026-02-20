
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    Shield, Clock, Mail, Building2, Store, UserCheck, Copy, KeyRound, Pencil
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/supabase-services';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDetail, setShowDetail] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);
    const [editUser, setEditUser] = useState<{ name: string; email: string; brand: string; role: UserRole; status: UserStatus } | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', brand: '', store: '', role: 'assistant' as UserRole });
    const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [brandIdMap, setBrandIdMap] = useState<Record<string, string>>({});
    const [brandStores, setBrandStores] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [interessados, setInteressados] = useState<{ id: string; name: string; email: string; phone: string; brand_name: string; stores_range: string; created_at: string; status?: string; temp_password?: string | null }[]>([]);
    const [interessadosError, setInteressadosError] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'usuarios' | 'interessados'>('usuarios');
    const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; name: string; email: string; password: string }>({ open: false, name: '', email: '', password: '' });

    const tabFromUrl = searchParams.get('tab');
    useEffect(() => {
        if (tabFromUrl === 'interessados') setActiveTab('interessados');
    }, [tabFromUrl]);

    const randomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let s = '';
        for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    };

    useEffect(() => {
        (async () => {
            try {
                // Try RPC function first (bypasses RLS), fall back to direct query
                const rpcProfiles = await supabase.rpc('get_all_profiles_for_developer');
                let profilesFallback = false;
                let profilesRes: any;

                if (!rpcProfiles.error && rpcProfiles.data && rpcProfiles.data.length > 0) {
                    profilesRes = rpcProfiles;
                } else {
                    profilesFallback = true;
                    profilesRes = await supabase.from('profiles').select('id, name, email, role, is_active, created_at');
                }

                const [userBrandsRes, brandsRes, storesRes, requestsRes] = await Promise.all([
                    supabase.from('user_brands').select('user_id, brand_id, role'),
                    supabase.from('brands').select('id, name').order('name'),
                    supabase.from('stores').select('id, name, brand_id').order('name'),
                    supabase.from('registration_requests').select('id, name, email, phone, created_at, status, temp_password').order('created_at', { ascending: false }),
                ]);
                if (profilesRes.error) {
                    console.error('DevUsers profiles:', profilesRes.error.message);
                }
                if (profilesFallback) {
                    console.warn('DevUsers: RPC get_all_profiles_for_developer failed or returned empty, using direct query. Run migration-developer-list-users.sql to fix.');
                }
                const profiles = (profilesRes.data ?? []).filter((p: any) => p.role !== 'developer');
                const userBrands = userBrandsRes.data ?? [];
                const brandsList = brandsRes.data ?? [];
                const storesList = storesRes.data ?? [];
                const brandNames = new Map(brandsList.map((b: any) => [b.id, b.name]));
                const storesByBrand = new Map<string, string[]>();
                for (const s of storesList) {
                    const list = storesByBrand.get(s.brand_id) ?? [];
                    list.push(s.name);
                    storesByBrand.set(s.brand_id, list);
                }
                setBrands(brandsList.map((b: any) => b.name));
                const idMap: Record<string, string> = {};
                brandsList.forEach((b: any) => { idMap[b.name] = b.id; });
                setBrandIdMap(idMap);
                const brandStoresFlat: Record<string, string[]> = {};
                brandsList.forEach((b: any) => { brandStoresFlat[b.name] = storesByBrand.get(b.id) ?? []; });
                setBrandStores(brandStoresFlat);

                const ubByUser = new Map<string, { brand_id: string; role: string }[]>();
                for (const ub of userBrands) {
                    const list = ubByUser.get(ub.user_id) ?? [];
                    list.push({ brand_id: ub.brand_id, role: ub.role });
                    ubByUser.set(ub.user_id, list);
                }
                const users: DemoUser[] = profiles.map((p: any) => {
                    const ubs = ubByUser.get(p.id) ?? [];
                    const brandIds = ubs.map(ub => ub.brand_id);
                    const brandNamesList = brandIds.map(id => brandNames.get(id) ?? '-').filter(Boolean);
                    const storesListForUser = brandIds.flatMap(id => storesByBrand.get(id) ?? []);
                    const role = (p.role === 'developer' ? 'admin' : p.role) as UserRole;
                    const status: UserStatus = p.is_active === false ? 'inactive' : (ubs.length === 0 ? 'pending' : 'active');
                    return {
                        id: p.id,
                        name: p.name || p.email || '-',
                        email: p.email || '',
                        brand: brandNamesList[0] ?? '-',
                        stores: [...new Set(storesListForUser)],
                        status,
                        role: role in { admin: 1, manager: 1, assistant: 1 } ? role : 'assistant',
                        createdAt: (p.created_at as string)?.slice(0, 10) ?? '-',
                        lastLogin: '-',
                    };
                });
                setDemoUsers(users);
                setInteressadosError(null);
                let allReqs: any[] = requestsRes.data ?? [];
                if (requestsRes.error) {
                    console.error('Interessados (registration_requests):', requestsRes.error.message);
                    const rpcRes = await supabase.rpc('get_registration_requests');
                    if (rpcRes.error) {
                        setInteressadosError(requestsRes.error.message || 'Erro ao carregar interessados.');
                    } else {
                        allReqs = rpcRes.data ?? [];
                    }
                }
                const reqs = allReqs.filter((r: any) => (r.status ?? 'pendente') !== 'aprovado');
                // Auto-remove interessados whose email already exists in the profiles (users) list
                const profileEmails = new Set(profiles.map((p: any) => (p.email || '').toLowerCase()));
                const uniqueReqs = reqs.filter((r: any) => !profileEmails.has((r.email || '').toLowerCase()));
                setInteressados(uniqueReqs.map((r: any) => ({
                    id: r.id,
                    name: r.name || '',
                    email: r.email || '',
                    phone: r.phone || '',
                    brand_name: (r as any).brand_name || '',
                    stores_range: (r as any).stores_range || '',
                    created_at: (r.created_at || '').slice(0, 10),
                    status: r.status ?? 'pendente',
                    temp_password: (r as any).temp_password ?? null,
                })));
            } catch (e) {
                setDemoUsers([]);
                setInteressados([]);
                setInteressadosError(e instanceof Error ? e.message : 'Erro ao carregar.');
                console.error('DevUsers load error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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

    const handleOpenEdit = (user: DemoUser) => {
        setSelectedUser(user);
        setEditUser({ name: user.name, email: user.email, brand: user.brand, role: user.role, status: user.status });
        setShowEdit(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser || !editUser) return;
        setSavingEdit(true);
        try {
            // Update profiles
            const isActive = editUser.status !== 'inactive';
            const { error: profileError } = await supabase.from('profiles').update({
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
                is_active: isActive,
            }).eq('id', selectedUser.id);
            if (profileError) throw profileError;

            // Update brand association
            const newBrandId = brandIdMap[editUser.brand];
            if (newBrandId) {
                // Remove old associations and add new one
                await supabase.from('user_brands').delete().eq('user_id', selectedUser.id);
                await supabase.from('user_brands').insert({ user_id: selectedUser.id, brand_id: newBrandId, role: editUser.role });
            }

            // Update local state
            setDemoUsers(prev => prev.map(u => u.id === selectedUser.id ? {
                ...u,
                name: editUser.name,
                email: editUser.email,
                brand: editUser.brand,
                role: editUser.role,
                status: editUser.status,
            } : u));
            setShowEdit(false);
            toast({ title: 'Usuário atualizado!', description: `${editUser.name} foi salvo com sucesso.` });
        } catch (e: any) {
            toast({ title: 'Erro ao salvar', description: e?.message || 'Erro de rede.', variant: 'destructive' });
        } finally {
            setSavingEdit(false);
        }
    };

    const handleApproveInteressado = async (req: typeof interessados[0]) => {
        setApprovingId(req.id);
        const password = randomPassword();
        try {
            const { error } = await authService.signUp(req.email, password, { name: req.name, role: 'assistant' });
            if (error) throw error;
            try {
                await supabase.from('registration_requests').update({ status: 'aguardando_confirmacao', temp_password: password }).eq('id', req.id);
            } catch (_) {
                // Coluna status/temp_password ou policy pode não existir; conta já foi criada
            }
            setInteressados(prev => prev.map(r => r.id === req.id ? { ...r, status: 'aguardando_confirmacao', temp_password: password } : r));
            await navigator.clipboard.writeText(password);
            setPasswordDialog({ open: true, name: req.name, email: req.email, password });
            toast({
                title: 'Conta criada — Aguardando confirmação',
                description: 'O interessado precisa confirmar o email. Depois será movido automaticamente para a lista de utilizadores. Senha copiada.',
            });
        } catch (e: any) {
            toast({
                title: 'Erro ao aprovar',
                description: e?.message || 'Email já registado ou erro de rede.',
                variant: 'destructive',
            });
        } finally {
            setApprovingId(null);
        }
    };

    const handleVerSenha = (req: typeof interessados[0]) => {
        if (req.temp_password) setPasswordDialog({ open: true, name: req.name, email: req.email, password: req.temp_password });
        else toast({ title: 'Senha não guardada', description: 'Esta solicitação foi aprovada antes de guardarmos a senha. Peça ao cliente para redefinir a senha.', variant: 'destructive' });
    };

    const handleExcluirInteressado = async (req: typeof interessados[0]) => {
        if (!confirm(`Excluir a solicitação de ${req.name} (${req.email})? A conta na plataforma não será apagada.`)) return;
        try {
            const { error } = await supabase.from('registration_requests').delete().eq('id', req.id);
            if (error) throw error;
            setInteressados(prev => prev.filter(r => r.id !== req.id));
            toast({ title: 'Solicitação excluída' });
        } catch (e: any) {
            toast({ title: 'Erro ao excluir', description: e?.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                {activeTab === 'usuarios' && (
                    <Button className="gap-2 w-fit" onClick={() => setShowCreate(true)}>
                        <UserPlus className="h-4 w-4" /> Criar Usuário
                    </Button>
                )}
            </div>
            {loading && <p className="text-gray-500">A carregar dados...</p>}

            {/* Tab menu horizontal (igual Finanças & Receitas) */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => { setActiveTab('usuarios'); setSearchParams({}); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'usuarios' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Users className="h-4 w-4" />
                    Usuários
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab('interessados'); setSearchParams({ tab: 'interessados' }); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'interessados' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <UserCheck className="h-4 w-4" />
                    Interessados
                    {interessados.length > 0 && (
                        <span className="ml-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-1.5 py-0.5">
                            {interessados.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'interessados' && (
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCheck className="h-5 w-5 text-blue-600" /> Interessados
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Solicitações de acesso enviadas pelo formulário &quot;Criar Conta&quot;. Aprove para criar a conta e copiar a senha para enviar ao cliente.
                        </p>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        {interessadosError && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mx-4 mt-2">
                                {interessadosError} Executa no Supabase a migração <code className="text-xs bg-amber-100 px-1 rounded">migration-developer-emails-registration-read.sql</code> e adiciona o teu email à tabela <code className="text-xs bg-amber-100 px-1 rounded">developer_emails</code>.
                            </p>
                        )}
                        {interessados.length === 0 && !interessadosError ? (
                            <p className="text-sm text-muted-foreground p-4">Nenhuma solicitação pendente.</p>
                        ) : interessados.length > 0 ? (
                            <table className="w-full text-sm min-w-[640px]">
                                <thead>
                                    <tr className="border-b bg-gray-50/80">
                                        <th className="text-left p-3 font-semibold text-gray-600">Nome</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Email</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Telefone</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Marca</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Lojas</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Data</th>
                                        <th className="text-left p-3 font-semibold text-gray-600">Estado</th>
                                        <th className="text-center p-3 font-semibold text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interessados.map(req => (
                                        <tr key={req.id} className="border-b hover:bg-gray-50/50">
                                            <td className="p-3 font-medium">{req.name}</td>
                                            <td className="p-3 text-gray-600">{req.email}</td>
                                            <td className="p-3 text-gray-600">{req.phone || '-'}</td>
                                            <td className="p-3">{req.brand_name || '-'}</td>
                                            <td className="p-3">{req.stores_range || '-'}</td>
                                            <td className="p-3 text-gray-600">{req.created_at}</td>
                                            <td className="p-3">
                                                {req.status === 'aguardando_confirmacao' || req.status === 'conta_criada' ? (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">Aguardando confirmação</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pendente</Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {req.status !== 'conta_criada' && req.status !== 'aguardando_confirmacao' && (
                                                        <Button
                                                            size="sm"
                                                            className="gap-1.5"
                                                            disabled={approvingId === req.id}
                                                            onClick={() => handleApproveInteressado(req)}
                                                        >
                                                            {approvingId === req.id ? (
                                                                <>A aprovar...</>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="h-3.5 w-3.5" />
                                                                    Aprovar
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {req.temp_password && (
                                                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleVerSenha(req)}>
                                                            <KeyRound className="h-3.5 w-3.5" /> Ver senha
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleExcluirInteressado(req)}>
                                                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : null}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'usuarios' && (
                <>
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
                                        <th className="text-left p-3 font-semibold text-gray-600">Loja</th>
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
                                            <td className="p-3 text-gray-500 text-xs">{user.stores.join(', ')}</td>
                                            <td className="p-3 text-center">{statusBadge(user.status)}</td>
                                            <td className="p-3 text-center">{roleBadge(user.role)}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar" onClick={() => { setSelectedUser(user); setShowDetail(true); }}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar" onClick={() => handleOpenEdit(user)}>
                                                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
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
                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {demoUsers.length === 0
                                                    ? 'Nenhum usuário encontrado. Verifica se a migração migration-developer-list-users.sql foi executada no Supabase.'
                                                    : 'Nenhum resultado com os filtros atuais.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            )}

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

            {/* Edit User Dialog */}
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-600" /> Editar Usuário
                        </DialogTitle>
                        <DialogDescription>
                            Altere os dados do usuário e clique em Salvar.
                        </DialogDescription>
                    </DialogHeader>
                    {editUser && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Nome</Label>
                                <Input value={editUser.name} onChange={e => setEditUser(p => p ? { ...p, name: e.target.value } : p)} placeholder="Nome completo" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Email</Label>
                                <Input type="email" value={editUser.email} onChange={e => setEditUser(p => p ? { ...p, email: e.target.value } : p)} placeholder="email@exemplo.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Marca</Label>
                                    <Select value={editUser.brand} onValueChange={v => setEditUser(p => p ? { ...p, brand: v } : p)}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                                        <SelectContent>
                                            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Tipo de Usuário</Label>
                                    <Select value={editUser.role} onValueChange={v => setEditUser(p => p ? { ...p, role: v as UserRole } : p)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="manager">Gerente</SelectItem>
                                            <SelectItem value="assistant">Assistente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Loja</Label>
                                    <Select disabled={!editUser.brand}>
                                        <SelectTrigger><SelectValue placeholder={editUser.brand ? 'Selecionar loja' : 'Selecione a marca'} /></SelectTrigger>
                                        <SelectContent>
                                            {(brandStores[editUser.brand] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Status</Label>
                                    <Select value={editUser.status} onValueChange={v => setEditUser(p => p ? { ...p, status: v as UserStatus } : p)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
                        <Button onClick={handleSaveUser} disabled={savingEdit} className="gap-2">
                            {savingEdit ? 'Salvando...' : <><Pencil className="h-4 w-4" /> Salvar</>}
                        </Button>
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
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Loja</Label>
                            <Select value={newUser.store} onValueChange={v => setNewUser(p => ({ ...p, store: v }))} disabled={!newUser.brand}>
                                <SelectTrigger><SelectValue placeholder={newUser.brand ? 'Selecionar loja' : 'Selecione a marca primeiro'} /></SelectTrigger>
                                <SelectContent>
                                    {(brandStores[newUser.brand] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="gap-2"><UserPlus className="h-4 w-4" /> Criar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Popup com a senha após aprovar interessado */}
            <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog(p => ({ ...p, open }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Conta criada – senha do utilizador</DialogTitle>
                        <DialogDescription>
                            Envie esta senha ao cliente. O interessado permanece na lista até confirmar a conta por email; depois passará a aparecer em Usuários.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground"><strong>{passwordDialog.name}</strong> ({passwordDialog.email})</p>
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                            <code className="flex-1 font-mono text-sm break-all">{passwordDialog.password}</code>
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 gap-1"
                                onClick={async () => {
                                    if (passwordDialog.password) {
                                        await navigator.clipboard.writeText(passwordDialog.password);
                                        toast({ title: 'Senha copiada', description: 'Copiada para a área de transferência.' });
                                    }
                                }}
                            >
                                <Copy className="h-4 w-4" /> Copiar
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setPasswordDialog(p => ({ ...p, open: false }))}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevUsers;
