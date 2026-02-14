import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, Plus, Eye, Edit, Paperclip, MessageSquare, Calendar,
  CheckCircle, Clock, CreditCard, Truck, Banknote, TrendingUp,
  Settings, FileText, BarChart3, Trash2, ChevronDown, ChevronUp,
  Download, ArrowRight, History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useBrand } from '@/contexts/BrandContext';
import { toast } from '@/hooks/use-toast';
import CashForm from './CashForm';
import { CashEntry, DepositRecord, CashSettings, DEMO_ENTRIES, DEMO_DEPOSITS, DEFAULT_CARD_BRANDS, DEFAULT_DELIVERY_APPS, fmt } from './types';

const CashManager: React.FC = () => {
  const { user } = useAuth();
  const { stores } = useData();
  const { stores: brandStores, selectedBrand } = useBrand();

  const [activeTab, setActiveTab] = useState('caixa');
  const [showForm, setShowForm] = useState(false);
  const [formInitStep, setFormInitStep] = useState<'open' | 'close'>('open');
  const [preStoreId, setPreStoreId] = useState('');
  const [preOpeningValue, setPreOpeningValue] = useState(0);
  const [prePreviousClose, setPrePreviousClose] = useState(0);

  // Shared state
  const [entries, setEntries] = useState<CashEntry[]>(DEMO_ENTRIES);
  const [deposits, setDeposits] = useState<DepositRecord[]>(DEMO_DEPOSITS);
  const [cardBrands, setCardBrands] = useState<string[]>(DEFAULT_CARD_BRANDS);
  const [deliveryApps, setDeliveryApps] = useState<string[]>(DEFAULT_DELIVERY_APPS);
  const [cashSettings, setCashSettings] = useState<CashSettings>({ baseValueEnabled: false, baseValue: 0, extrasConsideredStores: [] });

  // Filters
  const [filterStore, setFilterStore] = useState('all');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Deposit state
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [depositStoreId, setDepositStoreId] = useState('');
  const [depositFormValue, setDepositFormValue] = useState(0);
  const [depositFormDate, setDepositFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositFormComment, setDepositFormComment] = useState('');

  // View entry
  const [viewingEntry, setViewingEntry] = useState<CashEntry | null>(null);

  const allStores = useMemo(() =>
    brandStores.length > 0 ? brandStores : stores.map(s => ({ ...s, brandId: selectedBrand?.id || '' })),
    [brandStores, stores, selectedBrand]
  );

  const today = new Date().toISOString().split('T')[0];

  const filteredEntries = useMemo(() => entries.filter(e => {
    if (filterStore !== 'all' && e.storeId !== filterStore) return false;
    const d = new Date(e.date);
    if (filterMonth !== 'all' && (d.getMonth() + 1).toString() !== filterMonth) return false;
    if (d.getFullYear().toString() !== filterYear) return false;
    return true;
  }), [entries, filterStore, filterMonth, filterYear]);

  const storeName = (id: string) => allStores.find(s => s.id === id)?.name || 'Loja';

  const handleAddClick = () => {
    const todayOpen = entries.find(e => e.date === today && e.status === 'open');
    if (todayOpen) {
      setPreStoreId(todayOpen.storeId);
      setPreOpeningValue(todayOpen.openingValue);
      setPrePreviousClose(todayOpen.previousClose);
      setFormInitStep('close');
      setShowForm(true);
      return;
    }
    setPreStoreId('');
    setPreOpeningValue(0);
    setPrePreviousClose(0);
    setFormInitStep('open');
    setShowForm(true);
  };

  const handleFormSubmit = (entry: Omit<CashEntry, 'id'>) => {
    const newEntry: CashEntry = { ...entry, id: Date.now().toString() };
    // Remove any open entry for same store today
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.date === today && e.storeId === entry.storeId && e.status === 'open'));
      return [...filtered, newEntry];
    });
    setShowForm(false);
    toast({ title: entry.noMovement ? 'Registro sem movimentos criado!' : 'Caixa fechado com sucesso!' });
  };

  const tabs = [
    { id: 'caixa', label: 'Caixa', icon: DollarSign },
    { id: 'deposito', label: 'Depósito', icon: Banknote },
    { id: 'resumo', label: 'Resumo', icon: BarChart3 },
    { id: 'definicoes', label: 'Definições', icon: Settings },
  ];

  // ═══ CAIXA TAB ═══
  const renderCaixaTab = () => (
    <div className="space-y-4">
      <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500">Loja</Label>
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Lojas</SelectItem>
                  {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500">Mês</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-500">Ano</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddClick} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 ml-auto">
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredEntries.length === 0 ? (
        <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum fechamento encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar" para abrir o caixa</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const extrasTotal = entry.extras.reduce((s, e) => s + e.value, 0);
            const cartaoTotal = entry.cartaoItems.reduce((s, i) => s + i.value, 0);
            const deliveryTotal = entry.deliveryItems.reduce((s, i) => s + i.value, 0);
            const saldo = entry.closingTotal - entry.depositValue;
            const especieVal = entry.apuracaoEspecieTotal - entry.closingEspecie;
            const cartaoVal = cartaoTotal - entry.closingCartao;
            const deliveryVal = deliveryTotal - entry.closingDelivery;
            const totalVal = (entry.apuracaoEspecieTotal + cartaoTotal + deliveryTotal) - entry.closingTotal;
            const hasDeposit = entry.depositStatus === 'deposited';
            const fmtDate = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

            return (
              <Card key={entry.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow">
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                  <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm border flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" /><span className="font-bold text-sm">{fmtDate}</span>
                  </div>
                  <Badge variant="outline" className={`pointer-events-none ${entry.closingTotal >= 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {fmt(entry.closingTotal)} Vendas
                  </Badge>
                  <Badge variant="outline" className="pointer-events-none bg-orange-100 text-orange-700 border-orange-200">
                    {fmt(extrasTotal)} Saídas
                  </Badge>
                  <Badge variant="outline" className={`pointer-events-none ${hasDeposit ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {hasDeposit ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {hasDeposit ? 'Depositado' : 'A Depositar'}
                  </Badge>
                  {entry.noMovement && <Badge variant="outline" className="pointer-events-none bg-gray-100 text-gray-600">Sem Movimentos</Badge>}
                  <div className="ml-auto text-sm text-gray-500">{storeName(entry.storeId)}</div>
                </div>

                {!entry.noMovement && (
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b bg-gray-50/50">
                            <th className="text-left p-2 font-semibold text-gray-600"></th>
                            <th className="text-center p-2 font-semibold text-gray-600">Espécie</th>
                            <th className="text-center p-2 font-semibold text-gray-600">Cartão</th>
                            <th className="text-center p-2 font-semibold text-gray-600">Delivery</th>
                            <th className="text-center p-2 font-semibold text-gray-600">Total</th>
                          </tr></thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2 font-medium text-gray-700">Apuração</td>
                              <td className="p-2 text-center">{fmt(entry.closingEspecie)}</td>
                              <td className="p-2 text-center">{fmt(entry.closingCartao)}</td>
                              <td className="p-2 text-center">{fmt(entry.closingDelivery)}</td>
                              <td className="p-2 text-center font-semibold">{fmt(entry.closingTotal)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium text-gray-700">Validação</td>
                              {[especieVal, cartaoVal, deliveryVal, totalVal].map((v, i) => (
                                <td key={i} className="p-2 text-center">
                                  {v === 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className={`font-semibold ${v < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(v)}</span>}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-800 text-center mb-3">Caixa</h4>
                        <div className="flex justify-between"><span className="text-gray-600 text-sm">Abertura</span><span className="font-semibold">{fmt(entry.openingValue)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 text-sm">Fechamento</span><span className="font-semibold">{fmt(entry.closingTotal)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 text-sm">(-) Depósito</span><span className="font-semibold">{fmt(entry.depositValue)}</span></div>
                        <hr />
                        <div className="flex justify-between"><span className="font-semibold text-gray-800">Saldo</span><span className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(saldo)}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t text-sm text-gray-500">
                      <span>Criado por <b>{entry.openedBy}</b></span>
                      <span>• Fechado por <b>{entry.closedBy || '—'}</b></span>
                      <div className="ml-auto flex items-center gap-4">
                        <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {entry.attachments.length}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {entry.comments.length}</span>
                        <Button size="sm" variant="outline" onClick={() => setViewingEntry(entry)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ═══ DEPOSITO TAB ═══
  const renderDepositoTab = () => {
    const pendingByStore = allStores.map(store => {
      const pending = entries.filter(e => e.storeId === store.id && e.status === 'closed' && e.depositStatus === 'pending');
      const dias = pending.length;
      const acumulado = pending.reduce((s, e) => s + e.depositValue, 0);
      const media = dias > 0 ? acumulado / dias : 0;
      return { store, dias, media, acumulado, pendingEntries: pending };
    });
    const totalAcumulado = pendingByStore.reduce((s, p) => s + p.acumulado, 0);
    const totalMedia = pendingByStore.reduce((s, p) => s + p.media, 0) / (pendingByStore.filter(p => p.dias > 0).length || 1);

    const storeDeposits = deposits.filter(d => d.storeId === depositStoreId);
    const storeDetail = entries.filter(e => e.storeId === depositStoreId && e.status === 'closed' && e.depositStatus === 'pending');
    const storeAcumulado = storeDetail.reduce((s, e) => s + e.depositValue, 0);

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Gestão de depósitos pendentes das lojas do grupo</p>
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50/80">
                <th className="text-left p-4 font-semibold text-gray-500 uppercase text-xs">Loja</th>
                <th className="text-center p-4 font-semibold text-gray-500 uppercase text-xs">Dias</th>
                <th className="text-center p-4 font-semibold text-gray-500 uppercase text-xs">Média Diária</th>
                <th className="text-center p-4 font-semibold text-gray-500 uppercase text-xs">Valor Acumulado</th>
                <th className="text-center p-4 w-10"></th>
              </tr></thead>
              <tbody>
                {pendingByStore.map(({ store, dias, media, acumulado }) => (
                  <React.Fragment key={store.id}>
                    <tr className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium">{store.name}</td>
                      <td className="p-4 text-center text-gray-600">{dias}</td>
                      <td className="p-4 text-center text-gray-600">{fmt(media)}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="pointer-events-none bg-green-100 text-green-700 border-green-200 font-semibold">{fmt(acumulado)}</Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpandedStore(expandedStore === store.id ? null : store.id)}>
                          {expandedStore === store.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                    {expandedStore === store.id && (
                      <tr><td colSpan={5} className="p-0">
                        <div className="bg-gray-50 p-4 flex items-center justify-center gap-3 border-b">
                          {acumulado > 0 && (
                            <Button size="sm" variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50" onClick={() => {
                              setDepositStoreId(store.id); setDepositFormValue(acumulado); setDepositFormDate(today); setDepositFormComment(''); setShowDepositDialog(true);
                            }}>
                              <Banknote className="h-3.5 w-3.5" /> DEPOSITAR
                            </Button>
                          )}
                          {acumulado > 0 && (
                            <Button size="sm" variant="outline" className="gap-2" onClick={() => { setDepositStoreId(store.id); setShowDetailDialog(true); }}>
                              <FileText className="h-3.5 w-3.5" /> DETALHAR
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => { setDepositStoreId(store.id); setShowHistoryDialog(true); }}>
                            <History className="h-3.5 w-3.5" /> HISTÓRICO
                          </Button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="p-4">TOTAL</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">{fmt(totalMedia)}</td>
                  <td className="p-4 text-center"><Badge variant="outline" className="pointer-events-none bg-green-100 text-green-700 border-green-200 font-bold">{fmt(totalAcumulado)}</Badge></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Deposit Dialog */}
        <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">CONCLUSÃO DE DEPÓSITO</DialogTitle>
              <DialogDescription>Esta ação criará um registro histórico de depósito com o saldo acumulado abaixo e reiniciará a contagem a partir do próximo fechamento de caixa.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2"><span className="text-sm font-medium">LOJA:</span><Badge variant="outline">{storeName(depositStoreId)}</Badge></div>
              <div className="flex items-center gap-2"><span className="text-sm font-medium">VALOR ACUMULADO:</span><Badge variant="outline" className="pointer-events-none bg-green-100 text-green-700 border-green-200">{fmt(storeAcumulado)}</Badge></div>
              <div><Label>Valor do Depósito</Label><Input type="number" step="0.01" value={depositFormValue || ''} onChange={e => setDepositFormValue(parseFloat(e.target.value) || 0)} className="mt-1" /></div>
              <div><Label>Data do Depósito</Label><Input type="date" value={depositFormDate} onChange={e => setDepositFormDate(e.target.value)} className="mt-1" /></div>
              <div><Label>Comentário</Label><Input value={depositFormComment} onChange={e => setDepositFormComment(e.target.value)} placeholder="(Opcional) Adicione qualquer comentário" className="mt-1" /></div>
              <Button variant="outline" className="w-full text-sm"><Plus className="h-3.5 w-3.5 mr-2" /> Adicionar Comprovante</Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDepositDialog(false)}>Cancelar</Button>
              <Button onClick={() => {
                const newDeposit: DepositRecord = {
                  id: Date.now().toString(), storeId: depositStoreId, date: depositFormDate,
                  value: depositFormValue, comment: depositFormComment,
                  hasAttachment: false, hasComment: !!depositFormComment,
                  relatedEntryIds: storeDetail.map(e => e.id),
                };
                setDeposits(prev => [...prev, newDeposit]);
                setEntries(prev => prev.map(e => storeDetail.some(d => d.id === e.id) ? { ...e, depositStatus: 'deposited' as const } : e));
                setShowDepositDialog(false);
                setExpandedStore(null);
                toast({ title: 'Depósito concluído!' });
              }} className="bg-gradient-to-r from-green-600 to-emerald-600">Concluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>DETALHAMENTO DO VALOR PARA DEPÓSITO</DialogTitle>
              <DialogDescription>Abaixo estão os dias que compõe o valor acumulado para depósito</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-3"><span className="text-sm font-medium">LOJA:</span><Badge variant="outline">{storeName(depositStoreId)}</Badge></div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left p-3 font-semibold">DATA</th><th className="text-left p-3 font-semibold">VALOR</th><th className="w-10"></th></tr></thead>
                <tbody>
                  {storeDetail.map(e => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="p-3">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-PT')}</td>
                      <td className="p-3">{fmt(e.depositValue)}</td>
                      <td className="p-3"><Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setShowDetailDialog(false); setViewingEntry(e); }}><Plus className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-3">Total</td>
                    <td className="p-3"><Badge variant="outline" className="pointer-events-none bg-green-100 text-green-700 border-green-200">{fmt(storeAcumulado)}</Badge></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowDetailDialog(false)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader><DialogTitle>Histórico de depósitos</DialogTitle></DialogHeader>
            <div className="flex items-center gap-2 mb-3"><span className="text-sm font-medium">LOJA:</span><Badge variant="outline">{storeName(depositStoreId)}</Badge></div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left p-3 font-semibold">DATA</th><th className="text-left p-3 font-semibold">VALOR</th><th className="w-20"></th></tr></thead>
                <tbody>
                  {storeDeposits.length === 0 ? (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-500">Nenhum depósito realizado</td></tr>
                  ) : storeDeposits.map(d => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="p-3">{new Date(d.date + 'T12:00:00').toLocaleDateString('pt-PT')}</td>
                      <td className="p-3">{fmt(d.value)}</td>
                      <td className="p-3 flex items-center gap-1">
                        {d.hasComment && <MessageSquare className="h-3 w-3 text-gray-400" />}
                        {d.hasAttachment && <Paperclip className="h-3 w-3 text-gray-400" />}
                        <Plus className="h-3 w-3 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ═══ RESUMO TAB ═══
  const renderResumoTab = () => {
    const resumoEntries = entries.filter(e => {
      if (e.status !== 'closed') return false;
      if (filterStore !== 'all' && e.storeId !== filterStore) return false;
      const d = new Date(e.date);
      if (filterMonth !== 'all' && (d.getMonth() + 1).toString() !== filterMonth) return false;
      if (d.getFullYear().toString() !== filterYear) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));

    const totalEspecie = resumoEntries.reduce((s, e) => s + e.closingEspecie, 0);
    const totalCartao = resumoEntries.reduce((s, e) => s + e.closingCartao, 0);
    const totalDelivery = resumoEntries.reduce((s, e) => s + e.closingDelivery, 0);
    const totalTotal = resumoEntries.reduce((s, e) => s + e.closingTotal, 0);

    const exportXLSX = () => {
      let csv = 'Data;Espécie;Cartão;Delivery;Total\n';
      resumoEntries.forEach(e => {
        csv += `${new Date(e.date + 'T12:00:00').toLocaleDateString('pt-PT')};${e.closingEspecie};${e.closingCartao};${e.closingDelivery};${e.closingTotal}\n`;
      });
      csv += `Total;${totalEspecie};${totalCartao};${totalDelivery};${totalTotal}\n`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `resumo_caixa_${filterMonth}_${filterYear}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Ficheiro exportado!' });
    };

    return (
      <div className="space-y-4">
        <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-500">Loja</Label>
                <Select value={filterStore} onValueChange={setFilterStore}>
                  <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-500">Mês</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-500">Ano</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'ESPÉCIE', value: totalEspecie, color: 'blue' },
            { label: 'CARTÃO', value: totalCartao, color: 'purple' },
            { label: 'DELIVERY', value: totalDelivery, color: 'orange' },
            { label: 'TOTAL', value: totalTotal, color: 'green' },
          ].map(b => (
            <div key={b.label} className={`px-5 py-3 rounded-xl border-2 border-${b.color}-200 bg-${b.color}-50 text-center`}>
              <p className={`text-xs font-bold text-${b.color}-700 uppercase`}>{b.label}</p>
              <p className={`text-lg font-bold text-${b.color}-700`}>{fmt(b.value)}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fechamentos</CardTitle>
            <Button size="sm" variant="outline" onClick={exportXLSX} className="gap-2"><Download className="h-3.5 w-3.5" /> Exportar</Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50/80">
                <th className="text-left p-3 font-semibold text-gray-600">Data</th>
                <th className="text-right p-3 font-semibold text-gray-600">Espécie</th>
                <th className="text-right p-3 font-semibold text-gray-600">Cartão</th>
                <th className="text-right p-3 font-semibold text-gray-600">Delivery</th>
                <th className="text-right p-3 font-semibold text-gray-600">Total</th>
              </tr></thead>
              <tbody>
                {resumoEntries.map(e => (
                  <tr key={e.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                    <td className="p-3 text-right">{fmt(e.closingEspecie)}</td>
                    <td className="p-3 text-right">{fmt(e.closingCartao)}</td>
                    <td className="p-3 text-right">{fmt(e.closingDelivery)}</td>
                    <td className="p-3 text-right font-semibold">{fmt(e.closingTotal)}</td>
                  </tr>
                ))}
                {resumoEntries.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum fechamento neste período</td></tr>}
                {resumoEntries.length > 0 && (
                  <tr className="bg-gray-50 font-bold border-t-2">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right text-blue-700">{fmt(totalEspecie)}</td>
                    <td className="p-3 text-right text-purple-700">{fmt(totalCartao)}</td>
                    <td className="p-3 text-right text-orange-700">{fmt(totalDelivery)}</td>
                    <td className="p-3 text-right text-green-700">{fmt(totalTotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══ DEFINICOES TAB ═══
  const renderDefinicoesTab = () => (
    <div className="space-y-6">
      {/* Base Value */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-sm">Valor Base de Caixa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Deseja definir um valor base para permanecer no caixa?</p>
          <div className="flex items-center gap-4">
            <Switch checked={cashSettings.baseValueEnabled} onCheckedChange={v => setCashSettings(p => ({ ...p, baseValueEnabled: v }))} />
            <span className="text-sm font-medium">{cashSettings.baseValueEnabled ? 'Ativado' : 'Desativado'}</span>
          </div>
          {cashSettings.baseValueEnabled && (
            <div className="max-w-xs">
              <Label className="text-xs">Valor Base (€)</Label>
              <Input type="number" step="0.01" value={cashSettings.baseValue || ''} onChange={e => setCashSettings(p => ({ ...p, baseValue: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entradas/Saídas por Loja */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm">Considerar Entradas/Saídas?</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Ative as opções abaixo quando o sistema registrar as entradas e saídas e as considerarem no cálculo de fechamento de caixa</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allStores.map(store => {
              const isActive = cashSettings.extrasConsideredStores.includes(store.id);
              return (
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                  <span className="font-medium text-sm">{store.name}</span>
                  <Switch checked={isActive} onCheckedChange={v => {
                    setCashSettings(p => ({
                      ...p,
                      extrasConsideredStores: v
                        ? [...p.extrasConsideredStores, store.id]
                        : p.extrasConsideredStores.filter(id => id !== store.id),
                    }));
                  }} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card Brands */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /> Bandeiras de Cartão</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cardBrands.map(b => (
              <Badge key={b} variant="outline" className="pointer-events-none gap-1 pr-1">
                {b}
                <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-1 text-red-500 pointer-events-auto" onClick={() => { setCardBrands(prev => prev.filter(x => x !== b)); toast({ title: 'Marca removida' }); }}><Trash2 className="h-2.5 w-2.5" /></Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Apps */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4 text-orange-600" /> Plataformas de Delivery</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {deliveryApps.map(a => (
              <Badge key={a} variant="outline" className="pointer-events-none gap-1 pr-1">
                {a}
                <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-1 text-red-500 pointer-events-auto" onClick={() => { setDeliveryApps(prev => prev.filter(x => x !== a)); toast({ title: 'App removida' }); }}><Trash2 className="h-2.5 w-2.5" /></Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'caixa': return renderCaixaTab();
      case 'deposito': return renderDepositoTab();
      case 'resumo': return renderResumoTab();
      case 'definicoes': return renderDefinicoesTab();
      default: return renderCaixaTab();
    }
  };

  // If form is showing, render full-page form
  if (showForm) {
    return (
      <CashForm
        step={formInitStep}
        allStores={allStores.map(s => ({ id: s.id, name: s.name }))}
        entries={entries}
        cardBrands={cardBrands}
        deliveryApps={deliveryApps}
        onAddBrand={name => setCardBrands(prev => [...prev, name])}
        onAddApp={name => setDeliveryApps(prev => [...prev, name])}
        onDeleteBrand={name => setCardBrands(prev => prev.filter(b => b !== name))}
        onDeleteApp={name => setDeliveryApps(prev => prev.filter(a => a !== name))}
        preSelectedStoreId={preStoreId}
        preOpeningValue={preOpeningValue}
        prePreviousClose={prePreviousClose}
        cashSettings={cashSettings}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Gestão de Caixa</h1>
          <p className="text-gray-600 mt-1">Controle de aberturas, fechamentos e depósitos</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-gray-100 border'
                  }`}>
                <Icon className="h-4 w-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {renderTabContent()}
      </div>

      {/* View Entry Dialog */}
      {viewingEntry && (
        <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes — {new Date(viewingEntry.date + 'T12:00:00').toLocaleDateString('pt-PT')} ({storeName(viewingEntry.storeId)})</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Abertura:</span> <b>{fmt(viewingEntry.openingValue)}</b></div>
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Fechamento:</span> <b>{fmt(viewingEntry.closingTotal)}</b></div>
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Depósito:</span> <b>{fmt(viewingEntry.depositValue)}</b></div>
                <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Saldo:</span> <b>{fmt(viewingEntry.closingTotal - viewingEntry.depositValue)}</b></div>
              </div>
              <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Aberto por:</span> <b>{viewingEntry.openedBy}</b> • <span className="text-gray-500">Fechado por:</span> <b>{viewingEntry.closedBy}</b></div>
              {viewingEntry.comments.length > 0 && (
                <div><h4 className="font-semibold mb-1">Comentários ({viewingEntry.comments.length})</h4>{viewingEntry.comments.map((c, i) => <p key={i} className="text-gray-600 p-1 border-b">{c}</p>)}</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CashManager;
