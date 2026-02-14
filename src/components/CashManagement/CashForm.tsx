import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DollarSign, Plus, ArrowUpCircle, ArrowLeft, AlertTriangle,
    CreditCard, Truck, Banknote, Save, Trash2, Paperclip, Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
    cashSettings: { baseValueEnabled: boolean; baseValue: number; extrasConsideredStores: string[] };
    onSubmit: (entry: Omit<CashEntry, 'id'>) => void;
    onCancel: () => void;
}

const CashForm: React.FC<CashFormProps> = ({
    step: initialStep, allStores, entries, cardBrands, deliveryApps,
    onAddBrand, onAddApp, onDeleteBrand, onDeleteApp,
    preSelectedStoreId, preOpeningValue, prePreviousClose,
    cashSettings, onSubmit, onCancel,
}) => {
    const { user } = useAuth();
    const [formStep, setFormStep] = useState(initialStep);
    const [showNoMovDialog, setShowNoMovDialog] = useState(false);
    const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
    const [showAddAppDialog, setShowAddAppDialog] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [newAppName, setNewAppName] = useState('');

    // Opening
    const [formStoreId, setFormStoreId] = useState(preSelectedStoreId || '');
    const [formPreviousClose, setFormPreviousClose] = useState(prePreviousClose || 0);
    const [formOpeningValue, setFormOpeningValue] = useState(preOpeningValue || 0);

    // Closing
    const [closingEspecie, setClosingEspecie] = useState(0);
    const [closingCartao, setClosingCartao] = useState(0);
    const [closingDelivery, setClosingDelivery] = useState(0);
    const [apuracaoNotas, setApuracaoNotas] = useState(0);
    const [apuracaoMoedas, setApuracaoMoedas] = useState(0);
    const [cartaoItems, setCartaoItems] = useState<{ brand: string; value: number }[]>([]);
    const [deliveryItems, setDeliveryItems] = useState<{ app: string; value: number }[]>([]);
    const [extras, setExtras] = useState<{ description: string; value: number; type: 'entrada' | 'saida' }[]>([]);
    const [depositValue, setDepositValue] = useState(0);
    const [attachments, setAttachments] = useState<{ name: string; date: string }[]>([]);

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

    const storeName = (id: string) => allStores.find(s => s.id === id)?.name || 'Loja';

    const handleOpenSubmit = () => {
        if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; }
        const existsToday = entries.find(e => e.date === today && e.storeId === formStoreId);
        if (existsToday) { toast({ title: 'Já existe um caixa para esta loja hoje', variant: 'destructive' }); return; }
        setFormStep('close');
        toast({ title: 'Caixa aberto! Preencha o fechamento.' });
    };

    const handleNoMovement = () => {
        if (!formStoreId) return;
        onSubmit({
            storeId: formStoreId, date: today, openingValue: 0, previousClose: 0,
            closingEspecie: 0, closingCartao: 0, closingDelivery: 0, closingTotal: 0,
            apuracaoNotas: 0, apuracaoMoedas: 0, apuracaoEspecieTotal: 0,
            cartaoItems: [], deliveryItems: [], extras: [],
            depositValue: 0, depositStatus: 'deposited',
            attachments: [], comments: ['Sem movimentos'],
            openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
            status: 'closed', noMovement: true,
        });
        setShowNoMovDialog(false);
    };

    const handleCloseSubmit = () => {
        onSubmit({
            storeId: formStoreId, date: today,
            openingValue: formOpeningValue, previousClose: formPreviousClose,
            closingEspecie, closingCartao, closingDelivery, closingTotal,
            apuracaoNotas, apuracaoMoedas, apuracaoEspecieTotal: apuracaoEspecieTot,
            cartaoItems, deliveryItems, extras,
            depositValue, depositStatus: 'pending',
            attachments, comments: [],
            openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
            status: 'closed', noMovement: false,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {formStep === 'open' ? 'Abertura de Caixa' : 'Fechamento de Caixa'}
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString('pt-PT')}
                            {formStoreId && <Badge variant="outline">{storeName(formStoreId)}</Badge>}
                        </p>
                    </div>
                </div>

                {formStep === 'open' ? (
                    <div className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Dados de Abertura</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold">Loja *</Label>
                                    <Select value={formStoreId} onValueChange={setFormStoreId}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar Loja" /></SelectTrigger>
                                        <SelectContent>
                                            {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs">Fechamento Anterior</Label>
                                        <div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm">{fmt(formPreviousClose)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Valor de Abertura</Label>
                                        <Input type="number" step="0.01" value={formOpeningValue} onChange={e => setFormOpeningValue(parseFloat(e.target.value) || 0)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Diferença</Label>
                                        <div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-gray-100 text-gray-600' : openingDiff > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {fmt(openingDiff)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => { if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; } setShowNoMovDialog(true); }}>Sem Movimentos</Button>
                            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button onClick={handleOpenSubmit} className="bg-gradient-to-r from-green-600 to-emerald-600"><ArrowUpCircle className="h-4 w-4 mr-2" /> Abrir Caixa</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Sistema */}
                        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Sistema</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label className="text-xs">Fech. Anterior</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm">{fmt(formPreviousClose)}</div></div>
                                    <div><Label className="text-xs">Abertura</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm">{fmt(formOpeningValue)}</div></div>
                                    <div><Label className="text-xs">Diferença</Label><div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-gray-100' : openingDiff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{fmt(openingDiff)}</div></div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Fechamento de Caixa</Label>
                                    <div className="grid grid-cols-4 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-gray-400">Espécie</Label><Input type="number" step="0.01" value={closingEspecie || ''} onChange={e => setClosingEspecie(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-gray-400">Cartão</Label><Input type="number" step="0.01" value={closingCartao || ''} onChange={e => setClosingCartao(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-gray-400">Delivery</Label><Input type="number" step="0.01" value={closingDelivery || ''} onChange={e => setClosingDelivery(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-gray-400">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-blue-50 text-sm font-bold text-blue-700">{fmt(closingTotal)}</div></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Apuração */}
                        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Apuração</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                {/* Espécie */}
                                <div>
                                    <Label className="text-xs flex items-center gap-1"><Banknote className="h-3 w-3" /> Espécie</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-gray-400">Notas</Label><Input type="number" step="0.01" value={apuracaoNotas || ''} onChange={e => setApuracaoNotas(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-gray-400">Moedas</Label><Input type="number" step="0.01" value={apuracaoMoedas || ''} onChange={e => setApuracaoMoedas(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-gray-400">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm font-semibold">{fmt(apuracaoEspecieTot)}</div></div>
                                    </div>
                                </div>

                                {/* Cartão - dropdown brand */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> Cartão</Label>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setCartaoItems(prev => [...prev, { brand: '', value: 0 }])}>+ Adicionar</Button>
                                    </div>
                                    {cartaoItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.brand} onValueChange={v => { const n = [...cartaoItems]; n[idx] = { ...n[idx], brand: v }; setCartaoItems(n); }}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="Marca" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cardBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                        <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-blue-600 h-7" onClick={(e) => { e.stopPropagation(); setNewBrandName(''); setShowAddBrandDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Nova Marca
                                                            </Button>
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder="Valor" value={item.value || ''} onChange={e => { const n = [...cartaoItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setCartaoItems(n); }} />
                                            <Button size="sm" variant="outline" className="text-red-600 h-10 px-2" onClick={() => setCartaoItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    {cartaoItems.length > 0 && <p className="text-xs text-right mt-1 font-semibold">Total: {fmt(cartaoTot)}</p>}
                                </div>

                                {/* Delivery - dropdown app */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</Label>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setDeliveryItems(prev => [...prev, { app: '', value: 0 }])}>+ Adicionar</Button>
                                    </div>
                                    {deliveryItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.app} onValueChange={v => { const n = [...deliveryItems]; n[idx] = { ...n[idx], app: v }; setDeliveryItems(n); }}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="App" /></SelectTrigger>
                                                    <SelectContent>
                                                        {deliveryApps.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                        <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-blue-600 h-7" onClick={(e) => { e.stopPropagation(); setNewAppName(''); setShowAddAppDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Nova App
                                                            </Button>
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder="Valor" value={item.value || ''} onChange={e => { const n = [...deliveryItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setDeliveryItems(n); }} />
                                            <Button size="sm" variant="outline" className="text-red-600 h-10 px-2" onClick={() => setDeliveryItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    {deliveryItems.length > 0 && <p className="text-xs text-right mt-1 font-semibold">Total: {fmt(deliveryTot)}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Entradas/Saídas */}
                        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span>Entradas/Saídas{!considerExtras && <span className="text-[10px] text-gray-400 ml-2 font-normal">(Ilustrativo — não considerado na apuração)</span>}</span>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setExtras(prev => [...prev, { description: '', value: 0, type: 'entrada' }])}>+ Adicionar</Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {extras.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-[100px_1fr_1fr_auto] gap-2 mt-2 items-end">
                                        <Select value={item.type} onValueChange={(v: 'entrada' | 'saida') => { const n = [...extras]; n[idx] = { ...n[idx], type: v }; setExtras(n); }}>
                                            <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="entrada">Entrada</SelectItem>
                                                <SelectItem value="saida">Saída</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input placeholder="Descrição" value={item.description} onChange={e => { const n = [...extras]; n[idx] = { ...n[idx], description: e.target.value }; setExtras(n); }} />
                                        <Input type="number" step="0.01" placeholder="Valor" value={item.value || ''} onChange={e => { const n = [...extras]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setExtras(n); }} />
                                        <Button size="sm" variant="outline" className="text-red-600 h-10 px-2" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                ))}
                                {extras.length > 0 && (
                                    <div className="text-xs text-right mt-2 space-y-0.5">
                                        <p className="text-green-600">Entradas: {fmt(entradasTotal)}</p>
                                        <p className="text-red-600">Saídas: {fmt(saidasTotal)}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className={`border-2 shadow-lg ${diferenca === 0 ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
                            <CardContent className="p-5">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div><Label className="text-[10px] text-gray-500">Valor Total Apurado</Label><div className="text-lg font-bold text-gray-900">{fmt(valorTotal)}</div></div>
                                    <div>
                                        <Label className="text-[10px] text-gray-500">Diferença</Label>
                                        <div className={`text-lg font-bold ${diferenca === 0 ? 'text-green-600' : diferenca < 0 ? 'text-red-600' : 'text-yellow-600'}`}>{fmt(diferenca)}</div>
                                        {diferenca !== 0 && <p className="text-[10px] text-red-500">Diferença de {fmt(diferenca)}</p>}
                                    </div>
                                    <div><Label className="text-[10px] text-gray-500">Valor para Depósito</Label><Input type="number" step="0.01" value={depositValue || ''} onChange={e => setDepositValue(parseFloat(e.target.value) || 0)} className="mt-1" /></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Anexos */}
                        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> Anexos</span>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setAttachments(prev => [...prev, { name: `Anexo ${prev.length + 1}`, date: new Date().toLocaleDateString('pt-PT') }])}>+ Adicionar</Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {attachments.length === 0 && <p className="text-xs text-gray-400">Nenhum anexo</p>}
                                {attachments.map((a, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                        <span className="text-sm">{a.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{a.date}</span>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex gap-3 justify-end pb-8">
                            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button onClick={handleCloseSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600"><Save className="h-4 w-4 mr-2" /> Salvar Fechamento</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* No Movement */}
            <Dialog open={showNoMovDialog} onOpenChange={setShowNoMovDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Sem Movimentos</DialogTitle>
                        <DialogDescription>Deseja criar um registro sem movimentos para hoje?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoMovDialog(false)}>Cancelar</Button>
                        <Button onClick={handleNoMovement} className="bg-gradient-to-r from-yellow-600 to-orange-600">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Brand Dialog */}
            <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader><DialogTitle>Nova Marca de Cartão</DialogTitle></DialogHeader>
                    <div><Label>Nome *</Label><Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Ex: VISA, MASTERCARD" className="mt-1" /></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddBrandDialog(false)}>Cancelar</Button>
                        <Button onClick={() => {
                            if (!newBrandName.trim()) return;
                            if (cardBrands.some(b => b.toUpperCase() === newBrandName.trim().toUpperCase())) {
                                toast({ title: 'Marca já existe', variant: 'destructive' }); return;
                            }
                            onAddBrand(newBrandName.trim().toUpperCase());
                            setShowAddBrandDialog(false);
                            toast({ title: 'Marca adicionada!' });
                        }}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add App Dialog */}
            <Dialog open={showAddAppDialog} onOpenChange={setShowAddAppDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader><DialogTitle>Nova App de Delivery</DialogTitle></DialogHeader>
                    <div><Label>Nome *</Label><Input value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="Ex: UBEREATS, GLOVO" className="mt-1" /></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddAppDialog(false)}>Cancelar</Button>
                        <Button onClick={() => {
                            if (!newAppName.trim()) return;
                            if (deliveryApps.some(a => a.toUpperCase() === newAppName.trim().toUpperCase())) {
                                toast({ title: 'App já existe', variant: 'destructive' }); return;
                            }
                            onAddApp(newAppName.trim().toUpperCase());
                            setShowAddAppDialog(false);
                            toast({ title: 'App adicionada!' });
                        }}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CashForm;
