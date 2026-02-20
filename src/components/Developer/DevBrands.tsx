import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

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
    const [demoBrands, setDemoBrands] = useState<DemoBrand[]>([]);
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingBrandImage, setUploadingBrandImage] = useState(false);
    const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
    const brandImageRef = useRef<HTMLInputElement>(null);
    const storeImageRef = useRef<HTMLInputElement>(null);

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

    // Edit Store form state
    const [showEditStore, setShowEditStore] = useState(false);
    const [editStoreId, setEditStoreId] = useState('');
    const [editStoreName, setEditStoreName] = useState('');
    const [editStoreAddress, setEditStoreAddress] = useState('');
    const [editStoreContact, setEditStoreContact] = useState('');
    const [editStoreManager, setEditStoreManager] = useState('');
    const [editStorePlan, setEditStorePlan] = useState<'Starter' | 'Business'>('Starter');
    const [editStorePlanValue, setEditStorePlanValue] = useState(0);
    const [editStoreStatus, setEditStoreStatus] = useState<BrandStatus>('active');
    const [editStoreImage, setEditStoreImage] = useState('');
    const editStoreImageRef = useRef<HTMLInputElement>(null);

    // Edit Brand form state
    const [showEditBrand, setShowEditBrand] = useState(false);
    const [editBrandId, setEditBrandId] = useState('');
    const [editBrandName, setEditBrandName] = useState('');
    const [editBrandResponsible, setEditBrandResponsible] = useState<SystemUser | null>(null);
    const [editBrandAdminSearch, setEditBrandAdminSearch] = useState('');
    const [editBrandStatus, setEditBrandStatus] = useState<BrandStatus>('active');

    const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    useEffect(() => {
        (async () => {
            try {
                const [brandsRes, storesRes, profilesRes, userBrandsRes] = await Promise.all([
                    supabase.from('brands').select('*').order('name'),
                    supabase.from('stores').select('*').order('name'),
                    supabase.from('profiles').select('id, name, email, role').eq('is_active', true),
                    supabase.from('user_brands').select('user_id, brand_id, role').eq('role', 'admin'),
                ]);
                const brands = brandsRes.data ?? [];
                const stores = storesRes.data ?? [];
                const profiles = profilesRes.data ?? [];
                const userBrands = userBrandsRes.data ?? [];
                setSystemUsers(profiles.map((p: any) => ({ id: p.id, name: p.name || p.email, email: p.email, role: p.role || 'assistant' })));

                // Map user_id -> profile name for brand admin lookup
                const profilesMap = new Map(profiles.map((p: any) => [p.id, p.name || p.email]));
                // Map brand_id -> admin name
                const brandAdminMap = new Map<string, string>();
                for (const ub of userBrands) {
                    const name = profilesMap.get(ub.user_id);
                    if (name) brandAdminMap.set(ub.brand_id, name);
                }

                const brandsMap = new Map<string, DemoBrand>();
                for (const b of brands) {
                    brandsMap.set(b.id, {
                        id: b.id,
                        name: b.name,
                        storesCount: b.stores_count ?? 0,
                        responsible: brandAdminMap.get(b.id) || '-',
                        monthlyRevenue: 0,
                        totalRevenue: 0,
                        status: 'active',
                        stores: [],
                    });
                }
                for (const s of stores) {
                    const brand = brandsMap.get(s.brand_id);
                    if (brand) {
                        brand.stores.push({
                            id: s.id,
                            name: s.name,
                            address: s.address || '',
                            responsible: s.manager || '-',
                            contact: s.contact || '',
                            plan: (s as any).plan || 'Starter',
                            planValue: (s as any).plan_value ?? 0,
                            status: s.is_active ? 'active' : 'inactive',
                            imageUrl: (s as any).image_url || undefined,
                        });
                        brand.storesCount = brand.stores.length;
                        // Compute revenue as sum of all store plan values
                        brand.monthlyRevenue = brand.stores.reduce((sum, st) => sum + st.planValue, 0);
                        brand.totalRevenue = brand.monthlyRevenue;
                    }
                }
                setDemoBrands(Array.from(brandsMap.values()));
            } catch (_) {
                setDemoBrands([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.type === 'brand') {
                const { error } = await supabase.from('brands').delete().eq('id', deleteTarget.id);
                if (error) throw error;
                setDemoBrands(prev => prev.filter(b => b.id !== deleteTarget.id));
                if (selectedBrand?.id === deleteTarget.id) setSelectedBrand(null);
                toast({ title: 'Marca excluída com sucesso!' });
            } else {
                const { error } = await supabase.from('stores').delete().eq('id', deleteTarget.id);
                if (error) throw error;
                setDemoBrands(prev => prev.map(b => ({
                    ...b,
                    stores: b.stores.filter(s => s.id !== deleteTarget.id),
                    storesCount: b.stores.filter(s => s.id !== deleteTarget.id).length,
                })));
                toast({ title: 'Loja excluída com sucesso!' });
            }
        } catch (e: any) {
            toast({ title: 'Erro ao excluir', description: e?.message || 'Tente novamente.', variant: 'destructive' });
        } finally {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        }
    };

    const filteredAdminUsers = systemUsers.filter(u =>
        u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(adminSearch.toLowerCase())
    );

    const filteredStoreAdminUsers = systemUsers.filter(u =>
        u.name.toLowerCase().includes(storeAdminSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(storeAdminSearch.toLowerCase())
    );

    const handleImageUpload = async (file: File, target: 'brand' | 'store'): Promise<string | null> => {
        const setUploading = target === 'brand' ? setUploadingBrandImage : setUploadingStoreImage;
        const setImage = target === 'brand' ? setNewBrandImage : setNewStoreImage;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop() || 'png';
            const path = `${target}s/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('brand-images').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('brand-images').getPublicUrl(path);
            setImage(urlData.publicUrl);
            toast({ title: 'Imagem carregada!' });
            return urlData.publicUrl;
        } catch (e: any) {
            toast({ title: 'Erro ao carregar imagem', description: e?.message || 'Tente novamente.', variant: 'destructive' });
            return null;
        } finally {
            setUploading(false);
        }
    };

    const resetCreateBrand = () => {
        setNewBrandName('');
        setNewBrandImage('');
        setAdminSearch('');
        setSelectedAdmin(null);
        setShowCreateBrand(false);
    };

    const handleCreateBrand = async () => {
        if (!newBrandName) return;
        try {
            const { data: created, error } = await supabase.from('brands').insert({
                name: newBrandName,
                logo_url: newBrandImage || null,
                primary_color: '#6366f1',
            }).select().single();
            if (error) throw error;
            // Link admin user to brand only when one is selected.
            if (selectedAdmin) {
                const { error: linkError } = await supabase.from('user_brands').insert({
                    user_id: selectedAdmin.id,
                    brand_id: created.id,
                    role: 'admin',
                    is_primary: true,
                });
                if (linkError) {
                    throw linkError;
                }
            }
            setDemoBrands(prev => [...prev, {
                id: created.id,
                name: created.name,
                storesCount: 0,
                responsible: selectedAdmin?.name || '-',
                monthlyRevenue: 0,
                totalRevenue: 0,
                status: 'active' as BrandStatus,
                stores: [],
                imageUrl: newBrandImage || undefined,
            }]);
            toast({
                title: 'Marca criada com sucesso!',
                description: selectedAdmin
                    ? `Marca criada e vinculada ao administrador ${selectedAdmin.name}.`
                    : 'Marca criada sem administrador vinculado.',
            });
            resetCreateBrand();
        } catch (e: any) {
            toast({ title: 'Erro ao criar marca', description: e?.message || 'Tente novamente.', variant: 'destructive' });
        }
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

    const handleAddStore = async () => {
        if (!newStoreName || !newStoreAddress || !selectedStoreAdmin || !selectedBrand) return;
        try {
            const { data: created, error } = await supabase.from('stores').insert({
                brand_id: selectedBrand.id,
                name: newStoreName,
                address: newStoreAddress,
                manager: selectedStoreAdmin.name,
                contact: '',
                is_active: true,
            }).select().single();
            if (error) throw error;
            setDemoBrands(prev => prev.map(b => {
                if (b.id !== selectedBrand.id) return b;
                return {
                    ...b,
                    storesCount: b.storesCount + 1,
                    stores: [...b.stores, {
                        id: created.id,
                        name: created.name,
                        address: created.address || '',
                        responsible: created.manager || '-',
                        contact: created.contact || '',
                        plan: newStorePlan,
                        planValue: 0,
                        status: 'active' as BrandStatus,
                    }],
                };
            }));
            // Update selectedBrand too
            setSelectedBrand(prev => prev ? {
                ...prev,
                storesCount: prev.storesCount + 1,
                stores: [...prev.stores, {
                    id: created.id,
                    name: created.name,
                    address: created.address || '',
                    responsible: created.manager || '-',
                    contact: created.contact || '',
                    plan: newStorePlan,
                    planValue: 0,
                    status: 'active' as BrandStatus,
                }],
            } : null);
            toast({ title: 'Loja adicionada com sucesso!' });
            resetAddStore();
        } catch (e: any) {
            toast({ title: 'Erro ao adicionar loja', description: e?.message || 'Tente novamente.', variant: 'destructive' });
        }
    };

    const openEditStore = (store: DemoStore) => {
        setEditStoreId(store.id);
        setEditStoreName(store.name);
        setEditStoreAddress(store.address);
        setEditStoreContact(store.contact);
        setEditStoreManager(store.responsible);
        setEditStorePlan(store.plan);
        setEditStorePlanValue(store.planValue);
        setEditStoreStatus(store.status);
        setEditStoreImage(store.imageUrl || '');
        setShowEditStore(true);
    };

    const handleEditStore = async () => {
        if (!editStoreId || !editStoreName) return;
        try {
            const { error } = await supabase.from('stores').update({
                name: editStoreName,
                address: editStoreAddress,
                contact: editStoreContact,
                manager: editStoreManager,
                plan: editStorePlan,
                plan_value: editStorePlanValue,
                is_active: editStoreStatus === 'active',
                image_url: editStoreImage || null,
            }).eq('id', editStoreId);
            if (error) throw error;
            const updateStore = (stores: DemoStore[]) => stores.map(s =>
                s.id === editStoreId ? { ...s, name: editStoreName, address: editStoreAddress, contact: editStoreContact, responsible: editStoreManager, plan: editStorePlan, planValue: editStorePlanValue, status: editStoreStatus, imageUrl: editStoreImage || undefined } : s
            );
            setDemoBrands(prev => prev.map(b => ({ ...b, stores: updateStore(b.stores) })));
            setSelectedBrand(prev => prev ? { ...prev, stores: updateStore(prev.stores) } : null);
            toast({ title: 'Loja atualizada com sucesso!' });
            setShowEditStore(false);
        } catch (e: any) {
            toast({ title: 'Erro ao atualizar loja', description: e?.message || 'Tente novamente.', variant: 'destructive' });
        }
    };

    const openEditBrand = (brand: DemoBrand) => {
        setEditBrandId(brand.id);
        setEditBrandName(brand.name);
        // Find the current admin user by name
        const adminUser = systemUsers.find(u => u.name === brand.responsible) || null;
        setEditBrandResponsible(adminUser);
        setEditBrandAdminSearch('');
        setEditBrandStatus(brand.status);
        setShowEditBrand(true);
    };

    const handleEditBrand = async () => {
        if (!editBrandId || !editBrandName) return;
        try {
            const { error } = await supabase.from('brands').update({
                name: editBrandName,
            }).eq('id', editBrandId);
            if (error) throw error;
            // Update admin user_brands if a responsible was selected
            if (editBrandResponsible) {
                // Remove existing admin link and add new one
                await supabase.from('user_brands').delete().eq('brand_id', editBrandId).eq('role', 'admin');
                await supabase.from('user_brands').insert({
                    user_id: editBrandResponsible.id,
                    brand_id: editBrandId,
                    role: 'admin',
                    is_primary: true,
                });
            }
            const responsibleName = editBrandResponsible?.name || '-';
            setDemoBrands(prev => prev.map(b =>
                b.id === editBrandId ? { ...b, name: editBrandName, responsible: responsibleName, status: editBrandStatus } : b
            ));
            setSelectedBrand(prev => prev && prev.id === editBrandId ? { ...prev, name: editBrandName, responsible: responsibleName, status: editBrandStatus } : prev);
            toast({ title: 'Marca atualizada com sucesso!' });
            setShowEditBrand(false);
        } catch (e: any) {
            toast({ title: 'Erro ao atualizar marca', description: e?.message || 'Tente novamente.', variant: 'destructive' });
        }
    };

    // Brand Detail View
    if (selectedBrand) {
        const brandTotalRevenue = selectedBrand.stores.reduce((s, st) => s + st.planValue, 0);
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
                        <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(brandTotalRevenue)}</p>
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
                                    <th className="text-left p-3 font-semibold text-gray-600">Foto</th>
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
                                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">Nenhuma loja cadastrada</td></tr>
                                ) : (
                                    selectedBrand.stores.map(store => (
                                        <tr key={store.id} className="border-b hover:bg-gray-50/50">
                                            <td className="p-3">
                                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-gray-400" />}
                                                </div>
                                            </td>
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
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar" onClick={() => openEditStore(store)}>
                                                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                                                    </Button>
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

                {/* Edit Store Dialog */}
                <Dialog open={showEditStore} onOpenChange={(open) => { if (!open) setShowEditStore(false); }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="h-5 w-5 text-blue-600" /> Editar Loja
                            </DialogTitle>
                            <DialogDescription>Altere os dados da loja</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Foto da Loja</Label>
                                <div className="flex items-center gap-3">
                                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                        {editStoreImage ? <img src={editStoreImage} alt="Store" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-400" />}
                                    </div>
                                    <input ref={editStoreImageRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await handleImageUpload(f, 'store'); if (url) setEditStoreImage(url); } }} />
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => editStoreImageRef.current?.click()}>
                                        <Upload className="h-3.5 w-3.5" /> Carregar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome da Loja *</Label>
                                <Input value={editStoreName} onChange={e => setEditStoreName(e.target.value)} placeholder="Nome da loja" />
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço *</Label>
                                <Input value={editStoreAddress} onChange={e => setEditStoreAddress(e.target.value)} placeholder="Endereço" />
                            </div>
                            <div className="space-y-2">
                                <Label>Responsável</Label>
                                <Input value={editStoreManager} onChange={e => setEditStoreManager(e.target.value)} placeholder="Nome do responsável" />
                            </div>
                            <div className="space-y-2">
                                <Label>Contacto</Label>
                                <Input value={editStoreContact} onChange={e => setEditStoreContact(e.target.value)} placeholder="Telefone ou email" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plano</Label>
                                    <Select value={editStorePlan} onValueChange={v => setEditStorePlan(v as 'Starter' | 'Business')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Starter">Starter</SelectItem>
                                            <SelectItem value="Business">Business</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor do Plano (€)</Label>
                                    <Input type="number" value={editStorePlanValue} onChange={e => setEditStorePlanValue(Number(e.target.value))} placeholder="0" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editStoreStatus} onValueChange={v => setEditStoreStatus(v as BrandStatus)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="inactive">Inativa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditStore(false)}>Cancelar</Button>
                            <Button disabled={!editStoreName} onClick={handleEditStore} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> Salvar
                            </Button>
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
                                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                        {newStoreImage ? <img src={newStoreImage} alt="Store" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-400" />}
                                    </div>
                                    <input ref={storeImageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'store'); }} />
                                    <Button variant="outline" size="sm" className="gap-2" disabled={uploadingStoreImage} onClick={() => storeImageRef.current?.click()}>
                                        <Upload className="h-3.5 w-3.5" /> {uploadingStoreImage ? 'A enviar...' : 'Carregar'}
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
                            <Button disabled={!newStoreName || !newStoreAddress || !selectedStoreAdmin} onClick={handleAddStore} className="gap-2">
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

            {loading && <p className="text-gray-500">A carregar marcas...</p>}

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
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedBrand(brand)} title="Ver Lojas">
                                                <Store className="h-3.5 w-3.5 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditBrand(brand)} title="Editar Marca">
                                                <Edit className="h-3.5 w-3.5 text-amber-600" />
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
                                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {newBrandImage ? <img src={newBrandImage} alt="Brand" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-400" />}
                                </div>
                                <input ref={brandImageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'brand'); }} />
                                <Button variant="outline" size="sm" className="gap-2" disabled={uploadingBrandImage} onClick={() => brandImageRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5" /> {uploadingBrandImage ? 'A enviar...' : 'Carregar'}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Administrador da Marca (opcional)</Label>
                            <p className="text-xs text-gray-500">Se quiser, selecione um utilizador para já ficar vinculado como admin da marca.</p>
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
                        <Button disabled={!newBrandName} onClick={handleCreateBrand} className="gap-2">
                            <Plus className="h-4 w-4" /> Criar Marca
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Brand Dialog */}
            <Dialog open={showEditBrand} onOpenChange={(open) => { if (!open) setShowEditBrand(false); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-amber-600" /> Editar Marca
                        </DialogTitle>
                        <DialogDescription>Altere os dados da marca</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Marca *</Label>
                            <Input value={editBrandName} onChange={e => setEditBrandName(e.target.value)} placeholder="Nome da marca" />
                        </div>
                        <div className="space-y-2">
                            <Label>Responsável / Admin da Marca</Label>
                            {editBrandResponsible ? (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-700">
                                        {editBrandResponsible.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{editBrandResponsible.name}</p>
                                        <p className="text-xs text-gray-500">{editBrandResponsible.email}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditBrandResponsible(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Buscar utilizador por nome ou email..." value={editBrandAdminSearch} onChange={e => setEditBrandAdminSearch(e.target.value)} className="pl-10" />
                                    </div>
                                    {editBrandAdminSearch.length >= 2 && (
                                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                                            {systemUsers.filter(u => u.name.toLowerCase().includes(editBrandAdminSearch.toLowerCase()) || u.email.toLowerCase().includes(editBrandAdminSearch.toLowerCase())).length === 0 ? (
                                                <p className="p-3 text-sm text-gray-500 text-center">Nenhum utilizador encontrado</p>
                                            ) : (
                                                systemUsers.filter(u => u.name.toLowerCase().includes(editBrandAdminSearch.toLowerCase()) || u.email.toLowerCase().includes(editBrandAdminSearch.toLowerCase())).map(u => (
                                                    <button key={u.id} onClick={() => { setEditBrandResponsible(u); setEditBrandAdminSearch(''); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
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
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editBrandStatus} onValueChange={v => setEditBrandStatus(v as BrandStatus)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Ativa</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="inactive">Inativa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditBrand(false)}>Cancelar</Button>
                        <Button disabled={!editBrandName} onClick={handleEditBrand} className="gap-2">
                            <CheckCircle className="h-4 w-4" /> Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevBrands;
