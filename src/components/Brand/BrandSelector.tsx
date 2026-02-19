import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isDeveloper } from '@/lib/developer-access';
import { Store, Crown, LogOut, AlertTriangle } from 'lucide-react';

const BrandSelector: React.FC = () => {
  const { userBrands, setSelectedBrand, loadUserBrands, isLoading, brandsLoaded } = useBrand();
  const { user, setNeedsBrandSelection, logout } = useAuth();
  const { t } = useLanguage();

  if (isDeveloper(user)) {
    return <Navigate to="/pt/dev-dashboard" replace />;
  }

  useEffect(() => {
    if (user && !brandsLoaded && !isLoading) {
      loadUserBrands(user.id, user.role);
    }
  }, [user?.id, brandsLoaded, isLoading, loadUserBrands]);

  const handleBrandSelect = (brand: any) => {
    setSelectedBrand(brand);
    setNeedsBrandSelection(false);
  };

  if (isLoading || !brandsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/operus-logo.png" alt="OPERUS" className="w-14 h-14 rounded-lg mx-auto mb-4 object-contain" />
          <p className="text-muted-foreground">{t('brand.loadingBrands')}</p>
        </div>
      </div>
    );
  }

  if (userBrands.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl font-semibold mb-2">{t('brand.noBrandsTitle')}</h2>
          <p className="text-muted-foreground mb-2">
            {t('brand.noBrandsMessage')}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('brand.contactDeveloper')}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t('brand.loggedAs')}:</span> {user?.email}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => logout()}
            className="flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" />
            {t('brand.logout')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img src="/operus-logo.png" alt="OPERUS" className="w-14 h-14 rounded-lg mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('brand.myBrands')}</h1>
          <p className="text-muted-foreground">
            {t('brand.selectBrandGreeting', { name: user?.name })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userBrands.map((brand, index) => (
            <Card
              key={brand.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2"
              style={{ borderColor: brand.primaryColor + '20' }}
              onClick={() => handleBrandSelect(brand)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = brand.primaryColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = brand.primaryColor + '20'; }}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {brand.logoUrl && brand.logoUrl !== '/placeholder.svg' && brand.logoUrl !== '' ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={brand.logoUrl && brand.logoUrl !== '/placeholder.svg' && brand.logoUrl !== '' ? 'hidden text-2xl font-bold' : 'text-2xl font-bold'}
                    style={{ color: brand.primaryColor }}
                  >
                    {brand.name.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                  {brand.name}
                  {index === 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t('brand.primary')}
                    </Badge>
                  )}
                </h3>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Store className="w-4 h-4" />
                  <span>
                    {brand.storesCount === 1
                      ? t('header.storeCount', { count: brand.storesCount })
                      : t('header.storesCount', { count: brand.storesCount })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandSelector;
