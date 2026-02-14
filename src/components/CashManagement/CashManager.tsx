import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, Plus, Eye, Edit, Paperclip, MessageSquare, Calendar,
  ArrowUpCircle, ArrowDownCircle, CheckCircle, Clock, AlertTriangle,
  CreditCard, Truck, Banknote, Save, X, TrendingUp, TrendingDown,
  Settings, FileText, BarChart3, Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useBrand } from '@/contexts/BrandContext';
import { toast } from '@/hooks/use-toast';

// Extended interfaces for CashManager local state
interface CashEntry {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  openingValue: number;
  previousClose: number;
  closingEspecie: number;
  closingCartao: number;
  closingDelivery: number;
  closingTotal: number;
  apuracaoNotas: number;
  apuracaoMoedas: number;
  apuracaoEspecieTotal: number;
  cartaoItems: { brand: string; value: number }[];
  deliveryItems: { app: string; value: number }[];
  extras: { description: string; value: number }[];
  depositValue: number;
  depositStatus: 'deposited' | 'pending';
  attachments: { name: string; date: string }[];
  comments: string[];
  openedBy: string;
  closedBy: string;
  status: 'open' | 'closed';
  noMovement: boolean;
}

const CashManager: React.FC = () => {
  const { user } = useAuth();
  const { stores } = useData();
  const { stores: brandStores, selectedBrand } = useBrand();

  const [activeTab, setActiveTab] = useState('caixa');

  // Filters
  const [filterStore, setFilterStore] = useState('all');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<'open' | 'close'>('open');
  const [viewingEntry, setViewingEntry] = useState<CashEntry | null>(null);
  const [showNoMovDialog, setShowNoMovDialog] = useState(false);

  // Opening form
  const [formStoreId, setFormStoreId] = useState('');
  const [formPreviousClose, setFormPreviousClose] = useState(0);
  const [formOpeningValue, setFormOpeningValue] = useState(0);

  // Closing form
  const [closingEspecie, setClosingEspecie] = useState(0);
  const [closingCartao, setClosingCartao] = useState(0);
  const [closingDelivery, setClosingDelivery] = useState(0);
  const [apuracaoNotas, setApuracaoNotas] = useState(0);
  const [apuracaoMoedas, setApuracaoMoedas] = useState(0);
  const [cartaoItems, setCartaoItems] = useState<{ brand: string; value: number }[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<{ app: string; value: number }[]>([]);
  const [extras, setExtras] = useState<{ description: string; value: number }[]>([]);
  const [depositValue, setDepositValue] = useState(0);
  const [attachments, setAttachments] = useState<{ name: string; date: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  // Demo cash entries
  const [entries, setEntries] = useState<CashEntry[]>([
    {
      id: '1', storeId: '1', date: '2025-02-24', openingValue: 150, previousClose: 0,
      closingEspecie: 300, closingCartao: 200, closingDelivery: 200, closingTotal: 700,
      apuracaoNotas: 250, apuracaoMoedas: 50, apuracaoEspecieTotal: 300,
      cartaoItems: [{ brand: 'VISA', value: 100 }, { brand: 'MASTERCARD', value: 100 }],
      deliveryItems: [{ app: 'UBEREATS', value: 120 }, { brand: 'GLOVO', value: 80 } as any],
      extras: [{ description: 'Gorjeta', value: 5 }],
      depositValue: 150, depositStatus: 'deposited',
      attachments: [], comments: Array(6).fill('Comentário'),
      openedBy: 'William Cardoso', closedBy: 'William Cardoso',
      status: 'closed', noMovement: false,
    },
    {
      id: '2', storeId: '1', date: '2025-02-23', openingValue: 150, previousClose: 0,
      closingEspecie: 0, closingCartao: 0, closingDelivery: 0, closingTotal: -150,
      apuracaoNotas: 0, apuracaoMoedas: 0, apuracaoEspecieTotal: 0,
      cartaoItems: [], deliveryItems: [], extras: [],
      depositValue: 0, depositStatus: 'pending',
      attachments: [], comments: ['Dia fraco', 'Revisar'],
      openedBy: 'William Cardoso', closedBy: 'William Cardoso',
      status: 'closed', noMovement: false,
    },
  ]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today && e.storeId === (filterStore !== 'all' ? filterStore : ''));

  const filteredEntries = entries.filter(e => {
    if (filterStore !== 'all' && e.storeId !== filterStore) return false;
    const d = new Date(e.date);
    if (filterMonth !== 'all' && (d.getMonth() + 1).toString() !== filterMonth) return false;
    if (d.getFullYear().toString() !== filterYear) return false;
    return true;
  });

  const allStores = brandStores.length > 0 ? brandStores : stores.map(s => ({ ...s, brandId: selectedBrand?.id || '' }));

  const handleAddClick = () => {
    // Check if today already has an open entry for any selected store
    const todayOpen = entries.find(e => e.date === today && e.status === 'open');
    if (todayOpen) {
      // Go straight to closing
      setFormStoreId(todayOpen.storeId);
      setFormPreviousClose(todayOpen.previousClose);
      setFormOpeningValue(todayOpen.openingValue);
      setFormStep('close');
      resetClosingFields();
      setShowForm(true);
      return;
    }
    // Open form for new entry
    setFormStoreId('');
    setFormPreviousClose(0);
    setFormOpeningValue(0);
    setFormStep('open');
    resetClosingFields();
    setShowForm(true);
  };

  const resetClosingFields = () => {
    setClosingEspecie(0); setClosingCartao(0); setClosingDelivery(0);
    setApuracaoNotas(0); setApuracaoMoedas(0);
    setCartaoItems([]); setDeliveryItems([]); setExtras([]);
    setDepositValue(0); setAttachments([]); setComments([]); setCommentText('');
  };

  const handleOpenSubmit = () => {
    if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; }
    const existsToday = entries.find(e => e.date === today && e.storeId === formStoreId);
    if (existsToday) { toast({ title: 'Já existe um caixa aberto para esta loja hoje', variant: 'destructive' }); return; }

    const newEntry: CashEntry = {
      id: Date.now().toString(), storeId: formStoreId, date: today,
      openingValue: formOpeningValue, previousClose: formPreviousClose,
      closingEspecie: 0, closingCartao: 0, closingDelivery: 0, closingTotal: 0,
      apuracaoNotas: 0, apuracaoMoedas: 0, apuracaoEspecieTotal: 0,
      cartaoItems: [], deliveryItems: [], extras: [],
      depositValue: 0, depositStatus: 'pending',
      attachments: [], comments: [],
      openedBy: user?.name || 'Usuário', closedBy: '',
      status: 'open', noMovement: false,
    };
    setEntries(prev => [...prev, newEntry]);
    // Go to closing step
    setFormStep('close');
    toast({ title: 'Caixa aberto com sucesso!' });
  };

  const handleNoMovement = () => {
    if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; }
    const newEntry: CashEntry = {
      id: Date.now().toString(), storeId: formStoreId, date: today,
      openingValue: 0, previousClose: 0,
      closingEspecie: 0, closingCartao: 0, closingDelivery: 0, closingTotal: 0,
      apuracaoNotas: 0, apuracaoMoedas: 0, apuracaoEspecieTotal: 0,
      cartaoItems: [], deliveryItems: [], extras: [],
      depositValue: 0, depositStatus: 'deposited',
      attachments: [], comments: ['Sem movimentos'],
      openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
      status: 'closed', noMovement: true,
    };
    setEntries(prev => [...prev, newEntry]);
    setShowForm(false); setShowNoMovDialog(false);
    toast({ title: 'Registro sem movimentos criado!' });
  };

  const handleCloseSubmit = () => {
    const closingTotal = closingEspecie + closingCartao + closingDelivery;
    const apuracaoEspecieTotal = apuracaoNotas + apuracaoMoedas;
    const cartaoTotal = cartaoItems.reduce((s, i) => s + i.value, 0);
    const deliveryTotal = deliveryItems.reduce((s, i) => s + i.value, 0);
    const extrasTotal = extras.reduce((s, i) => s + i.value, 0);
    const valorTotal = apuracaoEspecieTotal + cartaoTotal + deliveryTotal + extrasTotal;
    const diferenca = valorTotal - closingTotal;

    const entry: CashEntry = {
      id: entries.find(e => e.date === today && e.storeId === formStoreId)?.id || Date.now().toString(),
      storeId: formStoreId, date: today,
      openingValue: formOpeningValue, previousClose: formPreviousClose,
      closingEspecie, closingCartao, closingDelivery, closingTotal,
      apuracaoNotas, apuracaoMoedas, apuracaoEspecieTotal,
      cartaoItems, deliveryItems, extras,
      depositValue, depositStatus: 'pending',
      attachments, comments,
      openedBy: user?.name || 'Usuário', closedBy: user?.name || 'Usuário',
      status: 'closed', noMovement: false,
    };

    setEntries(prev => {
      const existing = prev.findIndex(e => e.id === entry.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });

    setShowForm(false);
    toast({ title: 'Caixa fechado com sucesso!' });
  };

  const storeName = (storeId: string) => {
    const s = allStores.find(st => st.id === storeId);
    return s?.name || 'Loja';
  };

  const tabs = [
    { id: 'caixa', label: 'Caixa', icon: DollarSign },
    { id: 'deposito', label: 'Depósito', icon: Banknote },
    { id: 'resumo', label: 'Resumo', icon: BarChart3 },
    { id: 'definicoes', label: 'Definições', icon: Settings },
  ];

  // ─── CAIXA TAB ───
  const renderCaixaTab = () => (
    <div className="space-y-4">
      {/* Filters */}
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
                <SelectContent>
                  {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddClick} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum fechamento encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Adicionar" para abrir o caixa de hoje</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const diff = entry.closingTotal;
            const extrasTotal = entry.extras.reduce((s, e) => s + e.value, 0);
            const cartaoTotal = entry.cartaoItems.reduce((s, i) => s + i.value, 0);
            const deliveryTotal = entry.deliveryItems.reduce((s, i) => s + i.value, 0);
            const saldo = entry.closingTotal - entry.depositValue;
            const especieValidation = entry.apuracaoEspecieTotal - entry.closingEspecie;
            const cartaoValidation = cartaoTotal - entry.closingCartao;
            const deliveryValidation = deliveryTotal - entry.closingDelivery;
            const totalValidation = (entry.apuracaoEspecieTotal + cartaoTotal + deliveryTotal) - entry.closingTotal;
            const hasDeposit = entry.depositStatus === 'deposited';
            const isViewOnly = hasDeposit;
            const fmtDate = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

            return (
              <Card key={entry.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow">
                {/* Header Row */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                  <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm border flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-bold text-sm">{fmtDate}</span>
                  </div>
                  <Badge className={diff >= 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                    {fmt(entry.closingTotal)} Vendas
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {fmt(extrasTotal)} Saídas
                  </Badge>
                  <Badge className={hasDeposit ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
                    {hasDeposit ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {hasDeposit ? 'Depositado' : 'A Depositar'}
                  </Badge>
                  {entry.noMovement && <Badge className="bg-gray-100 text-gray-600">Sem Movimentos</Badge>}
                  <div className="ml-auto text-sm text-gray-500">{storeName(entry.storeId)}</div>
                </div>

                {!entry.noMovement && (
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Apuração Table */}
                      <div className="lg:col-span-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50/50">
                                <th className="text-left p-2 font-semibold text-gray-600"></th>
                                <th className="text-center p-2 font-semibold text-gray-600">Espécie</th>
                                <th className="text-center p-2 font-semibold text-gray-600">Cartão</th>
                                <th className="text-center p-2 font-semibold text-gray-600">Delivery</th>
                                <th className="text-center p-2 font-semibold text-gray-600">Total</th>
                              </tr>
                            </thead>
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
                                <td className="p-2 text-center">
                                  {especieValidation === 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className={especieValidation < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(especieValidation)}</span>}
                                </td>
                                <td className="p-2 text-center">
                                  {cartaoValidation === 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className={cartaoValidation < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(cartaoValidation)}</span>}
                                </td>
                                <td className="p-2 text-center">
                                  {deliveryValidation === 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className={deliveryValidation < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(deliveryValidation)}</span>}
                                </td>
                                <td className="p-2 text-center">
                                  {totalValidation === 0 ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className={totalValidation < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(totalValidation)}</span>}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Caixa Summary */}
                      <div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
                          <h4 className="font-bold text-gray-800 text-center mb-3">Caixa</h4>
                          <div className="flex justify-between"><span className="text-gray-600 text-sm">Abertura</span><span className="font-semibold">{fmt(entry.openingValue)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600 text-sm">Fechamento</span><span className="font-semibold">{fmt(entry.closingTotal)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600 text-sm">(-) Depósito</span><span className="font-semibold">{fmt(entry.depositValue)}</span></div>
                          <hr />
                          <div className="flex justify-between"><span className="font-semibold text-gray-800">Saldo</span><span className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(saldo)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t text-sm text-gray-500">
                      <span>Criado por <b>{entry.openedBy}</b></span>
                      <span>• Fechado por <b>{entry.closedBy || '—'}</b></span>
                      <div className="ml-auto flex items-center gap-4">
                        <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {entry.attachments.length}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {entry.comments.length}</span>
                        <Button size="sm" variant="outline" onClick={() => setViewingEntry(entry)} className={isViewOnly ? '' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}>
                          {isViewOnly ? <><Eye className="h-3.5 w-3.5 mr-1" /> Ver</> : <><Edit className="h-3.5 w-3.5 mr-1" /> Editar</>}
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

  // ─── DEPOSITO TAB ───
  const renderDepositoTab = () => {
    const pendingEntries = entries.filter(e => e.status === 'closed' && e.depositStatus === 'pending');
    const depositedEntries = entries.filter(e => e.status === 'closed' && e.depositStatus === 'deposited');

    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pendentes de Depósito
              <Badge className="bg-yellow-100 text-yellow-700">{pendingEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {pendingEntries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum depósito pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingEntries.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div>
                      <p className="font-semibold">{storeName(e.storeId)} — {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                      <p className="text-sm text-gray-500">Valor para depósito: <b className="text-gray-800">{fmt(e.depositValue)}</b></p>
                    </div>
                    <Button size="sm" onClick={() => {
                      setEntries(prev => prev.map(x => x.id === e.id ? { ...x, depositStatus: 'deposited' as const } : x));
                      toast({ title: 'Depósito confirmado!' });
                    }} className="bg-gradient-to-r from-green-600 to-emerald-600">
                      <CheckCircle className="h-4 w-4 mr-2" /> Confirmar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Depósitos Realizados
              <Badge className="bg-green-100 text-green-700">{depositedEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {depositedEntries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum depósito realizado</p>
            ) : (
              <div className="space-y-2">
                {depositedEntries.slice(0, 10).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="font-medium text-sm">{storeName(e.storeId)} — {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-PT')}</span>
                    <span className="font-semibold text-green-700">{fmt(e.depositValue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── RESUMO TAB ───
  const renderResumoTab = () => {
    const closedEntries = entries.filter(e => e.status === 'closed');
    const totalVendas = closedEntries.reduce((s, e) => s + e.closingTotal, 0);
    const totalDepositos = closedEntries.filter(e => e.depositStatus === 'deposited').reduce((s, e) => s + e.depositValue, 0);
    const totalExtras = closedEntries.reduce((s, e) => s + e.extras.reduce((a, x) => a + x.value, 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Vendas', value: totalVendas, icon: TrendingUp, color: 'blue' },
            { label: 'Total Depósitos', value: totalDepositos, icon: Banknote, color: 'green' },
            { label: 'Total Saídas', value: totalExtras, icon: TrendingDown, color: 'orange' },
            { label: 'Fechamentos', value: closedEntries.length, icon: FileText, color: 'purple', isCurrency: false },
          ].map((stat, i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{(stat as any).isCurrency === false ? stat.value : fmt(stat.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader><CardTitle>Histórico por Loja</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allStores.map(store => {
                const storeEntries = closedEntries.filter(e => e.storeId === store.id);
                const storeTotal = storeEntries.reduce((s, e) => s + e.closingTotal, 0);
                return (
                  <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{store.name}</span>
                    <div className="text-right">
                      <span className="font-bold">{fmt(storeTotal)}</span>
                      <span className="text-gray-400 text-sm ml-2">({storeEntries.length} fechamentos)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── DEFINICOES TAB ───
  const renderDefinicoesTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" /> Bandeiras de Cartão</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 p-6">
          <p>Configure as bandeiras aceitas: VISA, MASTERCARD, MULTIBANCO, MB WAY, entre outras.</p>
          <p className="text-gray-400 mt-2">Funcionalidade em desenvolvimento.</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-orange-600" /> Plataformas de Delivery</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 p-6">
          <p>Configure as plataformas de delivery: UBEREATS, GLOVO, BOLT FOOD, entre outras.</p>
          <p className="text-gray-400 mt-2">Funcionalidade em desenvolvimento.</p>
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

  const closingTotal = closingEspecie + closingCartao + closingDelivery;
  const apuracaoEspecieTot = apuracaoNotas + apuracaoMoedas;
  const cartaoTot = cartaoItems.reduce((s, i) => s + i.value, 0);
  const deliveryTot = deliveryItems.reduce((s, i) => s + i.value, 0);
  const extrasTot = extras.reduce((s, i) => s + i.value, 0);
  const valorTotal = apuracaoEspecieTot + cartaoTot + deliveryTot + extrasTot;
  const diferenca = valorTotal - closingTotal;
  const openingDiff = formOpeningValue - formPreviousClose;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Gestão de Caixa</h1>
          <p className="text-gray-600 mt-1">Controle de aberturas, fechamentos e depósitos</p>
        </div>

        {/* Tabs */}
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

      {/* ─── OPEN / CLOSE FORM DIALOG ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {formStep === 'open' ? 'Abertura de Caixa' : 'Fechamento de Caixa'}
            </DialogTitle>
          </DialogHeader>

          {formStep === 'open' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date().toLocaleDateString('pt-PT')}
                </div>
                <div className="space-y-1">
                  <Select value={formStoreId} onValueChange={setFormStoreId}>
                    <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Selecionar Loja" /></SelectTrigger>
                    <SelectContent>
                      {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Apuração Inicial</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Fechamento Anterior</Label>
                      <Input type="number" step="0.01" value={formPreviousClose} onChange={e => setFormPreviousClose(parseFloat(e.target.value) || 0)} className="mt-1 bg-gray-100" />
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
                <Button variant="outline" onClick={() => {
                  if (!formStoreId) { toast({ title: 'Selecione uma loja', variant: 'destructive' }); return; }
                  setShowNoMovDialog(true);
                }}>Sem Movimentos</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleOpenSubmit} className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <ArrowUpCircle className="h-4 w-4 mr-2" /> Abrir Caixa
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date().toLocaleDateString('pt-PT')}</span>
                <Badge className="bg-blue-100 text-blue-700">{storeName(formStoreId)}</Badge>
              </div>

              {/* Sistema */}
              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Sistema</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label className="text-xs">Fechamento Anterior</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm">{fmt(formPreviousClose)}</div></div>
                    <div><Label className="text-xs">Valor de Abertura</Label><div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm">{fmt(formOpeningValue)}</div></div>
                    <div><Label className="text-xs">Diferença</Label><div className={`mt-1 h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${openingDiff === 0 ? 'bg-gray-100' : openingDiff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{fmt(openingDiff)}</div></div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Fechamento de Caixa</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      <div><Label className="text-[10px] text-gray-400">Espécie</Label><Input type="number" step="0.01" value={closingEspecie} onChange={e => setClosingEspecie(parseFloat(e.target.value) || 0)} /></div>
                      <div><Label className="text-[10px] text-gray-400">Cartão</Label><Input type="number" step="0.01" value={closingCartao} onChange={e => setClosingCartao(parseFloat(e.target.value) || 0)} /></div>
                      <div><Label className="text-[10px] text-gray-400">Delivery</Label><Input type="number" step="0.01" value={closingDelivery} onChange={e => setClosingDelivery(parseFloat(e.target.value) || 0)} /></div>
                      <div><Label className="text-[10px] text-gray-400">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-blue-50 text-sm font-bold text-blue-700">{fmt(closingTotal)}</div></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Apuração */}
              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Apuração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Espécie */}
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Banknote className="h-3 w-3" /> Espécie</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div><Label className="text-[10px] text-gray-400">Notas</Label><Input type="number" step="0.01" value={apuracaoNotas} onChange={e => setApuracaoNotas(parseFloat(e.target.value) || 0)} /></div>
                      <div><Label className="text-[10px] text-gray-400">Moedas</Label><Input type="number" step="0.01" value={apuracaoMoedas} onChange={e => setApuracaoMoedas(parseFloat(e.target.value) || 0)} /></div>
                      <div><Label className="text-[10px] text-gray-400">Total</Label><div className="h-10 flex items-center px-3 rounded-md border bg-gray-100 text-sm font-semibold">{fmt(apuracaoEspecieTot)}</div></div>
                    </div>
                  </div>

                  {/* Cartão */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> Cartão</Label>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setCartaoItems(prev => [...prev, { brand: '', value: 0 }])}>+ Adicionar</Button>
                    </div>
                    {cartaoItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 mt-2 items-end">
                        <Input placeholder="Marca" value={item.brand} onChange={e => { const n = [...cartaoItems]; n[idx] = { ...n[idx], brand: e.target.value }; setCartaoItems(n); }} />
                        <Input type="number" step="0.01" placeholder="Valor" value={item.value} onChange={e => { const n = [...cartaoItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setCartaoItems(n); }} />
                        <Button size="sm" variant="outline" className="text-red-600 h-10" onClick={() => setCartaoItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    {cartaoItems.length > 0 && <p className="text-xs text-right mt-1 font-semibold">Total: {fmt(cartaoTot)}</p>}
                  </div>

                  {/* Delivery */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</Label>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setDeliveryItems(prev => [...prev, { app: '', value: 0 }])}>+ Adicionar</Button>
                    </div>
                    {deliveryItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 mt-2 items-end">
                        <Input placeholder="App" value={item.app} onChange={e => { const n = [...deliveryItems]; n[idx] = { ...n[idx], app: e.target.value }; setDeliveryItems(n); }} />
                        <Input type="number" step="0.01" placeholder="Valor" value={item.value} onChange={e => { const n = [...deliveryItems]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setDeliveryItems(n); }} />
                        <Button size="sm" variant="outline" className="text-red-600 h-10" onClick={() => setDeliveryItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    {deliveryItems.length > 0 && <p className="text-xs text-right mt-1 font-semibold">Total: {fmt(deliveryTot)}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Extras */}
              <Card className="bg-gray-50 border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Entradas/Saídas Extras</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setExtras(prev => [...prev, { description: '', value: 0 }])}>+ Adicionar</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extras.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 mt-2 items-end">
                      <Input placeholder="Descrição" value={item.description} onChange={e => { const n = [...extras]; n[idx] = { ...n[idx], description: e.target.value }; setExtras(n); }} />
                      <Input type="number" step="0.01" placeholder="Valor" value={item.value} onChange={e => { const n = [...extras]; n[idx] = { ...n[idx], value: parseFloat(e.target.value) || 0 }; setExtras(n); }} />
                      <Button size="sm" variant="outline" className="text-red-600 h-10" onClick={() => setExtras(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {extras.length > 0 && <p className="text-xs text-right mt-1 font-semibold">Total: {fmt(extrasTot)}</p>}
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className={`border-2 ${diferenca === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <Label className="text-[10px] text-gray-500">Valor Total</Label>
                      <div className="text-lg font-bold text-gray-900">{fmt(valorTotal)}</div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Diferença (Sistema vs Apuração)</Label>
                      <div className={`text-lg font-bold ${diferenca === 0 ? 'text-green-600' : diferenca < 0 ? 'text-red-600' : 'text-yellow-600'}`}>{fmt(diferenca)}</div>
                      {diferenca !== 0 && <p className="text-[10px] text-red-500">Identificada diferença de {fmt(diferenca)}</p>}
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Valor para Depósito</Label>
                      <Input type="number" step="0.01" value={depositValue} onChange={e => setDepositValue(parseFloat(e.target.value) || 0)} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card className="bg-gray-50 border">
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

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleCloseSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Save className="h-4 w-4 mr-2" /> Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* No Movement Confirmation */}
      <Dialog open={showNoMovDialog} onOpenChange={setShowNoMovDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Sem Movimentos</DialogTitle>
            <DialogDescription>Deseja criar um registro sem movimentos? Isso é indicado para dias como feriados em que não há operações.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoMovDialog(false)}>Cancelar</Button>
            <Button onClick={handleNoMovement} className="bg-gradient-to-r from-yellow-600 to-orange-600">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div>
                  <h4 className="font-semibold mb-1">Comentários ({viewingEntry.comments.length})</h4>
                  {viewingEntry.comments.map((c, i) => <p key={i} className="text-gray-600 p-1 border-b">{c}</p>)}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CashManager;
