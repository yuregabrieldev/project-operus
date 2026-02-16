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
    CreditCard, Truck, Banknote, Save, Trash2, Paperclip, Calendar, Upload, X, CheckCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
    const [attachments, setAttachments] = useState<File[]>([]);
    const [obsGeral, setObsGeral] = useState('');

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
            attachments: attachments.map(f => ({ name: f.name, date: new Date().toISOString() })),
            comments: obsGeral ? [obsGeral] : [],
            openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
            status: 'closed', noMovement: false,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {formStep === 'open' ? 'Abertura de Caixa' : 'Fechamento de Caixa'}
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString('pt-PT')}
                            {formStoreId && <Badge variant="outline">{storeName(formStoreId)}</Badge>}
                        </p>
                    </div>
                </div>

                {formStep === 'open' ? (
                    <div className="space-y-6">
                        <Card>
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
                                        <div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formPreviousClose)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Valor de Abertura</Label>
                                        <Input type="number" step="0.01" value={formOpeningValue} onChange={e => setFormOpeningValue(parseFloat(e.target.value) || 0)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Diferença</Label>
                                        <div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-muted text-muted-foreground' : openingDiff > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                            {fmt(openingDiff)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => { if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; } setShowNoMovDialog(true); }}>Sem Movimentos</Button>
                            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button onClick={handleOpenSubmit} className="bg-primary hover:bg-primary/90"><ArrowUpCircle className="h-4 w-4 mr-2" /> Abrir Caixa</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Sistema */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Sistema</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label className="text-xs">Fech. Anterior</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formPreviousClose)}</div></div>
                                    <div><Label className="text-xs">Abertura</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-muted text-sm">{fmt(formOpeningValue)}</div></div>
                                    <div><Label className="text-xs">Diferença</Label><div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-muted' : openingDiff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>{fmt(openingDiff)}</div></div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Fechamento de Caixa</Label>
                                    <div className="grid grid-cols-4 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-muted-foreground">Espécie</Label><Input type="number" step="0.01" value={closingEspecie || ''} onChange={e => setClosingEspecie(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">Cartão</Label><Input type="number" step="0.01" value={closingCartao || ''} onChange={e => setClosingCartao(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">Delivery</Label><Input type="number" step="0.01" value={closingDelivery || ''} onChange={e => setClosingDelivery(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-primary/10 text-sm font-bold text-primary">{fmt(closingTotal)}</div></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Apuração */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Apuração</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                {/* Espécie */}
                                <div>
                                    <Label className="text-xs flex items-center gap-1"><Banknote className="h-3 w-3" /> Espécie</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        <div><Label className="text-[10px] text-muted-foreground">Notas</Label><Input type="number" step="0.01" value={apuracaoNotas || ''} onChange={e => setApuracaoNotas(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">Moedas</Label><Input type="number" step="0.01" value={apuracaoMoedas || ''} onChange={e => setApuracaoMoedas(parseFloat(e.target.value) || 0)} /></div>
                                        <div><Label className="text-[10px] text-muted-foreground">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">{fmt(apuracaoEspecieTot)}</div></div>
                                    </div>
                                </div>

                                {/* Cartão - dropdown brand */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> Cartão</Label>
                                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded border">Total: {fmt(cartaoTot)}</span>
                                    </div>
                                    {cartaoItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.brand} onValueChange={v => { const n = [...cartaoItems]; n[idx] = { ...n[idx], brand: v }; setCartaoItems(n); }}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="Marca" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cardBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                        <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-primary h-7" onClick={(e) => { e.stopPropagation(); setNewBrandName(''); setShowAddBrandDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Nova Marca
                                                            </Button>
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder="Valor" value={item.value || ''} onChange={e => { const n = [...cartaoItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setCartaoItems(n); }} />
                                            <Button size="sm" variant="ghost" className="text-destructive h-10 px-2" onClick={() => setCartaoItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-2" onClick={() => setCartaoItems(prev => [...prev, { brand: '', value: 0 }])}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                                    </Button>
                                </div>

                                {/* Delivery - dropdown app */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</Label>
                                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded border">Total: {fmt(deliveryTot)}</span>
                                    </div>
                                    {deliveryItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-2 items-end">
                                            <div>
                                                <Select value={item.app} onValueChange={v => { const n = [...deliveryItems]; n[idx] = { ...n[idx], app: v }; setDeliveryItems(n); }}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="App" /></SelectTrigger>
                                                    <SelectContent>
                                                        {deliveryApps.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                        <div className="border-t mt-1 pt-1 px-2 pb-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs text-primary h-7" onClick={(e) => { e.stopPropagation(); setNewAppName(''); setShowAddAppDialog(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> Nova App
                                                            </Button>
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Input type="number" step="0.01" placeholder="Valor" value={item.value || ''} onChange={e => { const n = [...deliveryItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setDeliveryItems(n); }} />
                                            <Button size="sm" variant="ghost" className="text-destructive h-10 px-2" onClick={() => setDeliveryItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-2" onClick={() => setDeliveryItems(prev => [...prev, { app: '', value: 0 }])}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Entradas / Saídas */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Entradas / Saídas</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-emerald-600">Entradas (R$)</Label>
                                    {extras.map((item, idx) => item.type === 'entrada' && (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <Input placeholder="Descrição" value={item.description} onChange={e => { const n = [...extras]; n[idx].description = e.target.value; setExtras(n); }} />
                                            <Input type="number" step="0.01" placeholder="Valor" className="w-32" value={item.value || ''} onChange={e => { const n = [...extras]; n[idx].value = parseFloat(e.target.value) || 0; setExtras(n); }} />
                                            <Button size="icon" variant="ghost" className="text-destructive h-10 w-10" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-2" onClick={() => setExtras([...extras, { description: '', value: 0, type: 'entrada' }])}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-destructive">Saídas (R$)</Label>
                                    {extras.map((item, idx) => item.type === 'saida' && (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <Input placeholder="Descrição" value={item.description} onChange={e => { const n = [...extras]; n[idx].description = e.target.value; setExtras(n); }} />
                                            <Input type="number" step="0.01" placeholder="Valor" className="w-32" value={item.value || ''} onChange={e => { const n = [...extras]; n[idx].value = parseFloat(e.target.value) || 0; setExtras(n); }} />
                                            <Button size="icon" variant="ghost" className="text-destructive h-10 w-10" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-2" onClick={() => setExtras([...extras, { description: '', value: 0, type: 'saida' }])}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Anexos e Observações */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Anexos e Observações</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs mb-2 block">Comprovantes / Fotos</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="relative group">
                                                <div className="h-16 w-16 bg-muted rounded-lg border flex items-center justify-center overflow-hidden">
                                                    {file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" /> : <Paperclip className="h-6 w-6 text-muted-foreground" />}
                                                </div>
                                                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                        <label className="h-16 w-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-[9px] text-muted-foreground mt-1">Adicionar</span>
                                            <input type="file" multiple className="hidden" onChange={e => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Observações Gerais</Label>
                                    <Textarea value={obsGeral} onChange={e => setObsGeral(e.target.value)} placeholder="Ocorrências, justificativas de quebra, etc." className="mt-1 h-20" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumo */}
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo do Fechamento</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Total Apurado</span><span className="font-bold">{fmt(apuracaoTotalCalc)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Total Sistema</span><span className="font-bold">{fmt(closingTotal)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Despesas (Saídas)</span><span className="font-bold text-destructive">{fmt(totalSaidas)}</span></div>
                                <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Entradas Extras</span><span className="font-bold text-emerald-600">{fmt(totalEntradas)}</span></div>
                                <hr className="border-border my-2" />
                                <div className="flex justify-between p-3 bg-muted rounded-lg border">
                                    <span className="font-bold">Diferença (Quebra)</span>
                                    <Badge variant={diferencaTotal === 0 ? 'outline' : diferencaTotal > 0 ? 'default' : 'destructive'} className="text-sm">
                                        {fmt(diferencaTotal)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button onClick={handleCloseSubmit} className="bg-primary hover:bg-primary/90 min-w-[150px]"><CheckCircle className="h-4 w-4 mr-2" /> Finalizar Caixa</Button>
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
