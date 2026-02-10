import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { Store, Plus, Crown } from 'lucide-react';
import { BrandForm } from './BrandForm';

const BrandSelector: React.FC = () => {
  const { userBrands, setSelectedBrand, loadUserBrands, isLoading } = useBrand();
  const { user, setNeedsBrandSelection } = useAuth();
  const [showBrandForm, setShowBrandForm] = useState(false);

  useEffect(() => {
    console.log('🎪 BrandSelector useEffect triggered, user:', user);
    if (user && userBrands.length === 0 && !isLoading) {
      console.log('👤 Carregando marcas para usuário:', user.email, 'role:', user.role);
      loadUserBrands(user.id, user.role);
    }
  }, [user?.id, user?.role, userBrands.length, isLoading, loadUserBrands]);

  const handleBrandSelect = (brand: any) => {
    console.log('🎯 Usuário selecionou a marca:', brand);
    setSelectedBrand(brand);
    // Remover a necessidade de seleção de marca após selecionar
    setNeedsBrandSelection(false);
  };

  const handleCreateBrand = () => {
    console.log('➕ Abrindo formulário para criar nova marca');
    setShowBrandForm(true);
  };

  console.log('🔍 BrandSelector render - isLoading:', isLoading, 'userBrands:', userBrands.length, 'user:', user?.email);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">O</span>
          </div>
          <p className="text-muted-foreground">Carregando suas marcas...</p>
        </div>
      </div>
    );
  }

  if (userBrands.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">O</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma marca encontrada</h2>
          <p className="text-muted-foreground mb-4">
            Você ainda não tem acesso a nenhuma marca. Comece criando sua primeira marca!
          </p>
          <p className="text-sm text-muted-foreground mb-6">Email: {user?.email}</p>
          
          <Button onClick={handleCreateBrand} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeira Marca
          </Button>
        </div>
        
        <BrandForm 
          isOpen={showBrandForm} 
          onClose={() => setShowBrandForm(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Marcas</h1>
          <p className="text-muted-foreground">
            Olá, {user?.name}! Selecione a marca para acessar:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userBrands.map((brand, index) => (
            <Card 
              key={brand.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2"
              style={{ 
                borderColor: brand.primaryColor + '20'
              }}
              onClick={() => handleBrandSelect(brand)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brand.primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brand.primaryColor + '20';
              }}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div 
                    className="hidden text-2xl font-bold"
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
                      Principal
                    </Badge>
                  )}
                </h3>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Store className="w-4 h-4" />
                  <span>{brand.storesCount} lojas</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleCreateBrand}
          >
            <Plus className="w-4 h-4" />
            Adicionar Nova Marca
          </Button>
        </div>

        <BrandForm 
          isOpen={showBrandForm} 
          onClose={() => setShowBrandForm(false)} 
        />
      </div>
    </div>
  );
};

export default BrandSelector;
