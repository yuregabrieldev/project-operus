
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Truck, ShoppingCart, Package } from 'lucide-react';
import { Product, InventoryItem, InventoryMovement, Store, Supplier, Category } from '@/contexts/DataContext';

interface ProductGroup {
    product: Product;
    storeItems: Array<{ store: Store; item: InventoryItem }>;
    totalQuantity: number;
    supplier?: Supplier;
    category?: Category;
    inTransitMovements: Array<InventoryMovement & { toStoreName?: string }>;
    stockStatus: 'normal' | 'low' | 'critical';
}

interface InventoryCardViewProps {
    productGroups: ProductGroup[];
    onEditProduct: (productId: string) => void;
    onAddMovement: (productId: string) => void;
    onTransitClick?: (movement: any) => void;
}

const InventoryCardView: React.FC<InventoryCardViewProps> = ({
    productGroups,
    onEditProduct,
    onAddMovement,
    onTransitClick,
}) => {
    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'bg-destructive';
            case 'low': return 'bg-amber-500';
            default: return 'bg-emerald-500';
        }
    };

    const getBorderColorClass = (status: string) => {
        switch (status) {
            case 'critical': return 'border-destructive';
            case 'low': return 'border-amber-500';
            default: return 'border-emerald-500';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {productGroups.map((group) => (
                <Card key={group.product.id} className={`overflow-hidden border-l-4 transition-shadow hover:shadow-lg ${getBorderColorClass(group.stockStatus)}`}>
                    <CardContent className="p-4">
                        {/* Header: Product Name + Total */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Product Image or Placeholder */}
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                                    {group.product.imageUrl ? (
                                        <img src={group.product.imageUrl} alt={group.product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="h-6 w-6 text-muted-foreground/50" />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-semibold" style={{ position: 'relative', marginTop: '-20px' }}>
                                        Total: {group.totalQuantity}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground truncate">{group.product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{group.product.sku}</p>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-1 flex-shrink-0">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditProduct(group.product.id)}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onAddMovement(group.product.id)}>
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Per-store quantity circles */}
                        <div className="flex flex-wrap gap-3 mb-3 justify-center">
                            {group.storeItems.map(({ store, item }) => {
                                const isLow = item.currentQuantity <= item.minQuantity;
                                const isCritical = item.currentQuantity <= item.minQuantity * 0.5;
                                const circleColor = isCritical ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-emerald-500';
                                return (
                                    <div key={store.id} className="flex flex-col items-center">
                                        <div className={`w-11 h-11 ${circleColor} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                            {item.currentQuantity}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 max-w-[60px] text-center truncate">{store.name}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer: Unit + Supplier */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            {group.product.unit && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <Package className="h-3 w-3" />
                                    1 {group.product.unit}
                                </Badge>
                            )}
                            {group.supplier && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <ShoppingCart className="h-3 w-3" />
                                    {group.supplier.name}
                                </Badge>
                            )}
                            {group.category && (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                    {group.category.name}
                                </Badge>
                            )}
                        </div>

                        {/* In-transit indicators */}
                        {group.inTransitMovements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                                {group.inTransitMovements.map((movement) => (
                                    <Badge
                                        key={movement.id}
                                        variant="secondary"
                                        className="text-[11px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                                        onClick={() => onTransitClick?.(movement)}
                                    >
                                        <Truck className="h-3 w-3" />
                                        +{movement.quantity} para {movement.toStoreName}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default InventoryCardView;
