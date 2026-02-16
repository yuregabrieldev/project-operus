import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User, Mail, Camera, Save, MapPin, Phone, Store, CheckCircle, Shield, Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { toast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { selectedBrand, stores } = useBrand();

    const [name, setName] = useState(user?.name || '');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (n: string) =>
        n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const handleSave = () => {
        if (!name.trim()) {
            toast({ title: 'O nome não pode estar vazio', variant: 'destructive' });
            return;
        }
        updateUser({ name: name.trim() });
        setIsEditing(false);
        toast({ title: 'Perfil atualizado com sucesso!' });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            updateUser({ imageUrl: reader.result as string });
            toast({ title: 'Foto atualizada!' });
        };
        reader.readAsDataURL(file);
    };

    // Filter stores for the selected brand
    const brandStores = stores.filter(s => s.brandId === selectedBrand?.id);

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
                    <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e visualize suas lojas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar Profile Card */}
                    <Card className="md:col-span-1 shadow-sm border h-fit">
                        <CardHeader className="items-center pb-2 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-primary/5 -z-10" />
                            <div className="relative group mt-8">
                                {user?.imageUrl ? (
                                    <img
                                        src={user.imageUrl}
                                        alt={user.name}
                                        className="w-32 h-32 rounded-full border-4 border-background object-cover shadow-sm"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-secondary-foreground text-3xl font-bold shadow-sm">
                                        {user?.name ? getInitials(user.name) : 'U'}
                                    </div>
                                )}
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center mt-4">
                                <h2 className="text-xl font-bold">{user?.name}</h2>
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <Mail className="h-3 w-3" /> {user?.email}
                                </p>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Funcionário'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 space-y-4">
                            <Separator />
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Função</span>
                                    <span className="font-medium">{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Status</span>
                                    <span className="font-medium text-green-600">Ativo</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Acesso</span>
                                    <span className="font-medium">Total</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content Actions */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Edit Profile Form */}
                        <Card className="shadow-sm border">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Informações Pessoais
                                </CardTitle>
                                <CardDescription>Atualize seus dados de identificação.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo</Label>
                                        <div className="relative">
                                            {isEditing ? (
                                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                                            ) : (
                                                <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                                    {user?.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-50">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => { setIsEditing(false); setName(user?.name || ''); }}>Cancelar</Button>
                                            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" onClick={() => setIsEditing(true)}>Editar Informações</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current Brand / Stores */}
                        {selectedBrand && (
                            <Card className="shadow-sm border">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Store className="h-4 w-4 text-primary" /> Lojas Vinculadas
                                        <Badge variant="outline" className="ml-2">{brandStores.length}</Badge>
                                    </CardTitle>
                                    <CardDescription>Gerenciando lojas da marca <strong>{selectedBrand.name}</strong></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {brandStores.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Nenhuma loja vinculada.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {brandStores.map(store => (
                                                <div key={store.id} className="group relative flex items-start space-x-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                                    <div
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold shadow-sm"
                                                        style={{ backgroundColor: selectedBrand.primaryColor || '#000' }}
                                                    >
                                                        {store.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="text-sm font-semibold text-foreground truncate">{store.name}</h4>
                                                            <Badge variant={store.isActive ? 'default' : 'destructive'} className="h-5 text-[10px] px-1.5">
                                                                {store.isActive ? 'Ativa' : 'Inativa'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {store.address}
                                                        </p>
                                                        {store.contact && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3" /> {store.contact}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
