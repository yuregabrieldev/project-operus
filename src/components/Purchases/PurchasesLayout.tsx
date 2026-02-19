import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const PurchasesLayout: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6 bg-background min-h-screen">
            <div className="bg-card border-b">
                <div className="px-6 pt-6 pb-4 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('purchases.title')}</h1>
                        <p className="text-sm text-muted-foreground mt-1">Gestão de sugestões e pedidos de compra</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
                        <NavLink
                            end
                            to=""
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {t('purchases.tabSuggestions')}
                        </NavLink>
                        <NavLink
                            to="pedidos"
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText className="h-4 w-4" />
                            {t('orders.title')}
                        </NavLink>
                    </div>
                </div>
            </div>

            <Outlet />
        </div>
    );
};

export default PurchasesLayout;
