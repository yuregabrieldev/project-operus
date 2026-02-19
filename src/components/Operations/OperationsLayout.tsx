import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeftRight, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';

const OperationsLayout: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-4 md:space-y-6 bg-background min-h-screen">
            <div className="bg-card border-b">
                <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 space-y-3 md:space-y-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('operations.title')}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{t('operationsPage.subtitle')}</p>
                    </div>

                    {/* Tab Navigation - horizontally scrollable on mobile */}
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit min-w-fit">
                            <NavLink
                                end
                                to=""
                                className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                                {t('operationsPage.tabWithdrawal')}
                            </NavLink>
                            <NavLink
                                to="producao"
                                className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Factory className="h-4 w-4" />
                                {t('operationsPage.tabProduction')}
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>

            <Outlet />
        </div>
    );
};

export default OperationsLayout;
