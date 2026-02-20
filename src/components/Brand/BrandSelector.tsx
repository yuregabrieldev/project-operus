import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBrand, type Brand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isDeveloper } from '@/lib/developer-access';
import { Store, Crown, LogOut, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';

const BrandSelector: React.FC = () => {
  const { userBrands, stores, setSelectedBrand, setSelectedStore, loadUserBrands, isLoading, brandsLoaded } = useBrand();
  const { user, setNeedsBrandSelection, logout } = useAuth();
  const { t } = useLanguage();
  const [selectedBrandLocal, setSelectedBrandLocal] = useState<Brand | null>(null);

  if (isDeveloper(user)) {
    return <Navigate to="/pt/dev-dashboard" replace />;
  }

  useEffect(() => {
    if (user && !brandsLoaded && !isLoading) {
      loadUserBrands(user.id, user.role);
    }
  }, [user?.id, brandsLoaded, isLoading, loadUserBrands]);

  const brandStores = useMemo(() => {
    if (!selectedBrandLocal) return [];
    return stores.filter(s => s.brandId === selectedBrandLocal.id && s.isActive);
  }, [selectedBrandLocal, stores]);

  const handleBrandSelect = (brand: Brand) => {
    const brandActiveStores = stores.filter(s => s.brandId === brand.id && s.isActive);
    if (brandActiveStores.length === 0) {
      // No stores — proceed directly without store selection
      setSelectedBrand(brand);
      setSelectedStore(null);
      setNeedsBrandSelection(false);
    } else {
      // 1 or more stores — always show store selection
      setSelectedBrandLocal(brand);
    }
  };

  const handleStoreSelect = (store: typeof stores[0]) => {
    if (!selectedBrandLocal) return;
    setSelectedBrand(selectedBrandLocal);
    setSelectedStore(store);
    setNeedsBrandSelection(false);
  };

  const handleBack = () => {
    setSelectedBrandLocal(null);
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

  // Step 2: Store selection (after brand is chosen)
  if (selectedBrandLocal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <img src="/operus-logo.png" alt="OPERUS" className="w-14 h-14 rounded-lg mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('brand.selectStore')}
            </h1>
            <p className="text-muted-foreground">
              {t('brand.selectStoreFor')}{' '}
              <span className="font-semibold" style={{ color: selectedBrandLocal.primaryColor }}>{selectedBrandLocal.name}</span>
            </p>
          </div>

          {brandStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('brand.noStoresAvailable')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {brandStores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2"
                  style={{ borderColor: selectedBrandLocal.primaryColor + '20' }}
                  onClick={() => handleStoreSelect(store)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = selectedBrandLocal.primaryColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = selectedBrandLocal.primaryColor + '20'; }}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: selectedBrandLocal.primaryColor + '15' }}>
                      {store.imageUrl ? (
                        <img
                          src={store.imageUrl}
                          alt={store.name}
                          className="w-12 h-12 object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <MapPin
                        className={`w-6 h-6${store.imageUrl ? ' hidden' : ''}`}
                        style={{ color: selectedBrandLocal.primaryColor }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{store.name}</h3>
                  </CardHeader>
                  <CardContent className="text-center">
                    {store.address && (
                      <p className="text-sm text-muted-foreground">{store.address}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {userBrands.length > 1 && (
            <div className="text-center">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mx-auto">
                <ArrowLeft className="w-4 h-4" />
                {t('brand.backToBrands')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Brand selection
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
