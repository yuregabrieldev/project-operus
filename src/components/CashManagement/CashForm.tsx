import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DollarSign, Plus, ArrowUpCircle, ArrowLeft, AlertTriangle,
    CreditCard, Truck, Banknote, Save, Trash2, Paperclip, Calendar, Upload, X, CheckCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { CashEntry, fmt } from './types';

interface CashFormProps {
    step: 'open' | 'close';
    allStores: { id: string; name: string }[];
    entries: CashEntry[];
    cardBrands: string[];
    deliveryApps: string[];
    onAddBrand: (name: string) => void;
    onAddApp: (name: string) => void;
    onDeleteBrand: (name: string) => void;
    onDeleteApp: (name: string) => void;
    preSelectedStoreId?: string;
    preOpeningValue?: number;
    prePreviousClose?: number;
    cashRegisterIdToClose?: string | null;
    onOpenComplete?: (storeId: string, openingValue: number) => Promise<string | undefined>;
    onOpenSuccess?: () => void;
    cashSettings: { baseValueEnabled: boolean; baseValue: number; extrasConsideredStores: string[] };
    onSubmit: (entry: Omit<CashEntry, 'id'>, cashRegisterId?: string) => void;
    onCancel: () => void;
    mode?: 'edit' | 'view';
    viewEntry?: CashEntry;
}

const CashForm: React.FC<CashFormProps> = ({
    step: initialStep, allStores, entries, cardBrands, deliveryApps,
    onAddBrand, onAddApp, onDeleteBrand, onDeleteApp,
    preSelectedStoreId, preOpeningValue, prePreviousClose,
    cashRegisterIdToClose, onOpenComplete, onOpenSuccess,
    cashSettings, onSubmit, onCancel,
    mode = 'edit', viewEntry,
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const isReadOnly = mode === 'view';
    const [formStep, setFormStep] = useState<'open' | 'close'>(isReadOnly ? 'close' : initialStep);
    const [createdCashRegisterId, setCreatedCashRegisterId] = useState<string | null>(null);
    const [showNoMovDialog, setShowNoMovDialog] = useState(false);
    const [showDiffAlertDialog, setShowDiffAlertDialog] = useState(false);
    const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
    const [showAddAppDialog, setShowAddAppDialog] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [newAppName, setNewAppName] = useState('');

    // Opening
    const [formStoreId, setFormStoreId] = useState(viewEntry?.storeId || preSelectedStoreId || '');
    const [formPreviousClose, setFormPreviousClose] = useState(viewEntry?.previousClose || prePreviousClose || 0);
    const [formOpeningValue, setFormOpeningValue] = useState(viewEntry?.openingValue || preOpeningValue || 0);

    // When store or settings change: "Fechamento Anterior" = valor base (se ativo) ou último fechamento (zero se depositado)
    useEffect(() => {
        if (isReadOnly) return;
        if (!formStoreId) {
            setFormPreviousClose(0);
            return;
        }
        if (cashSettings.baseValueEnabled) {
            setFormPreviousClose(cashSettings.baseValue ?? 0);
            return;
        }
        const closedForStore = entries
            .filter(e => e.storeId === formStoreId && e.status === 'closed')
            .sort((a, b) => b.date.localeCompare(a.date));
        const last = closedForStore[0];
        if (!last) {
            setFormPreviousClose(0);
            return;
        }
        setFormPreviousClose(last.depositStatus === 'deposited' ? 0 : last.closingTotal);
    }, [formStoreId, entries, cashSettings.baseValueEnabled, cashSettings.baseValue, isReadOnly]);

    // Closing
    const [closingEspecie, setClosingEspecie] = useState(viewEntry?.closingEspecie || 0);
    const [closingCartao, setClosingCartao] = useState(viewEntry?.closingCartao || 0);
    const [closingDelivery, setClosingDelivery] = useState(viewEntry?.closingDelivery || 0);
    const [apuracaoNotas, setApuracaoNotas] = useState(viewEntry?.apuracaoNotas || 0);
    const [apuracaoMoedas, setApuracaoMoedas] = useState(viewEntry?.apuracaoMoedas || 0);
    const [cartaoItems, setCartaoItems] = useState<{ brand: string; value: number }[]>(viewEntry?.cartaoItems || []);
    const [deliveryItems, setDeliveryItems] = useState<{ app: string; value: number }[]>(viewEntry?.deliveryItems || []);
    const [extras, setExtras] = useState<{ description: string; value: number; type: 'entrada' | 'saida' }[]>(viewEntry?.extras || []);
    const [depositValue, setDepositValue] = useState(viewEntry?.depositValue || 0);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [obsGeral, setObsGeral] = useState(viewEntry?.comments?.[0] || '');

    useEffect(() => {
        if (!isReadOnly || !viewEntry) return;
        setFormStep('close');
        setFormStoreId(viewEntry.storeId);
        setFormPreviousClose(viewEntry.previousClose || 0);
        setFormOpeningValue(viewEntry.openingValue || 0);
        setClosingEspecie(viewEntry.closingEspecie || 0);
        setClosingCartao(viewEntry.closingCartao || 0);
        setClosingDelivery(viewEntry.closingDelivery || 0);
        setApuracaoNotas(viewEntry.apuracaoNotas || 0);
        setApuracaoMoedas(viewEntry.apuracaoMoedas || 0);
        setCartaoItems(viewEntry.cartaoItems || []);
        setDeliveryItems(viewEntry.deliveryItems || []);
        setExtras(viewEntry.extras || []);
        setDepositValue(viewEntry.depositValue || 0);
        setObsGeral(viewEntry.comments?.[0] || '');
    }, [isReadOnly, viewEntry]);

    const today = new Date().toISOString().split('T')[0];
    const openingDiff = formOpeningValue - formPreviousClose;
    const closingTotal = closingEspecie + closingCartao + closingDelivery;
    const apuracaoEspecieTot = apuracaoNotas + apuracaoMoedas;
    const cartaoTot = cartaoItems.reduce((s, i) => s + i.value, 0);
    const deliveryTot = deliveryItems.reduce((s, i) => s + i.value, 0);
    const considerExtras = cashSettings.extrasConsideredStores.includes(formStoreId);
    const entradasTotal = extras.filter(e => e.type === 'entrada').reduce((s, i) => s + i.value, 0);
    const saidasTotal = extras.filter(e => e.type === 'saida').reduce((s, i) => s + i.value, 0);
    const extrasNet = considerExtras ? (entradasTotal - saidasTotal) : 0;
    const valorTotal = apuracaoEspecieTot + cartaoTot + deliveryTot + extrasNet;
    const diferenca = valorTotal - closingTotal;

    // Aliases for compatibility with the view refactor
    const apuracaoTotalCalc = valorTotal;
    const totalSaidas = saidasTotal;
    const totalEntradas = entradasTotal;
    const diferencaTotal = diferenca;

    const storeName = (id: string) => allStores.find(s => s.id === id)?.name || t('cash.store');

    const handleOpenSubmit = async () => {
        if (!formStoreId) { toast({ title: t('cashForm.selectStoreError'), variant: 'destructive' }); return; }
        const existsToday = entries.find(e => e.date === today && e.storeId === formStoreId);
        if (existsToday) { toast({ title: t('cashForm.alreadyOpenToday'), variant: 'destructive' }); return; }
        if (onOpenComplete) {
            const id = await onOpenComplete(formStoreId, formOpeningValue);
            if (id) {
                if (onOpenSuccess) {
                    onOpenSuccess();
                } else {
                    setCreatedCashRegisterId(id);
                    setFormStep('close');
                    toast({ title: t('cashForm.cashOpenedFill') });
                }
            } else {
                toast({ title: t('cashForm.openErrorGeneric'), variant: 'destructive' });
            }
        } else {
            if (onOpenSuccess) onOpenSuccess();
            else { setFormStep('close'); toast({ title: t('cashForm.cashOpenedFill') }); }
        }
    };

    const handleNoMovement = async () => {
        if (!formStoreId) return;
        let idToClose = cashRegisterIdToClose ?? undefined;
        if (!idToClose && onOpenComplete) {
            idToClose = await onOpenComplete(formStoreId, 0) ?? undefined;
        }
        onSubmit(
            {
                storeId: formStoreId, date: today, openingValue: 0, previousClose: 0,
                closingEspecie: 0, closingCartao: 0, closingDelivery: 0, closingTotal: 0,
                apuracaoNotas: 0, apuracaoMoedas: 0, apuracaoEspecieTotal: 0,
                cartaoItems: [], deliveryItems: [], extras: [],
                depositValue: 0, depositStatus: 'deposited',
                attachments: [], comments: [t('cashForm.noMovementsMark')],
                openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
                status: 'closed', noMovement: true,
            },
            idToClose
        );
        setShowNoMovDialog(false);
    };

    const handleCloseSubmit = () => {
        const idToClose = cashRegisterIdToClose ?? createdCashRegisterId ?? undefined;
        onSubmit(
            {
                storeId: formStoreId, date: today,
                openingValue: formOpeningValue, previousClose: formPreviousClose,
                closingEspecie, closingCartao, closingDelivery, closingTotal,
                apuracaoNotas, apuracaoMoedas, apuracaoEspecieTotal: apuracaoEspecieTot,
                cartaoItems, deliveryItems, extras,
                depositValue, depositStatus: 'pending',
                attachments: attachments.map(f => ({ name: f.name, date: new Date().toISOString() })),
                comments: obsGeral ? [obsGeral] : [],
                openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
                status: 'closed', noMovement: false,
            },
            idToClose
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {formStep === 'open' ? t('cashForm.openTitle') : t('cashForm.closeTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" /> {(isReadOnly && viewEntry ? new Date(viewEntry.date + 'T12:00:00') : new Date()).toLocaleDateString('pt-PT')}
                            {formStoreId && <Badge variant="outline">{storeName(formStoreId)}</Badge>}
                        </p>
                    </div>
                </div>

                {formStep === 'open' ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> {t('cashForm.openingData')}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold">{t('cashForm.storeRequired')}</Label>
                                    <Select value={formStoreId} onValueChange={setFormStoreId}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder={t('cashForm.selectStore')} /></SelectTrigger>
                                        <SelectContent>
                                            {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs">{t('cashForm.previousClose')}</Label>
                                        <div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formPreviousClose)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">{t('cashForm.openingValue')}</Label>
                                        <Input type="number" step="0.01" value={formOpeningValue} onChange={e => setFormOpeningValue(parseFloat(e.target.value) || 0)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">{t('cashForm.difference')}</Label>
                                        <div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-muted text-muted-foreground' : openingDiff > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                            {fmt(openingDiff)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => { if (!formStoreId) { toast({ title: t('cashForm.selectStoreError'), variant: 'destructive' }); return; } setShowNoMovDialog(true); }}>{t('cashForm.noMovements')}</Button>
                            <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
                            <Button type="button" onClick={handleOpenSubmit} className="bg-primary hover:bg-primary/90"><ArrowUpCircle className="h-4 w-4 mr-2" /> {t('cashForm.openCash')}</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Sistema */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('cashForm.system')}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label className="text-xs">{t('cashForm.prevCloseShort')}</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formPreviousClose)}</div></div>
                                    <div><Label className="text-xs">{t('cash.opening')}</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formOpeningValue)}</div></div>
                                    <div><Label className="text-xs">{t('cashForm.difference')}</Label><div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-muted' : openingDiff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>{fmt(openingDiff)}</div></div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">{t('cashForm.closingLabel')}</Label>
                                    <div className="grid grid-cols-4 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-muted-foreground">{t('cash.cash')}</Label><Input type="number" step="0.01" value={closingEspecie || ''} onChange={e => setClosingEspecie(parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">{t('cash.card')}</Label><Input type="number" step="0.01" value={closingCartao || ''} onChange={e => setClosingCartao(parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">{t('cash.delivery')}</Label><Input type="number" step="0.01" value={closingDelivery || ''} onChange={e => setClosingDelivery(parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">{t('common.total')}</Label><div className="h-10 flex items-center px-3 rounded-md border bg-primary/10 text-sm font-bold text-primary">{fmt(closingTotal)}</div></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Apuração */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('cashForm.assessment')}</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                {/* Espécie */}
                                <div>
                                    <Label className="text-xs flex items-center gap-1"><Banknote className="h-3 w-3" /> {t('cash.cash')}</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-muted-foreground">{t('cashForm.notes')}</Label><Input type="number" step="0.01" value={apuracaoNotas || ''} onChange={e => setApuracaoNotas(parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">{t('cashForm.coins')}</Label><Input type="number" step="0.01" value={apuracaoMoedas || ''} onChange={e => setApuracaoMoedas(parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">{t('common.total')}</Label><div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">{fmt(apuracaoEspecieTot)}</div></div>
                                    </div>
                                </div>

                                {/* Cartão - dropdown brand */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> {t('cash.card')}</Label>
                                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded border">{t('common.total')}: {fmt(cartaoTot)}</span>
                                    </div>
                                    {cartaoItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.brand} onValueChange={v => { const n = [...cartaoItems]; n[idx] = { ...n[idx], brand: v }; setCartaoItems(n); }} disabled={isReadOnly}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder={t('cashForm.brand')} /></SelectTrigger>
                                                    <SelectContent>
                                                        {cardBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                        {!isReadOnly && <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-primary h-7" onClick={(e) => { e.stopPropagation(); setNewBrandName(''); setShowAddBrandDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> {t('cashForm.newBrand')}
                                                            </Button>
                                                        </div>}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder={t('cashForm.value')} value={item.value || ''} onChange={e => { const n = [...cartaoItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setCartaoItems(n); }} disabled={isReadOnly} />
                                            {!isReadOnly && <Button size="sm" variant="ghost" className="text-destructive h-10 px-2" onClick={() => setCartaoItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>}
                                        </div>
                                    ))}
                                    {!isReadOnly && <Button variant="outline" className="w-full mt-2" onClick={() => setCartaoItems(prev => [...prev, { brand: '', value: 0 }])}>
                                        <Plus className="h-4 w-4 mr-2" /> {t('common.add')}
                                    </Button>}
                                </div>

                                {/* Delivery - dropdown app */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> {t('cash.delivery')}</Label>
                                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded border">{t('common.total')}: {fmt(deliveryTot)}</span>
                                    </div>
                                    {deliveryItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.app} onValueChange={v => { const n = [...deliveryItems]; n[idx] = { ...n[idx], app: v }; setDeliveryItems(n); }} disabled={isReadOnly}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="App" /></SelectTrigger>
                                                    <SelectContent>
                                                        {deliveryApps.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                        {!isReadOnly && <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-primary h-7" onClick={(e) => { e.stopPropagation(); setNewAppName(''); setShowAddAppDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> {t('cashForm.newApp')}
                                                            </Button>
                                                        </div>}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder={t('cashForm.value')} value={item.value || ''} onChange={e => { const n = [...deliveryItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setDeliveryItems(n); }} disabled={isReadOnly} />
                                            {!isReadOnly && <Button size="sm" variant="ghost" className="text-destructive h-10 px-2" onClick={() => setDeliveryItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>}
                                        </div>
                                    ))}
                                    {!isReadOnly && <Button variant="outline" className="w-full mt-2" onClick={() => setDeliveryItems(prev => [...prev, { app: '', value: 0 }])}>
                                        <Plus className="h-4 w-4 mr-2" /> {t('common.add')}
                                    </Button>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Entradas / Saídas */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('cashForm.extrasTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-emerald-600">{t('cashForm.inflows')}</Label>
                                    {extras.map((item, idx) => item.type === 'entrada' && (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <Input placeholder={t('cashForm.description')} value={item.description} onChange={e => { const n = [...extras]; n[idx].description = e.target.value; setExtras(n); }} disabled={isReadOnly} />
                                            <Input type="number" step="0.01" placeholder={t('cashForm.value')} className="w-32" value={item.value || ''} onChange={e => { const n = [...extras]; n[idx].value = parseFloat(e.target.value) || 0; setExtras(n); }} disabled={isReadOnly} />
                                            {!isReadOnly && <Button size="icon" variant="ghost" className="text-destructive h-10 w-10" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>}
                                        </div>
                                    ))}
                                    {!isReadOnly && <Button variant="outline" className="w-full mt-2" onClick={() => setExtras([...extras, { description: '', value: 0, type: 'entrada' }])}>
                                        <Plus className="h-4 w-4 mr-2" /> {t('common.add')}
                                    </Button>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-destructive">{t('cashForm.outflowsLabel')}</Label>
                                    {extras.map((item, idx) => item.type === 'saida' && (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <Input placeholder={t('cashForm.description')} value={item.description} onChange={e => { const n = [...extras]; n[idx].description = e.target.value; setExtras(n); }} disabled={isReadOnly} />
                                            <Input type="number" step="0.01" placeholder={t('cashForm.value')} className="w-32" value={item.value || ''} onChange={e => { const n = [...extras]; n[idx].value = parseFloat(e.target.value) || 0; setExtras(n); }} disabled={isReadOnly} />
                                            {!isReadOnly && <Button size="icon" variant="ghost" className="text-destructive h-10 w-10" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>}
                                        </div>
                                    ))}
                                    {!isReadOnly && <Button variant="outline" className="w-full mt-2" onClick={() => setExtras([...extras, { description: '', value: 0, type: 'saida' }])}>
                                        <Plus className="h-4 w-4 mr-2" /> {t('common.add')}
                                    </Button>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Anexos e Observações */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('cashForm.attachmentsTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs mb-2 block">{t('cashForm.receiptsPhotos')}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {isReadOnly && viewEntry?.attachments?.map((file, i) => (
                                            <div key={`db-${i}`} className="h-16 px-3 bg-muted rounded-lg border flex items-center text-xs text-muted-foreground">
                                                {file.name}
                                            </div>
                                        ))}
                                        {attachments.map((file, i) => (
                                            <div key={i} className="relative group">
                                                <div className="h-16 w-16 bg-muted rounded-lg border flex items-center justify-center overflow-hidden">
                                                    {file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" /> : <Paperclip className="h-6 w-6 text-muted-foreground" />}
                                                </div>
                                                {!isReadOnly && <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>}
                                            </div>
                                        ))}
                                        {!isReadOnly && <label className="h-16 w-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-[9px] text-muted-foreground mt-1">{t('common.add')}</span>
                                            <input type="file" multiple className="hidden" onChange={e => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                                        </label>}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">{t('cashForm.generalObs')}</Label>
                                    <Textarea value={obsGeral} onChange={e => setObsGeral(e.target.value)} placeholder={t('cashForm.obsPlaceholder')} className="mt-1 h-20" disabled={isReadOnly} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumo */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('cashForm.summaryTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>{t('cashForm.totalAssessed')}</span><span className="font-bold">{fmt(apuracaoTotalCalc)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>{t('cashForm.totalSystem')}</span><span className="font-bold">{fmt(closingTotal)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>{t('cashForm.expenses')}</span><span className="font-bold text-destructive">{fmt(totalSaidas)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>{t('cashForm.extraInflows')}</span><span className="font-bold text-emerald-600">{fmt(totalEntradas)}</span></div>
                                <hr className="border-border my-2" />
                                <div className="flex justify-between p-3 bg-muted rounded-lg border">
                                    <span className="font-bold">{t('cashForm.differenceBreach')}</span>
                                    <Badge variant={diferencaTotal === 0 ? 'outline' : diferencaTotal > 0 ? 'default' : 'destructive'} className="text-sm">
                                        {fmt(diferencaTotal)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={onCancel}>{isReadOnly ? t('common.back') : t('common.cancel')}</Button>
                            {!isReadOnly && <Button onClick={() => {
                                if (diferencaTotal !== 0) {
                                    setShowDiffAlertDialog(true);
                                } else {
                                    handleCloseSubmit();
                                }
                            }} className="bg-primary hover:bg-primary/90 min-w-[150px]"><CheckCircle className="h-4 w-4 mr-2" /> {t('cashForm.finalize')}</Button>}
                        </div>
                    </div>
                )}
            </div>

            {/* No Movement */}
            <Dialog open={showNoMovDialog && !isReadOnly} onOpenChange={setShowNoMovDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> {t('cashForm.noMovementTitle')}</DialogTitle>
                        <DialogDescription>{t('cashForm.noMovementDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoMovDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleNoMovement} className="bg-gradient-to-r from-yellow-600 to-orange-600">{t('common.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Difference Alert Dialog */}
            <Dialog open={showDiffAlertDialog && !isReadOnly} onOpenChange={setShowDiffAlertDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {t('cashForm.diffAlertTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('cashForm.diffAlertDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                        <span className="font-medium text-foreground">{t('cashForm.differenceBreach')}</span>
                        <Badge variant="destructive" className="text-base px-3 py-1">
                            {fmt(diferencaTotal)}
                        </Badge>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowDiffAlertDialog(false)}>
                            {t('cashForm.diffAlertReview')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowDiffAlertDialog(false);
                                handleCloseSubmit();
                            }}
                        >
                            {t('cashForm.diffAlertConfirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Brand Dialog */}
            <Dialog open={showAddBrandDialog && !isReadOnly} onOpenChange={setShowAddBrandDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader><DialogTitle>{t('cash.newCardBrand')}</DialogTitle></DialogHeader>
                    <div><Label>{t('common.name')} *</Label><Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Ex: VISA, MASTERCARD" className="mt-1" /></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddBrandDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={() => {
                            if (!newBrandName.trim()) return;
                            if (cardBrands.some(b => b.toUpperCase() === newBrandName.trim().toUpperCase())) {
                                toast({ title: t('cash.brandExists'), variant: 'destructive' }); return;
                            }
                            onAddBrand(newBrandName.trim().toUpperCase());
                            setShowAddBrandDialog(false);
                            toast({ title: t('cash.brandAdded') });
                        }}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add App Dialog */}
            <Dialog open={showAddAppDialog && !isReadOnly} onOpenChange={setShowAddAppDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader><DialogTitle>{t('cash.newDeliveryApp')}</DialogTitle></DialogHeader>
                    <div><Label>{t('common.name')} *</Label><Input value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="Ex: UBEREATS, GLOVO" className="mt-1" /></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddAppDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={() => {
                            if (!newAppName.trim()) return;
                            if (deliveryApps.some(a => a.toUpperCase() === newAppName.trim().toUpperCase())) {
                                toast({ title: t('cash.appExists'), variant: 'destructive' }); return;
                            }
                            onAddApp(newAppName.trim().toUpperCase());
                            setShowAddAppDialog(false);
                            toast({ title: t('cash.appAdded') });
                        }}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CashForm;
