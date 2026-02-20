import React from 'react';
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Settings, Wallet, FileText,
  ClipboardList, Truck, ShoppingCart,
  Factory, Store, Users, ChevronLeft, X, ArrowLeftRight, Shield, Trash2,
  Building2, CreditCard, Sun, Moon, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { isDeveloper } from '@/lib/developer-access';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mode?: 'desktop' | 'mobile';
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, mode = 'desktop', onClose }) => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { lang = 'pt' } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const devMenuItems = [
    { path: `/${lang}/dev-dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { path: `/${lang}/dev-brands`, label: 'Marcas', icon: Building2 },
    { path: `/${lang}/dev-finance`, label: 'Finanças', icon: CreditCard },
    { path: `/${lang}/dev-users`, label: 'Usuários', icon: Users },
    { path: `/${lang}/dev-settings`, label: 'Configurações', icon: Settings },
  ];

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
    if (isDeveloper(user)) return devMenuItems;
    const userPermissions = user?.permissions || [];
    // No permissions configured or wildcard → show all items
    if (userPermissions.length === 0 || userPermissions.includes('*')) return allMenuItems;
    return allMenuItems.filter(item => userPermissions.includes(item.id!));
  };

  const menuItems = getMenuItems();
  const isDev = isDeveloper(user);
  const isMobile = mode === 'mobile';

  const languageLabels: Record<string, string> = {
    pt: 'Português', en: 'English', es: 'Español'
  };

  const languageFlags: Record<string, string> = {
    pt: '🇵🇹', en: '🇺🇸', es: '🇪🇸'
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    toast({
      title: newMode ? t('header.darkMode') : t('header.lightMode'),
      description: newMode ? t('header.darkModeEnabled') : t('header.lightModeEnabled'),
    });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const pathAfterLang = location.pathname.replace(/^\/[a-z]{2}/, '');
    navigate(`/${newLang}${pathAfterLang}`, { replace: true });
    toast({
      title: languageLabels[newLang],
      description: t('header.languageChanged', { lang: languageLabels[newLang] }),
    });
  };

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
      isMobile
        ? "w-72"
        : cn("sticky top-0 transition-all duration-300 ease-in-out", isCollapsed ? "w-[68px]" : "w-60")
    )}>
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/10 px-3 flex-shrink-0",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {isCollapsed && !isMobile ? (
          <button onClick={onToggle} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors" aria-label="Expand sidebar">
            <img src="/operus-logo.png" alt="OPERUS" className="h-5 w-5 object-contain brightness-0 invert" />
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
              onClick={isMobile ? onClose : onToggle}
              className="p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label={isMobile ? "Close menu" : "Collapse sidebar"}
            >
              {isMobile ? <X className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto",
        isCollapsed && !isMobile ? "py-4 px-2.5 space-y-3" : "py-3 px-2 space-y-0.5"
      )}>
        {menuItems.map((item) => {
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              end={false}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) => cn(
                "w-full flex items-center rounded-lg transition-all duration-200",
                isCollapsed && !isMobile ? "justify-center p-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    "flex-shrink-0 h-5 w-5",
                    isActive ? "text-sidebar-primary" : ""
                  )} />
                  {(!isCollapsed || isMobile) && (
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

          if (isCollapsed && !isMobile) {
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

      {/* Footer: Dark Mode + Language (mobile drawer only) */}
      {isMobile && (
        <div className="border-t border-white/10 p-3 space-y-2 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="text-sm font-medium">
              {darkMode ? t('header.lightMode') : t('header.darkMode')}
            </span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 px-1">
            {(['pt', 'en', 'es'] as const).map((lg) => (
              <button
                key={lg}
                onClick={() => handleLanguageChange(lg)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  language === lg
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <span className="text-sm">{languageFlags[lg]}</span>
                <span className="uppercase">{lg}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
