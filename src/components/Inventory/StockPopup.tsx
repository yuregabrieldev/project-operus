import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    X, Minus, Plus, MoreVertical, Edit, Bell, Truck, Trash2,
    Package, Clock, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import AlertConfigDialog from './AlertConfigDialog';
import TransferDialog from './TransferDialog';

interface StockPopupProps {
    product: any;
    store: any;
    item: any;
    category?: any;
    onClose: () => void;
    onEditProduct?: (productId: string) => void;
    onTransferProduct?: (productId: string) => void;
}

const StockPopup: React.FC<StockPopupProps> = ({
    product,
    store,
    item,
    category,
    onClose,
    onEditProduct,
    onTransferProduct
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { updateInventoryItem, addOperationLog, getOperationLogsByProduct, addMovement } = useData();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState(0);
    const [observation, setObservation] = useState('');
    const [putInTransit, setPutInTransit] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [showAlertConfig, setShowAlertConfig] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Get operation logs for this product
    const operationLogs = useMemo(() => {
        return getOperationLogsByProduct(product.id)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);
    }, [product.id, getOperationLogsByProduct]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setShowContextMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDecrement = () => {
        setQuantity(prev => Math.max(0, prev - 1));
    };

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleSubmit = () => {
        if (quantity === 0) return;

        // Update inventory
        const newQuantity = item.currentQuantity + quantity;
        updateInventoryItem(item.id, {
            currentQuantity: Math.max(0, newQuantity),
            lastUpdated: new Date()
        });

        // Log the operation
        addOperationLog({
            productId: product.id,
            storeId: store.id,
            userId: user?.id || 'unknown',
            quantity: quantity,
            actionType: quantity > 0 ? 'entry' : 'withdrawal',
            createdAt: new Date(),
            notes: observation || undefined
        });

        // If put in transit, create a movement
        if (putInTransit && quantity > 0) {
            addMovement({
                productId: product.id,
                fromStoreId: store.id,
                quantity: quantity,
                status: 'pending',
                createdAt: new Date(),
                userId: user?.id || 'unknown',
                type: 'transfer'
            });
        }

        toast({
            title: t('stockPopup.stockUpdated'),
            description: `${quantity > 0 ? '+' : ''}${quantity} ${product.unit || t('common.units')} - ${product.name}`,
        });

        setQuantity(0);
        setObservation('');
        setPutInTransit(false);
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

    const getLogDescription = (log: any) => {
        if (log.actionType === 'entry') {
            return `Adicionado ${log.quantity} ${product.unit || 'UN.'} ao estoque (${store.name})`;
        } else {
            return `Retirado ${Math.abs(log.quantity)} ${product.unit || 'UN.'} do estoque (${store.name})`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Popup */}
            <div
                ref={popupRef}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header: Product Info */}
                <div className="flex items-start gap-4 p-5 pb-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="h-8 w-8 text-slate-400" />
                        )}
                    </div>

                    {/* Name & Badges */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight uppercase">
                            {product.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {category && (
                                <Badge className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5">
                                    {category.name}
                                </Badge>
                            )}
                            <Badge className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5">
                                {store.name}
                            </Badge>
                        </div>
                    </div>

                    {/* Three-dot menu */}
                    <div className="relative" ref={contextMenuRef}>
                        <button
                            onClick={() => setShowContextMenu(!showContextMenu)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>

                        {showContextMenu && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-10 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    onClick={() => { onEditProduct?.(product.id); setShowContextMenu(false); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                    {t('stockPopup.edit')}
                                </button>
                                <button
                                    onClick={() => { setShowAlertConfig(true); setShowContextMenu(false); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Bell className="h-4 w-4 text-amber-600" />
                                    {t('stockPopup.alerts')}
                                </button>
                                <button
                                    onClick={() => { setShowTransferDialog(true); setShowContextMenu(false); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Truck className="h-4 w-4 text-emerald-600" />
                                    {t('stockPopup.transfer')}
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                    onClick={() => setShowContextMenu(false)}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t('stockPopup.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stock Info Card */}
                <div className="px-5">
                    <div className="border border-gray-200 rounded-xl p-4">
                        {/* Current Stock */}
                        <div className="text-center mb-1">
                            <p className="text-sm text-gray-600 font-medium">{t('stockPopup.currentStock')}</p>
                            <p className="text-3xl font-bold text-gray-900">{item.currentQuantity}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {t('stockPopup.lastUpdate')} {formatDate(item.lastUpdated)}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-3" />

                        {/* Quantity Controls */}
                        <p className="text-sm font-semibold text-gray-700 text-center mb-3">{t('stockPopup.add')}:</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={handleDecrement}
                                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Minus className="h-5 w-5" />
                            </button>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="w-20 text-center text-lg font-bold border-gray-300 rounded-lg h-11"
                            />
                            <button
                                onClick={handleIncrement}
                                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Unit Badge */}
                        <div className="flex justify-center mt-3">
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 px-3">
                                1 {product.unit || 'UN.'}
                            </Badge>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-3" />

                        {/* Put in Transit Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={putInTransit}
                                    onCheckedChange={setPutInTransit}
                                />
                                <span className="text-sm font-medium text-gray-700">{t('stockPopup.putInTransit')}</span>
                            </div>
                        </div>

                        {/* Observation */}
                        <div className="mt-3">
                            <Input
                                placeholder={t('stockPopup.observationPlaceholder')}
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                className="text-sm border-gray-200 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* History Toggle */}
                <div className="px-5 mt-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showHistory ? '−' : '+'} {t('stockPopup.viewHistory')}
                    </button>

                    {/* History List */}
                    {showHistory && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                            {operationLogs.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {operationLogs.map((log: any) => (
                                        <div key={log.id} className="px-3 py-2.5 flex items-start gap-2.5 text-xs">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <User className="h-3 w-3 text-gray-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-500">
                                                    <span className="font-medium text-gray-700">{formatDate(log.createdAt)}</span>
                                                    {' '}({log.userId})
                                                </p>
                                                <p className={`mt-0.5 font-medium ${log.actionType === 'entry' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {getLogDescription(log)}
                                                </p>
                                                {log.notes && (
                                                    <p className="text-gray-400 mt-0.5 italic">"{log.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                    {t('stockPopup.noHistory')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 p-5 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-lg border-gray-300"
                    >
                        {t('stockPopup.close')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={quantity === 0}
                        className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    >
                        {t('stockPopup.addMeasures').replace('{count}', String(quantity))}
                    </Button>
                </div>
            </div>

            {/* Alert Config Dialog */}
            {showAlertConfig && (
                <AlertConfigDialog
                    product={product}
                    store={store}
                    item={item}
                    onClose={() => setShowAlertConfig(false)}
                />
            )}

            {/* Transfer Dialog */}
            {showTransferDialog && (
                <TransferDialog
                    product={product}
                    store={store}
                    item={item}
                    onClose={() => setShowTransferDialog(false)}
                />
            )}
        </div>
    );
};
export default StockPopup;
