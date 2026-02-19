import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardLayout: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6 bg-background min-h-screen">
            <div className="bg-card border-b">
                <div className="px-6 pt-6 pb-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
                        <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                        </div>
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
                            <BarChart3 className="h-4 w-4" />
                            {t('dashboard.operationalSummary')}
                        </NavLink>
                        <NavLink
                            to="financeiro"
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <DollarSign className="h-4 w-4" />
                            {t('dashboard.financialSummary')}
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="mt-6 px-6">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
