import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import MainLayout from './components/Layout/MainLayout';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Dashboard from './components/Dashboard/Dashboard';
import FinanceSummary from './components/Dashboard/FinanceSummary';
import InventoryManager from './components/Inventory/InventoryManager';
import CashManager from './components/CashManagement/CashManager';
import CashDetail from './components/CashManagement/CashDetail';
import PurchasesLayout from './components/Purchases/PurchasesLayout';
import PurchaseList from './components/Purchases/PurchaseList';
import PurchaseOrders from './components/Purchases/PurchaseOrders';
import InvoiceManager from './components/Invoices/InvoiceManager';
import TransitManager from './components/Transit/TransitManager';
import LicenseManager from './components/Licenses/LicenseManager';
import WasteManager from './components/Waste/WasteManager';
import ChecklistManager from './components/Checklists/ChecklistManager';
import SettingsManager from './components/Settings/SettingsManager';
import OperationsLayout from './components/Operations/OperationsLayout';
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
import ProtectedRoute from './components/Auth/ProtectedRoute';

const queryClient = new QueryClient();

/**
 * LanguageWrapper — syncs :lang param with i18n
 */
const LanguageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This wrapper exists for future use (e.g. syncing i18n with URL param).
  // For now it just renders children.
  return <>{children}</>;
};

/**
 * AuthGate — handles auth, brand selection, and renders routes
 */
const AuthGate: React.FC = () => {
  const { isAuthenticated, loading, needsBrandSelection, user } = useAuth();
  const { selectedBrand } = useBrand();
  const isDev = user?.role === 'developer';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/operus-logo.png" alt="OPERUS" className="w-14 h-14 rounded-lg mx-auto mb-4 object-contain" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (!isDev && (needsBrandSelection || !selectedBrand)) {
    return <BrandSelector />;
  }

  const defaultPath = isDev ? '/pt/dev-dashboard' : '/pt/dashboard';

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={defaultPath} replace />} />

      {/* Language-prefixed routes */}
      <Route path="/:lang" element={<LanguageWrapper><MainLayout /></LanguageWrapper>}>
        {/* Dashboard — nested */}
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="financeiro" element={<FinanceSummary />} />
        </Route>

        {/* Inventory */}
        <Route path="estoque" element={<InventoryManager />} />

        {/* Operations — nested */}
        <Route path="operacoes" element={<OperationsLayout />}>
          <Route index element={<OperationsManager />} />
          <Route path="producao" element={<ProductionManager />} />
        </Route>

        {/* Transit */}
        <Route path="transito" element={<TransitManager />} />

        {/* Purchases — nested */}
        <Route path="compras" element={<PurchasesLayout />}>
          <Route index element={<PurchaseList />} />
          <Route path="pedidos" element={<PurchaseOrders />} />
        </Route>

        {/* Cash */}
        <Route path="caixa" element={<CashManager />} />
        <Route path="caixa/:id" element={<CashDetail />} />

        {/* Invoices */}
        <Route path="faturas" element={<InvoiceManager />} />
        <Route path="faturas/:invoiceId" element={<InvoiceManager />} />

        {/* Licenses */}
        <Route path="licencas" element={<LicenseManager />} />
        <Route path="licencas/:id" element={<LicenseManager />} />

        {/* Waste */}
        <Route path="desperdicios" element={<WasteManager />} />

        {/* Checklists */}
        <Route path="checklists" element={<ChecklistManager />} />
        <Route path="checklists/:id" element={<ChecklistManager />} />

        {/* Store / User Management — admin/manager only */}
        <Route path="lojas" element={<ProtectedRoute allowedRoles={['developer', 'admin', 'manager']}><StoreManager /></ProtectedRoute>} />
        <Route path="usuarios" element={<ProtectedRoute allowedRoles={['developer', 'admin']}><UserManager /></ProtectedRoute>} />

        {/* Settings — admin only */}
        <Route path="configuracoes" element={<ProtectedRoute allowedRoles={['developer', 'admin']}><SettingsManager /></ProtectedRoute>} />

        {/* Profile — everyone */}
        <Route path="perfil" element={<ProfilePage />} />

        {/* Developer pages — developer only */}
        <Route path="dev-dashboard" element={<ProtectedRoute allowedRoles={['developer']}><DevDashboard /></ProtectedRoute>} />
        <Route path="dev-brands" element={<ProtectedRoute allowedRoles={['developer']}><DevBrands /></ProtectedRoute>} />
        <Route path="dev-finance" element={<ProtectedRoute allowedRoles={['developer']}><DevFinance /></ProtectedRoute>} />
        <Route path="dev-users" element={<ProtectedRoute allowedRoles={['developer']}><DevUsers /></ProtectedRoute>} />
        <Route path="dev-settings" element={<ProtectedRoute allowedRoles={['developer']}><DevSettings /></ProtectedRoute>} />

        {/* Language root redirect */}
        <Route index element={<Navigate to={isDev ? 'dev-dashboard' : 'dashboard'} replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
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
                    <BrowserRouter>
                      <AuthGate />
                    </BrowserRouter>
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
