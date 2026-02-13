import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Trash2, Search, Filter, Download, Plus, Edit, X, Package,
    ArrowLeft, Minus, AlertTriangle, Clock, FileSpreadsheet, Settings, Undo2,
    CheckCircle, Users
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { WasteVariant, WasteReason, WasteRecord, Product } from '@/contexts/DataContext';

const WasteManager: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const {
        products, categories, stores, getProductById, getCategoryById, getStoreById,
        wasteVariants, wasteReasons, wasteRecords,
        addWasteVariant, updateWasteVariant, deleteWasteVariant,
        addWasteReason, updateWasteReason, deleteWasteReason,
        addWasteRecord, deleteWasteRecord,
    } = useData();

    const [activeTab, setActiveTab] = useState('waste');

    // ─── Waste Tab State ───
    const [wasteStoreFilter, setWasteStoreFilter] = useState('');
    const [wasteCategoryFilter, setWasteCategoryFilter] = useState('');
    const [wasteSearch, setWasteSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<WasteVariant | null>(null);
    const [wasteQuantity, setWasteQuantity] = useState(1);
    const [wasteReasonId, setWasteReasonId] = useState('');
    const [wasteComment, setWasteComment] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [showTodayHistory, setShowTodayHistory] = useState(false);

    // ─── Report Tab State ───
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportStoreFilter, setReportStoreFilter] = useState('');
    const [reportCategoryFilter, setReportCategoryFilter] = useState('');

    // ─── Settings Tab State ───
    const [showVariantDialog, setShowVariantDialog] = useState(false);
    const [editingVariant, setEditingVariant] = useState<WasteVariant | null>(null);
    const [variantName, setVariantName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [assigningVariant, setAssigningVariant] = useState<WasteVariant | null>(null);
    const [assignSearch, setAssignSearch] = useState('');
    const [assignCategoryFilter, setAssignCategoryFilter] = useState('');
    const [assignSelectedProducts, setAssignSelectedProducts] = useState<string[]>([]);
    const [showReasonDialog, setShowReasonDialog] = useState(false);
    const [editingReason, setEditingReason] = useState<WasteReason | null>(null);
    const [reasonName, setReasonName] = useState('');
    const [showDeleteReasonConfirm, setShowDeleteReasonConfirm] = useState(false);
    const [deletingReasonId, setDeletingReasonId] = useState<string | null>(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // ─── Waste Tab Logic ───
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !wasteSearch || p.name.toLowerCase().includes(wasteSearch.toLowerCase()) || p.sku.toLowerCase().includes(wasteSearch.toLowerCase());
            const matchesStore = true; // products don't have storeId, filtering happens at waste record level
            const matchesCategory = !wasteCategoryFilter || p.categoryId === wasteCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, wasteSearch, wasteCategoryFilter]);

    const productsByCategory = useMemo(() => {
        const grouped: Record<string, Product[]> = {};
        filteredProducts.forEach(p => {
            const catName = getCategoryById(p.categoryId)?.name || 'Sem Categoria';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(p);
        });
        return grouped;
    }, [filteredProducts, getCategoryById]);

    const getProductVariants = (productId: string) => {
        return wasteVariants.filter(v => v.productIds.includes(productId));
    };

    const todayRecords = useMemo(() => {
        const today = new Date();
        return wasteRecords.filter(r => {
            const d = new Date(r.createdAt);
            return d.toDateString() === today.toDateString();
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [wasteRecords]);

    const productHistory = useMemo(() => {
        if (!selectedProduct) return [];
        return wasteRecords
            .filter(r => r.productId === selectedProduct.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [wasteRecords, selectedProduct]);

    const canUndoRecord = (record: WasteRecord) => {
        const hoursDiff = (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);
        return record.userId === (user?.id || 'user1') && hoursDiff <= 24;
    };

    const handleAddWaste = () => {
        if (!selectedProduct || !selectedVariant || !wasteReasonId) {
            toast({ title: 'Preencha todos os campos', variant: 'destructive' });
            return;
        }
        const selectedReasonObj = wasteReasons.find(r => r.id === wasteReasonId);
        if (selectedReasonObj?.name === 'Outros' && !wasteComment.trim()) {
            toast({ title: 'Comentário obrigatório para motivo "Outros"', variant: 'destructive' });
            return;
        }
        addWasteRecord({
            productId: selectedProduct.id,
            variantId: selectedVariant.id,
            storeId: wasteStoreFilter || '1',
            userId: user?.id || 'user1',
            userName: user?.name || 'Usuário',
            quantity: wasteQuantity,
            reasonId: wasteReasonId,
            comment: wasteComment.trim() || undefined,
            createdAt: new Date(),
        });
        toast({ title: 'Desperdício registrado!' });
        setWasteQuantity(1);
        setWasteReasonId('');
        setWasteComment('');
    };

    const handleUndoWaste = (recordId: string) => {
        deleteWasteRecord(recordId);
        toast({ title: 'Desperdício desfeito!' });
    };

    // ─── Report Tab Logic ───
    const filteredReportRecords = useMemo(() => {
        return wasteRecords.filter(r => {
            const d = new Date(r.createdAt);
            const product = getProductById(r.productId);
            const matchesStore = !reportStoreFilter || r.storeId === reportStoreFilter;
            const matchesCategory = !reportCategoryFilter || (product && product.categoryId === reportCategoryFilter);
            const matchesStartDate = !reportStartDate || d >= new Date(reportStartDate);
            const matchesEndDate = !reportEndDate || d <= new Date(reportEndDate + 'T23:59:59');
            return matchesStore && matchesCategory && matchesStartDate && matchesEndDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [wasteRecords, reportStoreFilter, reportCategoryFilter, reportStartDate, reportEndDate, getProductById]);

    // XLSX Export (simple CSV with .xlsx extension + structured data)
    const exportXLSX = () => {
        const BOM = '\uFEFF';
        const headers = ['Produto', 'SKU', 'Variante', 'Loja', 'Categoria', 'Usuário', 'Data', 'Horário', 'Quantidade', 'Motivo', 'Comentário'];
        const rows = filteredReportRecords.map(r => {
            const product = getProductById(r.productId);
            const variant = wasteVariants.find(v => v.id === r.variantId);
            const store = getStoreById(r.storeId);
            const category = product ? getCategoryById(product.categoryId) : null;
            const reason = wasteReasons.find(rs => rs.id === r.reasonId);
            const d = new Date(r.createdAt);
            return [
                product?.name || '',
                product?.sku || '',
                variant?.name || '',
                store?.name || '',
                category?.name || '',
                r.userName,
                d.toLocaleDateString('pt-BR'),
                d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                r.quantity.toString(),
                reason?.name || '',
                r.comment || '',
            ];
        });

        // Summary section
        const totalQty = filteredReportRecords.reduce((sum, r) => sum + r.quantity, 0);
        const summaryRows = [
            [],
            ['RESUMO DO RELATÓRIO'],
            ['Total de Registros', filteredReportRecords.length.toString()],
            ['Quantidade Total', totalQty.toString()],
            ['Período', `${reportStartDate || 'Início'} a ${reportEndDate || 'Fim'}`],
        ];

        const csvContent = BOM + [
            ['RELATÓRIO DE DESPERDÍCIO - OPERUS'],
            [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
            [],
            headers,
            ...rows,
            ...summaryRows,
        ].map(row =>
            (row as string[]).map(cell => `"${cell}"`).join('\t')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `desperdicio_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        toast({ title: 'Relatório exportado com sucesso!' });
    };

    // ─── Settings Tab Logic ───
    const handleSaveVariant = () => {
        if (!variantName.trim()) return;
        if (editingVariant) {
            updateWasteVariant(editingVariant.id, { name: variantName.trim() });
            toast({ title: 'Variante atualizada!' });
        } else {
            addWasteVariant({ name: variantName.trim(), productIds: [] });
            toast({ title: 'Variante criada!' });
        }
        setVariantName('');
        setEditingVariant(null);
        setShowVariantDialog(false);
    };

    const handleConfirmDeleteVariant = () => {
        if (deletingVariantId) {
            deleteWasteVariant(deletingVariantId);
            toast({ title: 'Variante excluída!', description: 'Todos os produtos foram desatribuídos.', variant: 'destructive' });
        }
        setDeletingVariantId(null);
        setShowDeleteConfirm(false);
    };

    const handleOpenAssign = (variant: WasteVariant) => {
        setAssigningVariant(variant);
        setAssignSelectedProducts([...variant.productIds]);
        setAssignSearch('');
        setAssignCategoryFilter('');
        setShowAssignDialog(true);
    };

    const handleSaveAssignment = () => {
        if (assigningVariant) {
            updateWasteVariant(assigningVariant.id, { productIds: assignSelectedProducts });
            toast({ title: 'Produtos atribuídos com sucesso!' });
        }
        setShowAssignDialog(false);
        setAssigningVariant(null);
    };

    const toggleAssignProduct = (productId: string) => {
        setAssignSelectedProducts(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const assignFilteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase()) || p.sku.toLowerCase().includes(assignSearch.toLowerCase());
            const matchesCategory = !assignCategoryFilter || p.categoryId === assignCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, assignSearch, assignCategoryFilter]);

    const assignProductsByCategory = useMemo(() => {
        const grouped: Record<string, Product[]> = {};
        assignFilteredProducts.forEach(p => {
            const catName = getCategoryById(p.categoryId)?.name || 'Sem Categoria';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(p);
        });
        return grouped;
    }, [assignFilteredProducts, getCategoryById]);

    const handleSaveReason = () => {
        if (!reasonName.trim()) return;
        if (editingReason) {
            updateWasteReason(editingReason.id, { name: reasonName.trim() });
            toast({ title: 'Motivo atualizado!' });
        } else {
            addWasteReason({ name: reasonName.trim() });
            toast({ title: 'Motivo criado!' });
        }
        setReasonName('');
        setEditingReason(null);
        setShowReasonDialog(false);
    };

    const handleConfirmDeleteReason = () => {
        if (deletingReasonId) {
            deleteWasteReason(deletingReasonId);
            toast({ title: 'Motivo excluído!', variant: 'destructive' });
        }
        setDeletingReasonId(null);
        setShowDeleteReasonConfirm(false);
    };

    const formatDateTime = (date: Date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    // ─── Render: Waste Entry Dialog ───
    const renderWasteEntry = () => {
        if (!selectedProduct) return null;
        const variants = getProductVariants(selectedProduct.id);

        if (!selectedVariant) {
            // Show variant selection
            return (
                <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
                    <Button variant="outline" onClick={() => setSelectedProduct(null)} className="mb-4 shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm max-w-lg mx-auto">
                        <CardHeader className="text-center">
                            {selectedProduct.imageUrl && (
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-24 h-24 object-cover rounded-xl mx-auto mb-3 shadow-md" />
                            )}
                            <CardTitle className="text-xl">{selectedProduct.name}</CardTitle>
                            {selectedProduct.sku && (
                                <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4 text-center">Selecione a variante</p>
                            {variants.length > 0 ? (
                                <div className="space-y-2">
                                    {variants.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left font-semibold text-gray-700"
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400">Nenhuma variante atribuída a este produto</p>
                                    <p className="text-xs text-gray-400 mt-1">Vá para Definições para atribuir variantes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Show waste entry form
        const selectedReasonObj = wasteReasons.find(r => r.id === wasteReasonId);
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
                <Button variant="outline" onClick={() => setSelectedVariant(null)} className="mb-4 shadow-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm max-w-lg mx-auto">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            {selectedProduct.imageUrl && (
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-20 h-20 object-cover rounded-xl mx-auto mb-3 shadow-md" />
                            )}
                            <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name.toUpperCase()}</h2>
                            <p className="text-gray-500 font-medium">{selectedVariant.name.toUpperCase()}</p>
                        </div>

                        {/* Quantity selector */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                                onClick={() => setWasteQuantity(Math.max(0.5, wasteQuantity - 0.5))}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <Minus className="h-6 w-6" />
                            </button>
                            <Input
                                value={wasteQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value.replace(',', '.'));
                                    if (!isNaN(val) && val >= 0) setWasteQuantity(val);
                                }}
                                className="w-24 text-center text-3xl font-bold h-16 border-2 border-gray-200 rounded-xl"
                            />
                            <button
                                onClick={() => setWasteQuantity(wasteQuantity + 0.5)}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Reason */}
                        <div className="mb-4">
                            <Label className="font-bold text-gray-700">Motivo:</Label>
                            <Select value={wasteReasonId} onValueChange={setWasteReasonId}>
                                <SelectTrigger className="mt-1 border-2 border-gray-200 rounded-xl h-12">
                                    <SelectValue placeholder="Selecione o motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wasteReasons.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Comment (required for "Outros") */}
                        {selectedReasonObj?.name === 'Outros' && (
                            <div className="mb-4">
                                <Label className="font-bold text-gray-700">Comentario:</Label>
                                <Textarea
                                    value={wasteComment}
                                    onChange={(e) => setWasteComment(e.target.value)}
                                    placeholder="Defina um outro motivo."
                                    className="mt-1 border-2 border-gray-200 rounded-xl min-h-[80px]"
                                />
                            </div>
                        )}

                        {/* Add button */}
                        <Button
                            onClick={handleAddWaste}
                            className="w-full h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-lg font-semibold shadow-lg mt-2"
                        >
                            Adicionar ao Desperdício
                        </Button>

                        {/* Product history */}
                        <div className="mt-8 border-t pt-4">
                            {productHistory.length > 0 ? (
                                <>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {productHistory.slice(0, showHistory ? undefined : 3).map(record => {
                                            const variant = wasteVariants.find(v => v.id === record.variantId);
                                            return (
                                                <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{record.userName.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatDateTime(record.createdAt)} ({record.userName})
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Adicionou {record.quantity} ({selectedProduct.name}{variant ? ` - ${variant.name}` : ''}) ao desperdício.
                                                        </p>
                                                    </div>
                                                    {canUndoRecord(record) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-orange-500 hover:text-orange-700 h-7 px-2"
                                                            onClick={() => handleUndoWaste(record.id)}
                                                        >
                                                            <Undo2 className="h-3 w-3 mr-1" />
                                                            Desfazer
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {productHistory.length > 3 && (
                                        <button
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="text-sm text-purple-600 font-semibold mt-2 hover:underline"
                                        >
                                            {showHistory ? '— Esconder histórico' : `+ Ver mais (${productHistory.length - 3})`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 text-center">Nenhum histórico de desperdício</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ─── Render: Waste Tab (Product List) ───
    const renderWasteTab = () => {
        if (selectedProduct) return renderWasteEntry();

        return (
            <div className="space-y-6">
                {/* Filters */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar produto..."
                                    value={wasteSearch}
                                    onChange={(e) => setWasteSearch(e.target.value)}
                                    className="pl-10 h-10"
                                />
                            </div>
                            <Select value={wasteStoreFilter || '__all__'} onValueChange={(v) => setWasteStoreFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[180px] h-10">
                                    <SelectValue placeholder="Todas as Lojas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas as Lojas</SelectItem>
                                    {stores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={wasteCategoryFilter || '__all__'} onValueChange={(v) => setWasteCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[180px] h-10">
                                    <SelectValue placeholder="Todas as Categorias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas as Categorias</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's history button */}
                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowTodayHistory(!showTodayHistory)} className="shadow-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        {showTodayHistory ? 'Esconder histórico de hoje' : `Histórico de hoje (${todayRecords.length})`}
                    </Button>
                </div>

                {/* Today's History Panel */}
                {showTodayHistory && todayRecords.length > 0 && (
                    <Card className="shadow-lg border-0 bg-orange-50/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                Desperdiçados Hoje
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                    {todayRecords.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {todayRecords.map(record => {
                                    const product = getProductById(record.productId);
                                    const variant = wasteVariants.find(v => v.id === record.variantId);
                                    const reason = wasteReasons.find(r => r.id === record.reasonId);
                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-2 bg-white/80 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">{record.userName.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{product?.name} {variant ? `(${variant.name})` : ''}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDateTime(record.createdAt)} — {record.userName} — {reason?.name}{record.comment ? ` - ${record.comment}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                                                    Qtd: {record.quantity}
                                                </Badge>
                                                {canUndoRecord(record) && (
                                                    <Button variant="ghost" size="sm" className="text-orange-500 h-7 px-2" onClick={() => handleUndoWaste(record.id)}>
                                                        <Undo2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Product Grid by Category */}
                {Object.entries(productsByCategory).map(([catName, prods]) => (
                    <div key={catName}>
                        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-600" />
                            {catName}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {prods.map(product => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-0 shadow-md bg-white/70 backdrop-blur-sm"
                                    onClick={() => { setSelectedProduct(product); setSelectedVariant(null); setWasteQuantity(1); setWasteReasonId(''); setWasteComment(''); setShowHistory(false); }}
                                >
                                    <CardContent className="p-3 text-center">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl mx-auto mb-2 shadow-sm" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl mx-auto mb-2 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                                <Package className="h-8 w-8 text-purple-400" />
                                            </div>
                                        )}
                                        <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
                                        {product.sku && (
                                            <p className="text-xs text-gray-400 truncate">{product.sku}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(productsByCategory).length === 0 && (
                    <div className="text-center py-16">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
                    </div>
                )}
            </div>
        );
    };

    // ─── Render: Report Tab ───
    const renderReportTab = () => (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-5 w-5 text-orange-600" />
                        Filtros do Relatório
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Data Início</Label>
                            <Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Data Fim</Label>
                            <Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Loja</Label>
                            <Select value={reportStoreFilter || '__all__'} onValueChange={(v) => setReportStoreFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas as Lojas</SelectItem>
                                    {stores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Categoria</Label>
                            <Select value={reportCategoryFilter || '__all__'} onValueChange={(v) => setReportCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas as Categorias</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table + Export */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-6 w-6 text-orange-600" />
                            <span>Relatório de Desperdício</span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {filteredReportRecords.length} registros
                            </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="shadow-sm bg-green-600 text-white hover:bg-green-700 border-0" onClick={exportXLSX}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar XLSX
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="font-semibold">Produto</TableHead>
                                    <TableHead className="font-semibold">SKU</TableHead>
                                    <TableHead className="font-semibold">Variante</TableHead>
                                    <TableHead className="font-semibold">Usuário</TableHead>
                                    <TableHead className="font-semibold">Data / Horário</TableHead>
                                    <TableHead className="font-semibold text-center">Quantidade</TableHead>
                                    <TableHead className="font-semibold">Motivo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReportRecords.map(record => {
                                    const product = getProductById(record.productId);
                                    const variant = wasteVariants.find(v => v.id === record.variantId);
                                    const reason = wasteReasons.find(r => r.id === record.reasonId);
                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{product?.name || '-'}</TableCell>
                                            <TableCell className="text-gray-500">{product?.sku || '-'}</TableCell>
                                            <TableCell>{variant?.name || '-'}</TableCell>
                                            <TableCell className="text-gray-700">{record.userName}</TableCell>
                                            <TableCell className="text-gray-600">{formatDateTime(record.createdAt)}</TableCell>
                                            <TableCell className="text-center font-semibold">{record.quantity}</TableCell>
                                            <TableCell>
                                                <span className="text-gray-600">{reason?.name || '-'}</span>
                                                {record.comment && <span className="text-xs text-gray-400 ml-1">({record.comment})</span>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {filteredReportRecords.length === 0 && (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Nenhum registro de desperdício encontrado</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // ─── Render: Settings Tab ───
    const renderSettingsTab = () => (
        <div className="space-y-6">
            {/* Variants */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Settings className="h-6 w-6 text-purple-600" />
                            <span>Variantes</span>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {wasteVariants.length}
                            </Badge>
                        </div>
                        <Button size="sm" onClick={() => { setEditingVariant(null); setVariantName(''); setShowVariantDialog(true); }} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Variante
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold">Nome</TableHead>
                                <TableHead className="font-semibold text-center">Produtos Atribuídos</TableHead>
                                <TableHead className="font-semibold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wasteVariants.map(variant => (
                                <TableRow key={variant.id}>
                                    <TableCell className="font-medium">{variant.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            {variant.productIds.length} produtos
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setEditingVariant(variant); setVariantName(variant.name); setShowVariantDialog(true); }}>
                                                <Edit className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleOpenAssign(variant)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                <Users className="h-3 w-3 mr-1" />
                                                Atribuir
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setDeletingVariantId(variant.id); setShowDeleteConfirm(true); }}>
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {wasteVariants.length === 0 && (
                        <div className="text-center py-12">
                            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma variante cadastrada</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reasons */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                            <span>Motivos de Desperdício</span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {wasteReasons.length}
                            </Badge>
                        </div>
                        <Button size="sm" onClick={() => { setEditingReason(null); setReasonName(''); setShowReasonDialog(true); }} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Motivo
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold">Nome</TableHead>
                                <TableHead className="font-semibold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wasteReasons.map(reason => (
                                <TableRow key={reason.id}>
                                    <TableCell className="font-medium">{reason.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setEditingReason(reason); setReasonName(reason.name); setShowReasonDialog(true); }}>
                                                <Edit className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setDeletingReasonId(reason.id); setShowDeleteReasonConfirm(true); }}>
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── Dialogs ─── */}

            {/* Variant Create/Edit Dialog */}
            <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingVariant ? 'Editar Variante' : 'Nova Variante'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nome *</Label>
                            <Input value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="Ex: Grande, Médio, Pequeno" className="mt-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVariantDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveVariant} className="bg-gradient-to-r from-purple-600 to-indigo-600">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Variant Confirmation */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Excluir Variante
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta variante? Esta ação não poderá ser desfeita. Todos os produtos serão desatribuídos desta variante.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Não</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteVariant}>Sim, Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Products Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>
                            Atribuir produtos à variante "{assigningVariant?.name}"
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar produto..."
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            <Select value={assignCategoryFilter || '__all__'} onValueChange={(v) => setAssignCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[160px] h-9">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-gray-500">{assignSelectedProducts.length} produto(s) selecionado(s)</p>
                        {/* Product list by category */}
                        <div className="max-h-[400px] overflow-y-auto space-y-4">
                            {Object.entries(assignProductsByCategory).map(([catName, prods]) => (
                                <div key={catName}>
                                    <h4 className="text-sm font-bold text-gray-600 mb-2">{catName}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {prods.map(product => {
                                            const isSelected = assignSelectedProducts.includes(product.id);
                                            return (
                                                <button
                                                    key={product.id}
                                                    onClick={() => toggleAssignProduct(product.id)}
                                                    className={`p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${isSelected
                                                            ? 'bg-purple-50 border-purple-400 text-purple-700'
                                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{product.name}</p>
                                                        {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
                                                    </div>
                                                    {isSelected && <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveAssignment} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                            Salvar ({assignSelectedProducts.length} produtos)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reason Create/Edit Dialog */}
            <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingReason ? 'Editar Motivo' : 'Novo Motivo'}</DialogTitle>
                    </DialogHeader>
                    <div>
                        <Label>Nome *</Label>
                        <Input value={reasonName} onChange={(e) => setReasonName(e.target.value)} placeholder="Nome do motivo" className="mt-1" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReasonDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveReason} className="bg-gradient-to-r from-orange-600 to-red-600">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Reason Confirmation */}
            <Dialog open={showDeleteReasonConfirm} onOpenChange={setShowDeleteReasonConfirm}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Excluir Motivo
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir este motivo? Esta ação não poderá ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteReasonConfirm(false)}>Não</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteReason}>Sim, Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    // ─── Main Render ───
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Desperdício
                    </h1>
                    <p className="text-gray-600">Gestão de desperdício de produtos</p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-white/70 shadow-md">
                        <TabsTrigger value="waste" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                            <Trash2 className="h-4 w-4" />
                            Desperdício
                        </TabsTrigger>
                        <TabsTrigger value="report" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                            <FileSpreadsheet className="h-4 w-4" />
                            Relatório
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                            <Settings className="h-4 w-4" />
                            Definições
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="waste" className="mt-6">
                        {renderWasteTab()}
                    </TabsContent>

                    <TabsContent value="report" className="mt-6">
                        {renderReportTab()}
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        {renderSettingsTab()}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default WasteManager;
