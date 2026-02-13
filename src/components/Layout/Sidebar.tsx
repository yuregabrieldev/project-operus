import React from 'react';
import {
  LayoutDashboard, Package, Settings, DollarSign, FileText,
  ClipboardList, Truck, ShoppingCart,
  Factory, Store, Users, ChevronLeft, ChevronRight, ArrowLeftRight, Shield, Trash2
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

  const menuItems = [
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
    ...(user?.role === 'admin' ? [
      { id: 'stores', label: t('sidebar.stores'), icon: Store },
      { id: 'users', label: t('sidebar.users'), icon: Users }
    ] : []),
    { id: 'settings', label: t('sidebar.settings'), icon: Settings },
  ];

  return (
    <aside className={cn(
      "bg-[#0f172a] flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[68px]" : "w-60"
    )}>
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/10 px-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <span className="text-white font-bold text-xl tracking-wide">OPERUS</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const buttonContent = (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-all duration-200",
                isCollapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                isActive
                  ? "bg-white text-[#0f172a] shadow-lg shadow-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-[#0f172a]" : ""
              )} />
              {!isCollapsed && (
                <span className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-[#0f172a]" : ""
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
