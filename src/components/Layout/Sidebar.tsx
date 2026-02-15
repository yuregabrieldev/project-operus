import React from 'react';
import {
  LayoutDashboard, Package, Settings, DollarSign, FileText,
  ClipboardList, Truck, ShoppingCart,
  Factory, Store, Users, ChevronLeft, ChevronRight, ArrowLeftRight, Shield, Trash2,
  Building2, CreditCard, Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, activeTab, onTabChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Developer menu — completely separate layout
  const devMenuItems = [
    { id: 'dev-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dev-brands', label: 'Marcas', icon: Building2 },
    { id: 'dev-finance', label: 'Finanças', icon: CreditCard },
    { id: 'dev-users', label: 'Usuários', icon: Users },
    { id: 'dev-settings', label: 'Configurações', icon: Settings },
  ];

  // Regular menu items filtered by role
  const allMenuItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'inventory', label: t('sidebar.inventory'), icon: Package },
    { id: 'operations', label: t('sidebar.operations'), icon: ArrowLeftRight },
    { id: 'transit', label: t('sidebar.transit'), icon: Truck },
    { id: 'purchases', label: t('sidebar.purchases'), icon: ShoppingCart },
    { id: 'cashbox', label: t('sidebar.cashbox'), icon: DollarSign },
    { id: 'invoices', label: t('sidebar.invoices'), icon: FileText },
    { id: 'licenses', label: 'Licenças', icon: Shield },
    { id: 'waste', label: 'Desperdício', icon: Trash2 },
    { id: 'checklists', label: t('sidebar.checklists'), icon: ClipboardList },
    { id: 'stores', label: t('sidebar.stores'), icon: Store },
    { id: 'users', label: t('sidebar.users'), icon: Users },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings },
  ];

  const getMenuItems = () => {
    if (user?.role === 'developer') return devMenuItems;

    const userPermissions = user?.permissions || [];
    if (userPermissions.includes('*')) return allMenuItems;

    return allMenuItems.filter(item => userPermissions.includes(item.id));
  };

  const menuItems = getMenuItems();
  const isDev = user?.role === 'developer';

  return (
    <aside className={cn(
      "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
      isCollapsed ? "w-[68px]" : "w-60"
    )}>
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/10 px-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl tracking-wide">OPERUS</span>
            {isDev && (
              <span className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground px-1.5 py-0.5 rounded font-mono">DEV</span>
            )}
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const buttonContent = (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-all duration-200",
                isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-sidebar-primary" : ""
              )} />
              {!isCollapsed && (
                <span className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-sidebar-accent-foreground" : ""
                )}>
                  {item.label}
                </span>
              )}
            </button>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={item.id}>{buttonContent}</React.Fragment>;
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
