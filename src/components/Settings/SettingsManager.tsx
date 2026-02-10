
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Store, Users, Package, Truck, Bell, Shield, Download, Upload, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { StoreForm } from './StoreForm';

const SettingsManager: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { stores, categories, suppliers, addStore, updateStore, deleteStore } = useData();
  
  const [activeTab, setActiveTab] = useState('stores');
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [isStoreFormOpen, setIsStoreFormOpen] = useState(false);

  const tabs = [
    { id: 'stores', label: t('settings.stores'), icon: Store },
    { id: 'categories', label: t('settings.categories'), icon: Package },
    { id: 'suppliers', label: t('settings.suppliers'), icon: Truck },
    { id: 'users', label: t('settings.users'), icon: Users },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'backup', label: t('settings.backup'), icon: Download }
  ];

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const handleStoreEdit = (store: any) => {
    setSelectedStore(store);
    setIsStoreFormOpen(true);
  };

  const handleStoreAdd = () => {
    setSelectedStore(null);
    setIsStoreFormOpen(true);
  };

  const handleStoreDelete = (storeId: string) => {
    if (window.confirm(t('settings.confirm_delete_store'))) {
      deleteStore(storeId);
      toast({
        title: t('settings.store_deleted'),
        description: t('settings.store_deleted_successfully'),
      });
    }
  };

  const exportData = () => {
    const data = {
      stores,
      categories,
      suppliers,
      exportDate: new Date().toISOString()
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
    
    toast({
      title: t('settings.backup_created'),
      description: t('settings.backup_downloaded'),
    });
  };

  const renderStoresTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('settings.stores_management')}
          </div>
          <Button onClick={handleStoreAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.add_store')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('settings.address')}</TableHead>
                <TableHead>{t('settings.contact')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.address}</TableCell>
                  <TableCell>{store.contact}</TableCell>
                  <TableCell>
                    <Badge className={store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {store.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleStoreEdit(store)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleStoreDelete(store.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.timezone')}
            </label>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="America/Sao_Paulo">America/São Paulo (GMT-3)</option>
              <option value="America/New_York">America/New York (GMT-5)</option>
              <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.currency')}
            </label>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('settings.low_stock_alerts')}</h4>
              <p className="text-sm text-gray-600">{t('settings.low_stock_description')}</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('settings.overdue_invoices')}</h4>
              <p className="text-sm text-gray-600">{t('settings.overdue_description')}</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('settings.email_notifications')}</h4>
              <p className="text-sm text-gray-600">{t('settings.email_description')}</p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBackupTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t('settings.backup_restore')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{t('settings.export_data')}</h3>
          <p className="text-gray-600 mb-4">{t('settings.export_description')}</p>
          <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            {t('settings.export_now')}
          </Button>
        </div>
        
        <hr />
        
        <div>
          <h3 className="text-lg font-medium mb-4">{t('settings.import_data')}</h3>
          <p className="text-gray-600 mb-4">{t('settings.import_description')}</p>
          <Button variant="outline" disabled>
            <Upload className="h-4 w-4 mr-2" />
            {t('settings.import_file')}
          </Button>
          <p className="text-sm text-gray-500 mt-2">{t('settings.import_coming_soon')}</p>
        </div>
        
        <hr />
        
        <div>
          <h3 className="text-lg font-medium mb-4">{t('settings.system_info')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{t('settings.version')}:</span>
              <span className="ml-2">1.0.0</span>
            </div>
            <div>
              <span className="font-medium">{t('settings.last_backup')}:</span>
              <span className="ml-2">{t('settings.never')}</span>
            </div>
            <div>
              <span className="font-medium">{t('settings.database')}:</span>
              <span className="ml-2">Local Storage</span>
            </div>
            <div>
              <span className="font-medium">{t('settings.records')}:</span>
              <span className="ml-2">{stores.length + categories.length + suppliers.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stores':
        return renderStoresTab();
      case 'backup':
        return renderBackupTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('settings.description')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
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

      {/* Store Form Dialog */}
      <Dialog open={isStoreFormOpen} onOpenChange={setIsStoreFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStore ? t('settings.edit_store') : t('settings.add_store')}
            </DialogTitle>
          </DialogHeader>
          <StoreForm 
            store={selectedStore}
            onClose={() => setIsStoreFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsManager;
