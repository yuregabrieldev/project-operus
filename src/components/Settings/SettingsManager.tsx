import React, { useState, useRef } from 'react';
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
  Database, HardDrive, Mail, MessageSquare, CheckCircle, FileText, Calendar,
  ChevronDown, ChevronUp, CreditCard, X, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SettingsManager: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { stores, categories, suppliers, addSupplier, deleteSupplier, addCategory, deleteCategory, products, addProduct } = useData();

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

  // Import products state
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});
  const importFileRef = useRef<HTMLInputElement>(null);

  // Subscription state
  const [expandedSubscription, setExpandedSubscription] = useState<string | null>(null);

  // Demo subscription data
  const subscriptionData = stores.map(store => ({
    storeId: store.id,
    storeName: store.name,
    plan: store.id === '1' ? 'Business' : 'Starter',
    periodicity: store.id === '1' ? 'Anual' : 'Mensal',
    startDate: '2025-01-01',
    endDate: store.id === '1' ? '2026-01-01' : '2025-07-01',
    documents: store.id === '1' ? [
      { id: 'd1', description: 'Contrato de Assinatura Business', date: '2025-01-01', value: 1200, filename: 'contrato_business_2025.pdf' },
      { id: 'd2', description: 'Fatura Janeiro 2025', date: '2025-01-15', value: 100, filename: 'fatura_jan_2025.pdf' },
    ] : [
      { id: 'd3', description: 'Contrato de Assinatura Starter', date: '2025-01-01', value: 480, filename: 'contrato_starter_2025.pdf' },
    ],
  }));

  const tabs = [
    { id: 'general', label: t('settings.general'), icon: Settings },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'categories', label: t('settings.categories'), icon: Package },
    { id: 'suppliers', label: t('settings.suppliers'), icon: Truck },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'backup', label: t('settings.backup'), icon: Download },
    { id: 'assinatura', label: t('settings.subscription'), icon: CreditCard },
  ];

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  // ─── General Tab ───
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.languageAndRegion')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold">{t('settings.language')}</Label>
              <Select value={language} onValueChange={(v) => { setLanguage(v as 'pt' | 'en' | 'es'); toast({ title: t('settings.languageChanged') }); }}>
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
              <Label className="font-semibold">{t('settings.timezone')}</Label>
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

      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('settings.currencyAndFormat')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold">{t('settings.defaultCurrency')}</Label>
              <Select value={currency} onValueChange={(v) => { setCurrency(v); toast({ title: t('settings.currencyUpdated') }); }}>
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
              <Label className="font-semibold">{t('settings.dateFormat')}</Label>
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
    <Card className="shadow-sm border bg-card">
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t('settings.notifications')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-1">
        {/* Stock alerts */}
        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.low_stock_alerts')}</h4>
              <p className="text-sm text-gray-500">{t('settings.low_stock_description')}</p>
            </div>
          </div>
          <Switch checked={notifLowStock} onCheckedChange={setNotifLowStock} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.overdue_invoices')}</h4>
              <p className="text-sm text-gray-500">{t('settings.overdue_description')}</p>
            </div>
          </div>
          <Switch checked={notifOverdueInvoices} onCheckedChange={setNotifOverdueInvoices} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.licenseExpiry')}</h4>
              <p className="text-sm text-gray-500">{t('settings.licenseExpiryDesc')}</p>
            </div>
          </div>
          <Switch checked={notifLicenseExpiry} onCheckedChange={setNotifLicenseExpiry} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.wasteAlert')}</h4>
              <p className="text-sm text-gray-500">{t('settings.wasteAlertDesc')}</p>
            </div>
          </div>
          <Switch checked={notifWasteAlert} onCheckedChange={setNotifWasteAlert} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.pendingChecklists')}</h4>
              <p className="text-sm text-gray-500">{t('settings.pendingChecklistsDesc')}</p>
            </div>
          </div>
          <Switch checked={notifChecklistDue} onCheckedChange={setNotifChecklistDue} />
        </div>

        <hr className="my-4" />

        <h3 className="text-lg font-bold px-4 pt-2">{t('settings.notificationChannels')}</h3>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.email_notifications')}</h4>
              <p className="text-sm text-gray-500">{t('settings.email_description')}</p>
            </div>
          </div>
          <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{t('settings.pushNotifications')}</h4>
              <p className="text-sm text-gray-500">{t('settings.pushNotificationsDesc')}</p>
            </div>
          </div>
          <Switch checked={notifPush} onCheckedChange={setNotifPush} />
        </div>

        <div className="px-4 pt-4">
          <Button onClick={() => toast({ title: t('settings.notificationsSaved') })}>
            <Save className="h-4 w-4 mr-2" />
            {t('settings.savePreferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ─── Categories Tab ───
  const [showCatAddDialog, setShowCatAddDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const renderCategoriesTab = () => (
    <Card className="shadow-sm border bg-card">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('settings.categories')}
            <Badge variant="outline">{categories.length}</Badge>
          </div>
          <Button size="sm" onClick={() => { setNewCatName(''); setShowCatAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.newCategory')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">{t('settings.name')}</TableHead>
              <TableHead className="font-semibold text-center">{t('settings.products')}</TableHead>
              <TableHead className="font-semibold text-right">{t('settings.actions')}</TableHead>
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
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (productCount > 0) {
                          toast({ title: t('settings.cannotDelete'), description: t('settings.categoryHasProducts', { count: productCount }), variant: 'destructive' });
                          return;
                        }
                        deleteCategory(cat.id);
                        toast({ title: t('settings.categoryRemoved') });
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
            <p className="text-gray-500">{t('settings.noCategories')}</p>
          </div>
        )}
      </CardContent>

      {/* Category Create Dialog */}
      <Dialog open={showCatAddDialog} onOpenChange={setShowCatAddDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{t('settings.newCategory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('settings.categoryNameRequired')}</Label>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder={t('settings.categoryNamePlaceholder')} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatAddDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => {
              if (!newCatName.trim()) return;
              addCategory({ name: newCatName.trim() });
              toast({ title: t('settings.categoryCreated') });
              setShowCatAddDialog(false);
            }}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ─── Suppliers Tab ───
  const renderSuppliersTab = () => (
    <Card className="shadow-sm border bg-card">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {t('settings.suppliers')}
            <Badge variant="outline">{suppliers.length}</Badge>
          </div>
          <Button size="sm" onClick={() => { setSupName(''); setSupContact(''); setSupEmail(''); setShowSupDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.newSupplier')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">{t('settings.name')}</TableHead>
              <TableHead className="font-semibold">{t('settings.contact')}</TableHead>
              <TableHead className="font-semibold">{t('settings.email')}</TableHead>
              <TableHead className="font-semibold text-right">{t('settings.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map(sup => (
              <TableRow key={sup.id}>
                <TableCell className="font-medium">{sup.name}</TableCell>
                <TableCell className="text-muted-foreground">{sup.contact}</TableCell>
                <TableCell className="text-muted-foreground">{sup.email}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"
                    onClick={() => { deleteSupplier(sup.id); toast({ title: t('settings.supplierRemoved') }); }}>
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
            <p className="text-gray-500">{t('settings.noSuppliers')}</p>
          </div>
        )}
      </CardContent>

      {/* Add Supplier Dialog */}
      <Dialog open={showSupDialog} onOpenChange={setShowSupDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('settings.newSupplier')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('settings.nameRequired')}</Label>
              <Input value={supName} onChange={(e) => setSupName(e.target.value)} placeholder={t('settings.supplierNamePlaceholder')} className="mt-1" />
            </div>
            <div>
              <Label>{t('settings.contact')}</Label>
              <Input value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder={t('settings.phone')} className="mt-1" />
            </div>
            <div>
              <Label>{t('settings.email')}</Label>
              <Input value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder={t('settings.emailPlaceholder')} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => {
              if (!supName.trim()) return;
              addSupplier({ name: supName.trim(), contact: supContact.trim(), email: supEmail.trim() });
              toast({ title: t('settings.supplierAdded') });
              setShowSupDialog(false);
            }}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // ─── Security Tab ───
  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {t('settings.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">{t('settings.currentPassword')}</Label>
            <div className="relative">
              <Input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">{t('settings.newPassword')}</Label>
            <div className="relative">
              <Input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">{t('settings.confirmNewPassword')}</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">{t('settings.passwordsDoNotMatch')}</p>
            )}
          </div>
          <Button onClick={() => {
            if (!currentPassword || !newPassword) { toast({ title: t('settings.fillAllFields'), variant: 'destructive' }); return; }
            if (newPassword !== confirmPassword) { toast({ title: t('settings.passwordsDoNotMatch'), variant: 'destructive' }); return; }
            if (newPassword.length < 6) { toast({ title: t('settings.passwordMinLength'), variant: 'destructive' }); return; }
            toast({ title: t('settings.passwordChanged') });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
          }}>
            <Key className="h-4 w-4 mr-2" />
            {t('settings.changePassword')}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('settings.accountSecurity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50">
            <div>
              <h4 className="font-semibold">{t('settings.twoFactorAuth')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.twoFactorAuthDesc')}</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={(v) => { setTwoFactor(v); toast({ title: v ? t('settings.twoFactorEnabled') : t('settings.twoFactorDisabled') }); }} />
          </div>
          <div className="p-4 rounded-xl hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{t('settings.sessionTimeout')}</h4>
                <p className="text-sm text-gray-500">{t('settings.sessionTimeoutDesc')}</p>
              </div>
              <Select value={sessionTimeout} onValueChange={(v) => { setSessionTimeout(v); toast({ title: t('settings.sessionMinutes', { v }) }); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{t('settings.minutes15')}</SelectItem>
                  <SelectItem value="30">{t('settings.minutes30')}</SelectItem>
                  <SelectItem value="60">{t('settings.hours1')}</SelectItem>
                  <SelectItem value="120">{t('settings.hours2')}</SelectItem>
                  <SelectItem value="never">{t('settings.never')}</SelectItem>
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
      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t('settings.export_data')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">{t('settings.export_description')}</p>
          <div className="flex gap-3">
            <Button onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              {t('settings.exportJSON')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t('settings.importProducts')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">{t('settings.importProductsDesc')}</p>

          <div className="p-4 bg-muted/50 rounded-lg border border-dashed space-y-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-medium text-sm text-foreground">{t('settings.importFormats')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.importColumnsHint')}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => importFileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                {t('settings.importSelectFile')}
              </Button>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => {
                const BOM = '\uFEFF';
                const template = BOM + 'nome;sku;categoria;fornecedor;preco_custo;preco_venda;codigo_barras;unidade\nExemplo Produto;SKU001;Bebidas;Fornecedor A;5.50;12.90;7891234567890;un\n';
                const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'modelo_importacao_produtos.csv'; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                {t('settings.importDownloadTemplate')}
              </Button>
            </div>

            <input
              ref={importFileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImportFileName(file.name);

                const reader = new FileReader();
                reader.onload = (evt) => {
                  try {
                    const data = evt.target?.result;
                    let rows: Record<string, string>[] = [];
                    let headers: string[] = [];

                    if (file.name.endsWith('.csv')) {
                      const text = data as string;
                      const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
                      if (lines.length < 2) { toast({ title: t('settings.importErrorEmpty'), variant: 'destructive' }); return; }
                      const sep = lines[0].includes(';') ? ';' : ',';
                      headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
                      rows = lines.slice(1).map(line => {
                        const vals = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
                        const obj: Record<string, string> = {};
                        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
                        return obj;
                      });
                    } else {
                      const workbook = XLSX.read(data, { type: 'array' });
                      const sheet = workbook.Sheets[workbook.SheetNames[0]];
                      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
                      if (jsonData.length === 0) { toast({ title: t('settings.importErrorEmpty'), variant: 'destructive' }); return; }
                      headers = Object.keys(jsonData[0]);
                      rows = jsonData.map(row => {
                        const obj: Record<string, string> = {};
                        headers.forEach(h => { obj[h] = String(row[h] ?? ''); });
                        return obj;
                      });
                    }

                    setImportHeaders(headers);
                    setImportPreview(rows);

                    const fieldMap: Record<string, string[]> = {
                      name: ['nome', 'name', 'produto', 'product', 'descripcion', 'nombre'],
                      sku: ['sku', 'codigo', 'code', 'ref', 'referencia'],
                      categoryId: ['categoria', 'category', 'categoría', 'cat'],
                      supplierId: ['fornecedor', 'supplier', 'proveedor'],
                      costPrice: ['preco_custo', 'custo', 'cost', 'cost_price', 'precio_costo', 'costo'],
                      sellingPrice: ['preco_venda', 'venda', 'price', 'selling_price', 'precio_venta', 'precio'],
                      barcode: ['codigo_barras', 'barcode', 'ean', 'gtin', 'codigo_barra'],
                      unit: ['unidade', 'unit', 'un', 'medida', 'unidad'],
                    };

                    const autoMapping: Record<string, string> = {};
                    const normalizedHeaders = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'));
                    Object.entries(fieldMap).forEach(([field, aliases]) => {
                      const idx = normalizedHeaders.findIndex(nh => aliases.some(a => nh === a || nh.includes(a)));
                      if (idx >= 0) autoMapping[field] = headers[idx];
                    });
                    setImportMapping(autoMapping);
                    setShowImportPreview(true);
                  } catch {
                    toast({ title: t('settings.importErrorParse'), variant: 'destructive' });
                  }
                };

                if (file.name.endsWith('.csv')) {
                  reader.readAsText(file, 'UTF-8');
                } else {
                  reader.readAsArrayBuffer(file);
                }
                e.target.value = '';
              }}
            />
          </div>

          {importFileName && !showImportPreview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              {importFileName}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t('settings.system_info')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-gray-500 text-xs">{t('settings.version')}</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs">{t('settings.last_backup')}</p>
              <p className="font-semibold">{t('settings.never')}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs">{t('settings.database')}</p>
              <p className="font-semibold">{t('settings.localStorage')}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground text-xs">{t('settings.totalRecords')}</p>
              <p className="font-semibold">{stores.length + categories.length + suppliers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Assinatura Tab ───
  const renderAssinaturaTab = () => (
    <div className="space-y-6">
      <Card className="shadow-sm border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('settings.storeSubscriptions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subscriptionData.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">{t('settings.noSubscriptions')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {subscriptionData.map(sub => (
                <div key={sub.storeId}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{sub.storeName}</h3>
                        <Badge variant="outline" className={sub.plan === 'Business' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-primary/10 text-primary border-primary/10'}>
                          {sub.plan}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {sub.periodicity}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold">{t('settings.startDate')}</p>
                        <p className="font-medium flex items-center gap-1 mt-1"><Calendar className="h-3.5 w-3.5 text-primary" />{new Date(sub.startDate + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground font-semibold">{t('settings.endDate')}</p>
                        <p className="font-medium flex items-center gap-1 mt-1"><Calendar className="h-3.5 w-3.5 text-destructive" />{new Date(sub.endDate + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>

                    {/* Documents Toggle */}
                    {sub.documents.length > 0 && (
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setExpandedSubscription(expandedSubscription === sub.storeId ? null : sub.storeId)}>
                          <FileText className="h-3.5 w-3.5" />
                          {t('settings.documents')} ({sub.documents.length})
                          {expandedSubscription === sub.storeId ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>

                        {expandedSubscription === sub.storeId && (
                          <div className="mt-3 border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">{t('settings.description_label')}</TableHead>
                                  <TableHead className="text-xs text-center">{t('settings.date')}</TableHead>
                                  <TableHead className="text-xs text-right">{t('settings.value')}</TableHead>
                                  <TableHead className="text-xs text-center w-20">{t('settings.file')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sub.documents.map(doc => (
                                  <TableRow key={doc.id}>
                                    <TableCell className="text-sm font-medium">{doc.description}</TableCell>
                                    <TableCell className="text-sm text-center text-muted-foreground">{new Date(doc.date + 'T12:00:00').toLocaleDateString('pt-PT')}</TableCell>
                                    <TableCell className="text-sm text-right font-semibold">
                                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(doc.value)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/10">
                                        <Download className="h-3 w-3" /> PDF
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      case 'assinatura': return renderAssinaturaTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-foreground">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Import Products Preview Dialog */}
      <Dialog open={showImportPreview} onOpenChange={setShowImportPreview}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              {t('settings.importPreviewTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.importPreviewDesc', { count: importPreview.length, file: importFileName })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Field Mapping */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">{t('settings.importMapFields')}</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name', label: t('settings.importFieldName'), required: true },
                  { key: 'sku', label: 'SKU', required: false },
                  { key: 'categoryId', label: t('settings.importFieldCategory'), required: false },
                  { key: 'supplierId', label: t('settings.importFieldSupplier'), required: false },
                  { key: 'costPrice', label: t('settings.importFieldCost'), required: false },
                  { key: 'sellingPrice', label: t('settings.importFieldPrice'), required: false },
                  { key: 'barcode', label: t('settings.importFieldBarcode'), required: false },
                  { key: 'unit', label: t('settings.importFieldUnit'), required: false },
                ].map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Label className="text-xs w-28 shrink-0">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={importMapping[field.key] || '_skip_'}
                      onValueChange={v => setImportMapping(prev => ({ ...prev, [field.key]: v === '_skip_' ? '' : v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t('settings.importSkipColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_skip_">{t('settings.importSkipColumn')}</SelectItem>
                        {importHeaders.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold w-8">#</TableHead>
                    {importHeaders.map(h => (
                      <TableHead key={h} className="text-xs font-semibold whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {importHeaders.map(h => (
                        <TableCell key={h} className="text-xs whitespace-nowrap">{row[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importPreview.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 border-t">
                  {t('settings.importMoreRows', { count: importPreview.length - 10 })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowImportPreview(false); setImportPreview([]); setImportHeaders([]); setImportFileName(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!importMapping.name) {
                  toast({ title: t('settings.importErrorNoName'), variant: 'destructive' });
                  return;
                }

                let imported = 0;
                let skipped = 0;

                importPreview.forEach(row => {
                  const name = (row[importMapping.name] || '').trim();
                  if (!name) { skipped++; return; }

                  const catName = importMapping.categoryId ? (row[importMapping.categoryId] || '').trim() : '';
                  const supName = importMapping.supplierId ? (row[importMapping.supplierId] || '').trim() : '';

                  const category = catName ? categories.find(c => c.name.toLowerCase() === catName.toLowerCase()) : undefined;
                  const supplier = supName ? suppliers.find(s => s.name.toLowerCase() === supName.toLowerCase()) : undefined;

                  addProduct({
                    name,
                    sku: importMapping.sku ? (row[importMapping.sku] || '').trim() : '',
                    categoryId: category?.id || '',
                    supplierId: supplier?.id || '',
                    costPrice: importMapping.costPrice ? parseFloat(String(row[importMapping.costPrice]).replace(',', '.')) || 0 : 0,
                    sellingPrice: importMapping.sellingPrice ? parseFloat(String(row[importMapping.sellingPrice]).replace(',', '.')) || 0 : 0,
                    barcode: importMapping.barcode ? (row[importMapping.barcode] || '').trim() : '',
                    unit: importMapping.unit ? (row[importMapping.unit] || '').trim() : 'un',
                  });
                  imported++;
                });

                setShowImportPreview(false);
                setImportPreview([]);
                setImportHeaders([]);
                setImportFileName('');

                const msg = skipped > 0
                  ? t('settings.importSuccessPartial', { imported: String(imported), skipped: String(skipped) })
                  : t('settings.importSuccess', { count: String(imported) });

                toast({ title: msg });
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('settings.importConfirm', { count: importPreview.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsManager;
