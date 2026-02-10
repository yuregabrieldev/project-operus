
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

const Header: React.FC = () => {
  const { selectedBrand } = useBrand();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    setDarkMode(!darkMode);
    toast({
      title: darkMode ? "Modo Claro" : "Modo Noturno",
      description: darkMode ? "Tema claro ativado." : "Tema noturno ativado.",
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
          {selectedBrand && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateStore}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              <Store className="w-3.5 h-3.5" />
              Nova Loja
            </Button>
          )}
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                </div>
                <div className="py-2 px-4 text-sm text-gray-500 text-center">
                  Nenhuma notificação nova
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
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
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Perfil
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
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
