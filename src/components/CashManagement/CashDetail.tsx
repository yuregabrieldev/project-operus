import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useBrand } from '@/contexts/BrandContext';
import { CashEntry, cashRegisterToEntry } from './types';
import CashForm from './CashForm';

const CashDetail: React.FC = () => {
    const { t } = useLanguage();
    const { lang = 'pt', id } = useParams<{ lang: string; id: string }>();
    const navigate = useNavigate();
    const { stores, cashRegisters } = useData();
    const { stores: brandStores, selectedBrand } = useBrand();

    const allStores = useMemo(() =>
        brandStores.length > 0 ? brandStores : stores.map(s => ({ ...s, brandId: selectedBrand?.id || '' })),
        [brandStores, stores, selectedBrand]
    );

    const storeName = (storeId: string) => allStores.find(s => s.id === storeId)?.name || t('cash.store');

    // Load real entry by ID from persisted cash registers
    const entry: CashEntry | undefined = useMemo(() => {
        if (!id) return undefined;
        const cr = cashRegisters.find(c => c.id === id);
        return cr ? cashRegisterToEntry(cr) : undefined;
    }, [id, cashRegisters]);

    if (!entry) {
        return (
            <div className="p-6 text-center space-y-4">
                <h2 className="text-xl font-semibold text-foreground">{t('cash.detailNotFound')}</h2>
                <p className="text-muted-foreground">{t('cash.detailNotFoundDesc')}</p>
                <Button variant="outline" onClick={() => navigate(`/${lang}/caixa`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}
                </Button>
            </div>
        );
    }

    const allEntries = useMemo(() => cashRegisters.map(cr => cashRegisterToEntry(cr)), [cashRegisters]);
    const cardBrands = useMemo(() => {
        const fromEntry = entry.cartaoItems.map(i => i.brand).filter(Boolean);
        return [...new Set(fromEntry)];
    }, [entry]);
    const deliveryApps = useMemo(() => {
        const fromEntry = entry.deliveryItems.map(i => i.app).filter(Boolean);
        return [...new Set(fromEntry)];
    }, [entry]);

    return (
        <CashForm
            step="close"
            mode="view"
            viewEntry={entry}
            allStores={allStores.map(s => ({ id: s.id, name: s.name }))}
            entries={allEntries}
            cardBrands={cardBrands}
            deliveryApps={deliveryApps}
            onAddBrand={() => undefined}
            onAddApp={() => undefined}
            onDeleteBrand={() => undefined}
            onDeleteApp={() => undefined}
            cashSettings={{ baseValueEnabled: false, baseValue: 0, extrasConsideredStores: [] }}
            onSubmit={() => undefined}
            onCancel={() => navigate(`/${lang}/caixa`)}
        />
    );
};

export default CashDetail;
