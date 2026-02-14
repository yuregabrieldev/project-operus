
import React, { useState, useRef, useEffect } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sun, Moon, Globe, Bell, LogOut, User, Settings,
  ChevronDown, Plus, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { StoreForm } from '../Store/StoreForm';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onTabChange?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onTabChange }) => {
  const { selectedBrand } = useBrand();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

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

  // Close dropdowns on click outside
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
      title: "Desconectado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleCreateStore = () => {
    setShowStoreForm(true);
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
      title: newMode ? "Modo Noturno" : "Modo Claro",
      description: newMode ? "Tema noturno ativado." : "Tema claro ativado.",
    });
  };

  const languageLabels: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español'
  };

  const languageFlags: Record<string, string> = {
    pt: '🇧🇷',
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

  // Sample notifications
  const notifications = [
    { id: '1', text: 'Estoque baixo: Açaí 10L', time: 'há 5 min', read: false },
    { id: '2', text: 'Checklist pendente: Abertura Loja', time: 'há 15 min', read: false },
    { id: '3', text: 'Licença expirando: Alvará Sanitário', time: 'há 1h', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left: Brand info */}
        <div className="flex items-center space-x-4">
          {selectedBrand && (
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: selectedBrand.primaryColor }}
              >
                {selectedBrand.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm leading-tight">{selectedBrand.name}</h2>
                <p className="text-xs text-gray-500">{selectedBrand.storesCount} lojas</p>
              </div>
            </div>
          )}
          {/* Nova Loja button removed — store creation via dev brand management */}
        </div>

        {/* Right: Action icons + User */}
        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title={darkMode ? "Modo Claro" : "Modo Noturno"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Language Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Idioma"
            >
              <Globe className="h-5 w-5" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {(['pt', 'en', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangMenu(false);
                      toast({
                        title: languageLabels[lang],
                        description: `Idioma alterado para ${languageLabels[lang]}.`,
                      });
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                      language === lang ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"
                    )}
                  >
                    <span className="text-base">{languageFlags[lang]}</span>
                    <span>{languageLabels[lang]}</span>
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
              className="p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors relative"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full text-white text-[10px] font-bold px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                      {unreadCount} novas
                    </Badge>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0",
                        !notif.read && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={cn(!notif.read ? "" : "ml-4")}>
                          <p className="text-sm text-gray-800">{notif.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center">
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-2" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowLangMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {user?.name}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200 hidden md:block",
                showUserMenu && "rotate-180"
              )} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      onTabChange?.('profile');
                    }}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Perfil
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      onTabChange?.('settings');
                    }}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Configurações
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
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
