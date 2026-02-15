import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    X, Minus, Plus, Package, Clock, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalPopupProps {
    product: any;
    store: any;
    item: any;
    category?: any;
    onClose: () => void;
}

const WithdrawalPopup: React.FC<WithdrawalPopupProps> = ({
    product,
    store,
    item,
    category,
    onClose
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { updateInventoryItem, addOperationLog, getOperationLogsByProduct } = useData();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState(1);
    const [showHistory, setShowHistory] = useState(false);

    // Get operation logs for this product in this store
    const operationLogs = useMemo(() => {
        return getOperationLogsByProduct(product.id)
            .filter((log: any) => log.storeId === store.id)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 15);
    }, [product.id, store.id, getOperationLogsByProduct]);

    const handleDecrement = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleIncrement = () => {
        setQuantity(prev => Math.min(item.currentQuantity, prev + 1));
    };

    const handleWithdraw = () => {
        if (quantity <= 0 || quantity > item.currentQuantity) return;

        // Subtract from stock
        updateInventoryItem(item.id, {
            currentQuantity: Math.max(0, item.currentQuantity - quantity),
            lastUpdated: new Date()
        });

        // Log the operation
        addOperationLog({
            productId: product.id,
            storeId: store.id,
            userId: user?.id || 'unknown',
            quantity: quantity,
            actionType: 'withdrawal',
            createdAt: new Date(),
            notes: undefined
        });

        // Low stock warning
        const newQty = item.currentQuantity - quantity;
        const warningThreshold = item.alertWarning ?? item.minQuantity;
        if (newQty <= warningThreshold && newQty > 0) {
            toast({
                title: t('operationsPage.lowStockAlert'),
                description: `${product.name}: ${newQty} ${product.unit || 'UN.'} ${t('operationsPage.remaining')}`,
                variant: 'destructive'
            });
        }

        toast({
            title: t('operationsPage.withdrawn'),
            description: `âˆ’${quantity} ${product.unit || 'UN.'} ${product.name}`,
        });

        onClose();
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Popup */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6">
                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-foreground text-center uppercase pr-8">
                        {product.name}
                    </h3>

                    {/* Current Stock */}
                    <p className="text-sm text-muted-foreground text-center mt-1">
                        {t('stockPopup.currentStock')}: <span className="font-bold text-foreground">{item.currentQuantity}</span>
                    </p>

                    {/* Unit Badge */}
                    <div className="flex justify-center mt-2 mb-4">
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200 px-3 py-0.5">
                            1 {product.unit || 'UN.'}
                        </Badge>
                    </div>

                    {/* Product Image */}
                    <div className="flex justify-center mb-5">
                        <div className="w-28 h-28 rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden border border-border">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <Package className="h-12 w-12 text-muted-foreground/30" />
                            )}
                        </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-center gap-4 mb-5">
                        <button
                            onClick={handleDecrement}
                            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <Minus className="h-6 w-6" />
                        </button>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setQuantity(Math.min(item.currentQuantity, Math.max(1, val)));
                            }}
                            className="w-24 text-center text-2xl font-bold border-input rounded-xl h-14 bg-background"
                        />
                        <button
                            onClick={handleIncrement}
                            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                    </div>

                    {/* BIG Withdraw Button */}
                    <Button
                        onClick={handleWithdraw}
                        disabled={quantity <= 0 || quantity > item.currentQuantity}
                        className="w-full h-14 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                        {t('operationsPage.withdrawButton').replace('{count}', String(quantity))}
                    </Button>

                    {/* History Toggle */}
                    <div className="mt-5">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {showHistory ? 'âˆ’' : '+'} {t('stockPopup.viewHistory')}
                        </button>

                        {/* History List */}
                        {showHistory && (
                            <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-xl">
                                {operationLogs.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {operationLogs.map((log: any) => (
                                            <div key={log.id} className="px-3 py-2.5 flex items-start gap-2.5 text-xs">
                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-muted-foreground">
                                                        <span className="font-medium text-foreground">{formatDate(log.createdAt)}</span>
                                                        {' '}({log.userId})
                                                    </p>
                                                    <p className={`mt-0.5 font-medium ${log.actionType === 'entry' ? 'text-emerald-600' : 'text-destructive'}`}>
                                                        {log.actionType === 'withdrawal'
                                                            ? `${t('operationsPage.historyWithdrawn')} ${log.quantity} ${product.unit || 'UN.'}`
                                                            : `${t('operationsPage.historyAdded')} ${log.quantity} ${product.unit || 'UN.'}`
                                                        }
                                                    </p>
                                                    {log.notes && (
                                                        <p className="text-muted-foreground mt-0.5 italic">"{log.notes}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                                        {t('stockPopup.noHistory')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalPopup;

