import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus, ArrowLeftRight, Truck } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface TransferDialogProps {
    product: any;
    store: any;
    item: any;
    onClose: () => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
    product,
    store,
    item,
    onClose
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { stores, addMovement, updateInventoryItem, addOperationLog } = useData();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState(0);
    const [destinationStoreId, setDestinationStoreId] = useState('');
    const [putInTransit, setPutInTransit] = useState(true);

    // Filter out the current store from destination options
    const availableStores = stores.filter((s: any) => s.id !== store.id && s.isActive);

    const handleDecrement = () => {
        setQuantity(prev => Math.max(0, prev - 1));
    };

    const handleIncrement = () => {
        setQuantity(prev => Math.min(item.currentQuantity, prev + 1));
    };

    const canTransfer = quantity > 0 && destinationStoreId !== '' && quantity <= item.currentQuantity;

    const handleTransfer = () => {
        if (!canTransfer) return;

        const destStore = stores.find((s: any) => s.id === destinationStoreId);

        // Create the movement
        addMovement({
            productId: product.id,
            fromStoreId: store.id,
            toStoreId: destinationStoreId,
            quantity: quantity,
            status: putInTransit ? 'in_transit' : 'delivered',
            createdAt: new Date(),
            userId: user?.id || 'unknown',
            type: 'transfer'
        });

        // Subtract from source store
        updateInventoryItem(item.id, {
            currentQuantity: Math.max(0, item.currentQuantity - quantity),
            lastUpdated: new Date()
        });

        // Log the operation
        addOperationLog({
            productId: product.id,
            storeId: store.id,
            userId: user?.id || 'unknown',
            quantity: -quantity,
            actionType: 'withdrawal',
            createdAt: new Date(),
            notes: `Transferência para ${destStore?.name || 'outra loja'}`
        });

        toast({
            title: t('transferDialog.transferCreated'),
            description: `${quantity} ${product.unit || 'UN.'} → ${destStore?.name}`,
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    {/* Title */}
                    <div className="text-center mb-5">
                        <p className="text-base font-medium text-gray-900">
                            {t('transferDialog.transfer')} <span className="font-bold">{product.name}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {t('transferDialog.available')}: <span className="font-semibold text-gray-700">{item.currentQuantity}</span>
                        </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <button
                            onClick={handleDecrement}
                            className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Minus className="h-5 w-5" />
                        </button>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setQuantity(Math.min(item.currentQuantity, Math.max(0, val)));
                            }}
                            className="w-24 text-center text-xl font-bold border-gray-300 rounded-lg h-12"
                        />
                        <button
                            onClick={handleIncrement}
                            className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Source → Destination */}
                    <div className="flex items-center gap-2 justify-center mb-5">
                        {/* Source Store Badge */}
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                            {store.name}
                        </Badge>

                        {/* Transfer Arrow */}
                        <ArrowLeftRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

                        {/* Destination Store Select */}
                        <select
                            value={destinationStoreId}
                            onChange={(e) => setDestinationStoreId(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer min-w-[140px]"
                        >
                            <option value="">{t('transferDialog.selectStore')}</option>
                            {availableStores.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Put in Transit Toggle */}
                    <div className="flex items-center gap-3 mb-6">
                        <Switch
                            checked={putInTransit}
                            onCheckedChange={setPutInTransit}
                        />
                        <div className="flex items-center gap-1.5">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{t('stockPopup.putInTransit')}</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-lg border-gray-300"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={!canTransfer}
                            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 disabled:opacity-40"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            {t('transferDialog.transfer')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferDialog;
