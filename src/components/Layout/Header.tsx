
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sun, Moon, Globe, Bell, LogOut, User, Settings,
  ChevronDown, Menu, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { StoreForm } from '../Store/StoreForm';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { lang = 'pt' } = useParams<{ lang: string }>();
  const location = useLocation();
  const { selectedBrand } = useBrand();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: t('header.loggedOut'),
      description: t('header.loggedOutDesc'),
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast({
      title: newMode ? t('header.darkMode') : t('header.lightMode'),
      description: newMode ? t('header.darkModeEnabled') : t('header.lightModeEnabled'),
    });
  };

  const languageLabels: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español'
  };

  const languageFlags: Record<string, string> = {
    pt: '🇵🇹',
    en: '🇺🇸',
    es: '🇪🇸'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const notifications = [
    { id: '1', text: 'Estoque baixo: Açaí 10L', time: 'há 5 min', read: false },
    { id: '2', text: 'Checklist pendente: Abertura Loja', time: 'há 15 min', read: false },
    { id: '3', text: 'Licença expirando: Alvará Sanitário', time: 'há 1h', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 md:px-6 h-14 md:h-16 flex items-center shadow-sm relative z-40">
      <div className="flex items-center justify-between w-full">
        {/* Left: Hamburger (mobile) + Brand info */}
        <div className="flex items-center gap-3">
          {/* Hamburger - mobile only */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {selectedBrand && (
            <div className="flex items-center gap-2 md:gap-3">
              {selectedBrand.logoUrl && selectedBrand.logoUrl !== '/placeholder.svg' ? (
                <img
                  src={selectedBrand.logoUrl}
                  alt={selectedBrand.name}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm"
                  style={{ backgroundColor: selectedBrand.primaryColor }}
                >
                  {selectedBrand.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900 text-sm leading-tight">{selectedBrand.name}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {selectedBrand.storesCount === 1
                    ? t('header.storeCount', { count: selectedBrand.storesCount })
                    : t('header.storesCount', { count: selectedBrand.storesCount })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Action icons + User */}
        <div className="flex items-center gap-0.5 md:gap-1">
          {/* Dark Mode Toggle - desktop only */}
          <button
            onClick={toggleDarkMode}
            className="hidden md:flex p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={darkMode ? t('header.lightMode') : t('header.darkMode')}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Language Selector - desktop only */}
          <div className="relative hidden md:block" ref={langMenuRef}>
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('header.language')}
            >
              <Globe className="h-5 w-5" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-popover rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {(['pt', 'en', 'es'] as const).map((lang2) => (
                  <button
                    key={lang2}
                    onClick={() => {
                      const newLang = lang2;
                      setLanguage(newLang);
                      const pathAfterLang = location.pathname.replace(/^\/[a-z]{2}/, '');
                      navigate(`/${newLang}${pathAfterLang}`, { replace: true });
                      setShowLangMenu(false);
                      toast({
                        title: languageLabels[newLang],
                        description: t('header.languageChanged', { lang: languageLabels[newLang] }),
                      });
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      language === lang2 ? "text-primary font-medium bg-accent/50" : "text-popover-foreground"
                    )}
                  >
                    <span className="text-base">{languageFlags[lang2]}</span>
                    <span>{languageLabels[lang2]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
                setShowLangMenu(false);
              }}
              className="p-2 md:p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
              title={t('header.notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive rounded-full text-destructive-foreground text-[10px] font-bold px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-popover rounded-xl shadow-xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{t('header.notifications')}</h3>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                      {t('header.newNotifications', { count: unreadCount })}
                    </Badge>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer border-b border-border last:border-b-0",
                        !notif.read && "bg-accent/30"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={cn(!notif.read ? "" : "ml-4")}>
                          <p className="text-sm text-foreground">{notif.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <button className="text-xs text-primary hover:text-primary/80 font-medium w-full text-center">
                    {t('header.viewAll')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider - desktop only */}
          <div className="w-px h-8 bg-border mx-1 md:mx-2 hidden md:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowLangMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-1.5 md:px-2 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </div>
              )}
              <span className="text-sm font-medium text-muted-foreground hidden lg:block">
                {user?.name}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200 hidden lg:block",
                showUserMenu && "rotate-180"
              )} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(`/${lang}/perfil`);
                    }}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t('header.profile')}
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(`/${lang}/configuracoes`);
                    }}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t('header.settings')}
                  </button>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('header.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StoreForm
        isOpen={showStoreForm}
        onClose={() => setShowStoreForm(false)}
      />
    </header>
  );
};

export default Header;
