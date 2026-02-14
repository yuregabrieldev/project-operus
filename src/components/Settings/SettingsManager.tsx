import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, Package, Truck, Bell, Shield, Download, Upload, Plus, Edit, Trash2,
  Globe, Clock, DollarSign, Lock, Key, Eye, EyeOff, AlertTriangle, Save,
  Database, HardDrive, Mail, MessageSquare, CheckCircle
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SettingsManager: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { stores, categories, suppliers, addSupplier, deleteSupplier, addCategory, deleteCategory, products } = useData();

  const [activeTab, setActiveTab] = useState('general');

  // General settings state
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [currency, setCurrency] = useState('EUR');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');

  // Notifications state
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifOverdueInvoices, setNotifOverdueInvoices] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifLicenseExpiry, setNotifLicenseExpiry] = useState(true);
  const [notifWasteAlert, setNotifWasteAlert] = useState(false);
  const [notifChecklistDue, setNotifChecklistDue] = useState(true);

  // Category dialog
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [catName, setCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Supplier dialog
  const [showSupDialog, setShowSupDialog] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'categories', label: t('settings.categories'), icon: Package },
    { id: 'suppliers', label: t('settings.suppliers'), icon: Truck },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'backup', label: t('settings.backup'), icon: Download },
  ];

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  // ─── General Tab ───
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Idioma e Região
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold">Idioma</Label>
              <Select value={language} onValueChange={(v) => { setLanguage(v as 'pt' | 'en' | 'es'); toast({ title: 'Idioma alterado!' }); }}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">América/São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="Europe/Lisbon">Europa/Lisboa (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Madrid">Europa/Madrid (GMT+1)</SelectItem>
                  <SelectItem value="America/New_York">América/Nova York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Moeda e Formato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold">Moeda Padrão</Label>
              <Select value={currency} onValueChange={(v) => { setCurrency(v); toast({ title: 'Moeda atualizada!' }); }}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="GBP">Libra (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Formato de Data</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                  <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Notifications Tab ───
  const renderNotificationsTab = () => (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-1">
        {/* Stock alerts */}
        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.low_stock_alerts')}</h4>
              <p className="text-sm text-gray-500">{t('settings.low_stock_description')}</p>
            </div>
          </div>
          <Switch checked={notifLowStock} onCheckedChange={setNotifLowStock} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.overdue_invoices')}</h4>
              <p className="text-sm text-gray-500">{t('settings.overdue_description')}</p>
            </div>
          </div>
          <Switch checked={notifOverdueInvoices} onCheckedChange={setNotifOverdueInvoices} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Expiração de Licenças</h4>
              <p className="text-sm text-gray-500">Receber alertas quando licenças estiverem próximas do vencimento</p>
            </div>
          </div>
          <Switch checked={notifLicenseExpiry} onCheckedChange={setNotifLicenseExpiry} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Alerta de Desperdício</h4>
              <p className="text-sm text-gray-500">Notificar quando o desperdício ultrapassar limites definidos</p>
            </div>
          </div>
          <Switch checked={notifWasteAlert} onCheckedChange={setNotifWasteAlert} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Checklists Pendentes</h4>
              <p className="text-sm text-gray-500">Lembrar checklists que precisam ser executados</p>
            </div>
          </div>
          <Switch checked={notifChecklistDue} onCheckedChange={setNotifChecklistDue} />
        </div>

        <hr className="my-4" />

        <h3 className="text-lg font-bold text-gray-700 px-4 pt-2">Canais de Notificação</h3>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.email_notifications')}</h4>
              <p className="text-sm text-gray-500">{t('settings.email_description')}</p>
            </div>
          </div>
          <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Notificações Push</h4>
              <p className="text-sm text-gray-500">Receber notificações em tempo real no navegador</p>
            </div>
          </div>
          <Switch checked={notifPush} onCheckedChange={setNotifPush} />
        </div>

        <div className="px-4 pt-4">
          <Button onClick={() => toast({ title: 'Notificações salvas!' })} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ─── Categories Tab ───
  const [showCatAddDialog, setShowCatAddDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const renderCategoriesTab = () => (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Categorias
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{categories.length}</Badge>
          </div>
          <Button size="sm" onClick={() => { setNewCatName(''); setShowCatAddDialog(true); }} className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold text-center">Produtos</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(cat => {
              const productCount = products.filter(p => p.categoryId === cat.id).length;
              return (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-center text-gray-500">{productCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (productCount > 0) {
                          toast({ title: 'Não é possível excluir', description: `Esta categoria tem ${productCount} produto(s) associado(s)`, variant: 'destructive' });
                          return;
                        }
                        deleteCategory(cat.id);
                        toast({ title: 'Categoria removida!' });
                      }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {categories.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma categoria cadastrada</p>
          </div>
        )}
      </CardContent>

      {/* Category Create Dialog */}
      <Dialog open={showCatAddDialog} onOpenChange={setShowCatAddDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Categoria *</Label>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Frutas, Bebidas..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatAddDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!newCatName.trim()) return;
              addCategory({ name: newCatName.trim() });
              toast({ title: 'Categoria criada!' });
              setShowCatAddDialog(false);
            }} className="bg-gradient-to-r from-purple-600 to-indigo-600">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ─── Suppliers Tab ───
  const renderSuppliersTab = () => (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-teal-50">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-teal-600" />
            Fornecedores
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{suppliers.length}</Badge>
          </div>
          <Button size="sm" onClick={() => { setSupName(''); setSupContact(''); setSupEmail(''); setShowSupDialog(true); }} className="bg-gradient-to-r from-teal-600 to-green-600">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Contato</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map(sup => (
              <TableRow key={sup.id}>
                <TableCell className="font-medium">{sup.name}</TableCell>
                <TableCell className="text-gray-600">{sup.contact}</TableCell>
                <TableCell className="text-gray-600">{sup.email}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => { deleteSupplier(sup.id); toast({ title: 'Fornecedor removido!' }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum fornecedor cadastrado</p>
          </div>
        )}
      </CardContent>

      {/* Add Supplier Dialog */}
      <Dialog open={showSupDialog} onOpenChange={setShowSupDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Nome do fornecedor" className="mt-1" />
            </div>
            <div>
              <Label>Contato</Label>
              <Input value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder="Telefone" className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="email@exemplo.com" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!supName.trim()) return;
              addSupplier({ name: supName.trim(), contact: supContact.trim(), email: supEmail.trim() });
              toast({ title: 'Fornecedor adicionado!' });
              setShowSupDialog(false);
            }} className="bg-gradient-to-r from-teal-600 to-green-600">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ─── Security Tab ───
  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Senha Atual</Label>
            <div className="relative">
              <Input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Nova Senha</Label>
            <div className="relative">
              <Input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Confirmar Nova Senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">As senhas não coincidem</p>
            )}
          </div>
          <Button onClick={() => {
            if (!currentPassword || !newPassword) { toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return; }
            if (newPassword !== confirmPassword) { toast({ title: 'As senhas não coincidem', variant: 'destructive' }); return; }
            if (newPassword.length < 6) { toast({ title: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' }); return; }
            toast({ title: 'Senha alterada com sucesso!' });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
          }} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
            <Key className="h-4 w-4 mr-2" />
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Segurança da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50">
            <div>
              <h4 className="font-semibold text-gray-800">Autenticação de Dois Fatores (2FA)</h4>
              <p className="text-sm text-gray-500">Adiciona uma camada extra de segurança à sua conta</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={(v) => { setTwoFactor(v); toast({ title: v ? '2FA ativado!' : '2FA desativado!' }); }} />
          </div>
          <div className="p-4 rounded-xl hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">Tempo Limite da Sessão</h4>
                <p className="text-sm text-gray-500">Desconectar automaticamente após inatividade</p>
              </div>
              <Select value={sessionTimeout} onValueChange={(v) => { setSessionTimeout(v); toast({ title: `Sessão: ${v} minutos` }); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Backup Tab ───
  const exportData = () => {
    const data = {
      stores,
      categories,
      suppliers,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operus-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t('settings.backup_created'), description: t('settings.backup_downloaded') });
  };

  const renderBackupTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Exportar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-gray-600">{t('settings.export_description')}</p>
          <div className="flex gap-3">
            <Button onClick={exportData} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-600" />
            Importar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-gray-600">{t('settings.import_description')}</p>
          <Button variant="outline" disabled>
            <Upload className="h-4 w-4 mr-2" />
            {t('settings.import_file')}
          </Button>
          <p className="text-sm text-gray-500">{t('settings.import_coming_soon')}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-xs">Versão</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-xs">Último Backup</p>
              <p className="font-semibold">Nunca</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-xs">Base de Dados</p>
              <p className="font-semibold">Local Storage</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-xs">Total de Registros</p>
              <p className="font-semibold">{stores.length + categories.length + suppliers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab Router ───
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'notifications': return renderNotificationsTab();
      case 'categories': return renderCategoriesTab();
      case 'suppliers': return renderSuppliersTab();
      case 'security': return renderSecurityTab();
      case 'backup': return renderBackupTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
