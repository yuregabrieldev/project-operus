import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface AlertConfigDialogProps {
    product: any;
    store: any;
    item: any;
    onClose: () => void;
}

const AlertConfigDialog: React.FC<AlertConfigDialogProps> = ({
    product,
    store,
    item,
    onClose
}) => {
    const { t } = useLanguage();
    const { inventory, updateInventoryItem } = useData();
    const { toast } = useToast();

    const [warningLevel, setWarningLevel] = useState<number>(
        item.alertWarning ?? item.minQuantity ?? 10
    );
    const [criticalLevel, setCriticalLevel] = useState<number>(
        item.alertCritical ?? Math.floor((item.minQuantity ?? 10) * 0.5) ?? 5
    );
    const [applyToAllStores, setApplyToAllStores] = useState(false);

    const handleSave = () => {
        if (applyToAllStores) {
            // Update all inventory items for this product across all stores
            const productItems = inventory.filter(
                (inv: any) => inv.productId === product.id
            );
            productItems.forEach((inv: any) => {
                updateInventoryItem(inv.id, {
                    alertWarning: warningLevel,
                    alertCritical: criticalLevel
                });
            });
        } else {
            // Update only this specific store's item
            updateInventoryItem(item.id, {
                alertWarning: warningLevel,
                alertCritical: criticalLevel
            });
        }

        toast({
            title: t('alertConfig.saved'),
            description: applyToAllStores
                ? t('alertConfig.savedAllStores')
                : t('alertConfig.savedThisStore'),
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
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                        {t('alertConfig.title')}
                    </h3>
                    <p className="text-sm font-semibold text-gray-700 mb-5 uppercase">
                        {product.name}
                    </p>

                    {/* Warning Level */}
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-gray-700">
                            {t('alertConfig.warning')}:
                        </label>
                        <Input
                            type="number"
                            value={warningLevel}
                            onChange={(e) => setWarningLevel(parseInt(e.target.value) || 0)}
                            className="w-24 text-center font-bold bg-amber-50 border-amber-200 focus:border-amber-400 focus:ring-amber-200 rounded-lg h-10"
                            min={0}
                        />
                    </div>

                    {/* Critical Level */}
                    <div className="flex items-center justify-between mb-5">
                        <label className="text-sm font-medium text-gray-700">
                            {t('alertConfig.critical')}:
                        </label>
                        <Input
                            type="number"
                            value={criticalLevel}
                            onChange={(e) => setCriticalLevel(parseInt(e.target.value) || 0)}
                            className="w-24 text-center font-bold bg-red-50 border-red-200 focus:border-red-400 focus:ring-red-200 rounded-lg h-10"
                            min={0}
                        />
                    </div>

                    {/* Apply to All Stores Toggle */}
                    <div className="flex items-center gap-3 mb-6">
                        <Switch
                            checked={applyToAllStores}
                            onCheckedChange={setApplyToAllStores}
                        />
                        <span className="text-sm text-gray-700">
                            {t('alertConfig.applyToAllStores')}
                        </span>
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
                            onClick={handleSave}
                            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertConfigDialog;
