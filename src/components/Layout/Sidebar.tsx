import React from 'react';
import { 
  Home, Package, Settings, DollarSign, FileText, 
  ClipboardList, Truck, ShoppingCart, Cog, 
  Factory, Store, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, activeTab, onTabChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'operations', label: 'Operações', icon: Cog },
    { id: 'production', label: 'Produção', icon: Factory },
    { id: 'transit', label: 'Trânsito', icon: Truck },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
    { id: 'cashbox', label: 'Caixa', icon: DollarSign },
    { id: 'invoices', label: 'Faturas', icon: FileText },
    { id: 'checklists', label: 'Listas', icon: ClipboardList },
    // Só mostra "Lojas" e "Usuários" para administradores
    ...(user?.role === 'admin' ? [
      { id: 'stores', label: 'Lojas', icon: Store },
      { id: 'users', label: 'Usuários', icon: Users }
    ] : []),
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="font-semibold text-gray-900">Operus</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
          >
            <Cog className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed ? "px-2" : "px-3",
                  activeTab === item.id && "bg-blue-50 text-blue-700 border-blue-200"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
