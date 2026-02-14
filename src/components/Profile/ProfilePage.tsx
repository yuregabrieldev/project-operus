import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    User, Mail, Camera, Save, MapPin, Phone, Store, CheckCircle
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Meu Perfil
                    </h1>
                    <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
                </div>

                {/* Profile Card */}
                <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm overflow-hidden">
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                    <CardContent className="p-6 pt-0 relative">
                        {/* Avatar */}
                        <div className="relative -mt-16 mb-4 flex items-end gap-6">
                            <div className="relative group">
                                {user?.imageUrl ? (
                                    <img
                                        src={user.imageUrl}
                                        alt={user.name}
                                        className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                        {user?.name ? getInitials(user.name) : 'U'}
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="pb-2">
                                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                                <p className="text-gray-500 flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {user?.email}
                                </p>
                                <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Funcionário'}
                                </Badge>
                            </div>
                        </div>

                        {/* Info Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <Label className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    Nome de Usuário
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11"
                                    />
                                ) : (
                                    <div className="h-11 px-3 flex items-center bg-gray-50 rounded-md border text-gray-700 font-medium">
                                        {user?.name}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    Email
                                </Label>
                                <div className="h-11 px-3 flex items-center bg-gray-100 rounded-md border text-gray-500 cursor-not-allowed">
                                    {user?.email}
                                </div>
                                <p className="text-xs text-gray-400">O email não pode ser editado</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            {isEditing ? (
                                <>
                                    <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Save className="h-4 w-4 mr-2" />
                                        Salvar Alterações
                                    </Button>
                                    <Button variant="outline" onClick={() => { setIsEditing(false); setName(user?.name || ''); }}>
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    Editar Perfil
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Current Brand */}
                {selectedBrand && (
                    <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Marca Atual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                                    style={{ backgroundColor: selectedBrand.primaryColor }}
                                >
                                    {selectedBrand.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedBrand.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedBrand.storesCount} lojas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stores List */}
                <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Store className="h-5 w-5 text-blue-600" />
                            Lojas
                            <Badge variant="outline" className="ml-2">{brandStores.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {brandStores.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>Nenhuma loja encontrada para esta marca</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {brandStores.map(store => (
                                    <div
                                        key={store.id}
                                        className="p-4 rounded-xl border bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-4"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: selectedBrand?.primaryColor || '#3B82F6' }}
                                        >
                                            {store.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{store.name}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                                {store.address}
                                            </p>
                                            {store.contact && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                                    {store.contact}
                                                </p>
                                            )}
                                        </div>
                                        <div className="ml-auto">
                                            <Badge className={store.isActive
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-red-100 text-red-700 border-red-200'
                                            }>
                                                {store.isActive ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
