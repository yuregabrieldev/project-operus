import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Package, Settings, Wallet, FileText,
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
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { lang = 'pt' } = useParams<{ lang: string }>();

  // Developer menu — completely separate layout
  const devMenuItems = [
    { path: `/${lang}/dev-dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { path: `/${lang}/dev-brands`, label: 'Marcas', icon: Building2 },
    { path: `/${lang}/dev-finance`, label: 'Finanças', icon: CreditCard },
    { path: `/${lang}/dev-users`, label: 'Usuários', icon: Users },
    { path: `/${lang}/dev-settings`, label: 'Configurações', icon: Settings },
  ];

  // Regular menu items filtered by role
  const allMenuItems = [
    { id: 'dashboard', path: `/${lang}/dashboard`, label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'inventory', path: `/${lang}/estoque`, label: t('sidebar.inventory'), icon: Package },
    { id: 'operations', path: `/${lang}/operacoes`, label: t('sidebar.operations'), icon: ArrowLeftRight },
    { id: 'transit', path: `/${lang}/transito`, label: t('sidebar.transit'), icon: Truck },
    { id: 'purchases', path: `/${lang}/compras`, label: t('sidebar.purchases'), icon: ShoppingCart },
    { id: 'cashbox', path: `/${lang}/caixa`, label: t('sidebar.cashbox'), icon: Wallet },
    { id: 'invoices', path: `/${lang}/faturas`, label: t('sidebar.invoices'), icon: FileText },
    { id: 'licenses', path: `/${lang}/licencas`, label: t('sidebar.licenses'), icon: Shield },
    { id: 'waste', path: `/${lang}/desperdicios`, label: t('sidebar.waste'), icon: Trash2 },
    { id: 'checklists', path: `/${lang}/checklists`, label: t('sidebar.checklists'), icon: ClipboardList },
    { id: 'stores', path: `/${lang}/lojas`, label: t('sidebar.stores'), icon: Store },
    { id: 'users', path: `/${lang}/usuarios`, label: t('sidebar.users'), icon: Users },
    { id: 'settings', path: `/${lang}/configuracoes`, label: t('sidebar.settings'), icon: Settings },
  ];

  const getMenuItems = () => {
    if (user?.role === 'developer') return devMenuItems;

    const userPermissions = user?.permissions || [];
    if (userPermissions.includes('*')) return allMenuItems;

    return allMenuItems.filter(item => userPermissions.includes(item.id!));
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
        {isCollapsed ? (
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors" aria-label="Expand sidebar">
            <img src="/operus-logo.png" alt="OPERUS" className="h-8 w-8 object-contain brightness-0 invert" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <img src="/operus-logo.png" alt="OPERUS" className="h-7 w-7 object-contain brightness-0 invert" />
              <span className="text-white font-bold text-xl tracking-wide">OPERUS</span>
              {isDev && (
                <span className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground px-1.5 py-0.5 rounded font-mono">DEV</span>
              )}
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              end={false}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 rounded-lg transition-all duration-200",
                isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {({ isActive }) => (
                <>
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
                </>
              )}
            </NavLink>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={item.path}>{linkContent}</React.Fragment>;
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
