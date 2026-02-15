import React, { useState, useRef, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandProvider, useBrand } from './contexts/BrandContext';
import { UsersProvider } from './contexts/UsersContext';
import { ChecklistProvider } from './contexts/ChecklistContext';
import LandingPage from './components/Landing/LandingPage';
import BrandSelector from './components/Brand/BrandSelector';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryManager from './components/Inventory/InventoryManager';
import CashManager from './components/CashManagement/CashManager';
import PurchaseSuggestions from './components/Purchases/PurchaseSuggestions';
import InvoiceManager from './components/Invoices/InvoiceManager';
import TransitManager from './components/Transit/TransitManager';
import LicenseManager from './components/Licenses/LicenseManager';
import WasteManager from './components/Waste/WasteManager';
import ChecklistManager from './components/Checklists/ChecklistManager';
import ChecklistConfigManager from './components/Checklists/ChecklistConfigManager';
import ChecklistExecution from './components/Checklists/ChecklistExecution';
import ChecklistHistory from './components/Checklists/ChecklistHistory';
import SettingsManager from './components/Settings/SettingsManager';
import OperationsManager from './components/Operations/OperationsManager';
import ProductionManager from './components/Production/ProductionManager';
import ProfilePage from './components/Profile/ProfilePage';
import { StoreManager } from './components/Store/StoreManager';
import { UserManager } from './components/Users/UserManager';
import DevDashboard from './components/Developer/DevDashboard';
import DevBrands from './components/Developer/DevBrands';
import DevFinance from './components/Developer/DevFinance';
import DevUsers from './components/Developer/DevUsers';
import DevSettings from './components/Developer/DevSettings';

const queryClient = new QueryClient();

const MainApp = () => {
  const { isAuthenticated, loading, needsBrandSelection, user } = useAuth();
  const { selectedBrand } = useBrand();
  const isDev = user?.role === 'developer';

  // Developer starts on dev-dashboard, others on dashboard
  const [activeTab, setActiveTab] = useState(isDev ? 'dev-dashboard' : 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Smooth scroll to top on tab change with View Transitions
  const handleTabChange = useCallback((tab: string) => {
    if (!document.startViewTransition) {
      setActiveTab(tab);
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    document.startViewTransition(() => {
      setActiveTab(tab);
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  console.log('🚀 MainApp render - isAuthenticated:', isAuthenticated, 'needsBrandSelection:', needsBrandSelection, 'selectedBrand:', selectedBrand?.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Developer bypasses brand selection entirely
  if (!isDev && (needsBrandSelection || !selectedBrand)) {
    console.log('🎪 Mostrando BrandSelector - needsBrandSelection:', needsBrandSelection, 'selectedBrand:', selectedBrand);
    return <BrandSelector />;
  }

  console.log('✅ Mostrando aplicação principal com marca:', selectedBrand?.name);

  const renderContent = () => {
    switch (activeTab) {
      // Developer pages
      case 'dev-dashboard':
        return <DevDashboard />;
      case 'dev-brands':
        return <DevBrands />;
      case 'dev-finance':
        return <DevFinance />;
      case 'dev-users':
        return <DevUsers />;
      case 'dev-settings':
        return <DevSettings />;
      // Regular pages
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManager />;
      case 'operations':
        return <OperationsManager />;
      case 'production':
        return <ProductionManager />;
      case 'transit':
        return <TransitManager />;
      case 'purchases':
        return <PurchaseSuggestions />;
      case 'cashbox':
        return <CashManager />;
      case 'invoices':
        return <InvoiceManager />;
      case 'licenses':
        return <LicenseManager />;
      case 'waste':
        return <WasteManager />;
      case 'checklists':
        return <ChecklistManager />;
      case 'checklist-config':
        return <ChecklistConfigManager />;
      case 'checklist-execution':
        return <ChecklistExecution />;
      case 'checklist-history':
        return <ChecklistHistory />;
      case 'stores':
        return <StoreManager />;
      case 'users':
        return <UserManager />;
      case 'settings':
        return <SettingsManager />;
      case 'profile':
        return <ProfilePage />;
      default:
        return isDev ? <DevDashboard /> : <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="flex-1 flex flex-col">
        <Header onTabChange={handleTabChange} />

        <main ref={mainRef} className="flex-1 overflow-auto scroll-smooth">
          <div key={activeTab} className="animate-in fade-in duration-200">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrandProvider>
              <UsersProvider>
                <ChecklistProvider>
                  <DataProvider>
                    <MainApp />
                    <Toaster />
                    <Sonner />
                  </DataProvider>
                </ChecklistProvider>
              </UsersProvider>
            </BrandProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
