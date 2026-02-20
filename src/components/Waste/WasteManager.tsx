import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
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
    const toLocalISODate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayLocal = new Date();
    const monthStartLocal = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 1);

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
    const [reportStartDate, setReportStartDate] = useState(() => toLocalISODate(monthStartLocal));
    const [reportEndDate, setReportEndDate] = useState(() => toLocalISODate(todayLocal));
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
            const catName = getCategoryById(p.categoryId)?.name || t('waste.noCategory');
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

    const handleAddWaste = async () => {
        if (!selectedProduct || !selectedVariant || !wasteReasonId) {
            toast({ title: t('waste.fillAllFields'), variant: 'destructive' });
            return;
        }
        const selectedReasonObj = wasteReasons.find(r => r.id === wasteReasonId);
        if (selectedReasonObj?.name === 'Outros' && !wasteComment.trim()) {
            toast({ title: t('waste.commentRequired'), variant: 'destructive' });
            return;
        }
        const storeIdToUse = wasteStoreFilter || stores[0]?.id;
        if (!storeIdToUse) {
            toast({ title: t('waste.fillAllFields'), description: 'Selecione uma loja.', variant: 'destructive' });
            return;
        }

        const saved = await addWasteRecord({
            productId: selectedProduct.id,
            variantId: selectedVariant.id,
            storeId: storeIdToUse,
            userId: user?.id || 'user1',
            userName: user?.name || 'Usuário',
            quantity: wasteQuantity,
            reasonId: wasteReasonId,
            comment: wasteComment.trim() || undefined,
            createdAt: new Date(),
        });
        if (!saved) {
            toast({ title: 'Erro ao salvar desperdício', description: 'Tente novamente.', variant: 'destructive' });
            return;
        }

        toast({ title: t('waste.wasteRecorded') });
        setWasteQuantity(1);
        setWasteReasonId('');
        setWasteComment('');
    };

    const handleUndoWaste = (recordId: string) => {
        deleteWasteRecord(recordId);
        toast({ title: t('waste.wasteUndone') });
    };

    // ─── Report Tab Logic ───
    const filteredReportRecords = useMemo(() => {
        const parseLocalDateStart = (isoDate: string) => {
            const [y, m, d] = isoDate.split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        };
        const parseLocalDateEnd = (isoDate: string) => {
            const [y, m, d] = isoDate.split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
        };

        return wasteRecords.filter(r => {
            const d = new Date(r.createdAt);
            const product = getProductById(r.productId);
            const matchesStore = !reportStoreFilter || r.storeId === reportStoreFilter;
            const matchesCategory = !reportCategoryFilter || (product && product.categoryId === reportCategoryFilter);
            const matchesStartDate = !reportStartDate || d >= parseLocalDateStart(reportStartDate);
            const matchesEndDate = !reportEndDate || d <= parseLocalDateEnd(reportEndDate);
            return matchesStore && matchesCategory && matchesStartDate && matchesEndDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [wasteRecords, reportStoreFilter, reportCategoryFilter, reportStartDate, reportEndDate, getProductById]);

    // XLSX Export (simple CSV with .xlsx extension + structured data)
    const exportXLSX = () => {
        const BOM = '\uFEFF';
        const headers = [t('waste.product'), t('waste.sku'), t('waste.variant'), t('waste.store'), t('waste.category'), t('waste.user'), t('waste.date'), t('waste.time'), t('waste.quantity'), t('waste.reason'), t('waste.comment')];
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
            [t('waste.reportSummary')],
            [t('waste.totalRecords'), filteredReportRecords.length.toString()],
            [t('waste.totalQuantity'), totalQty.toString()],
            [t('waste.period'), `${reportStartDate || t('waste.start')} a ${reportEndDate || t('waste.end')}`],
        ];

        const csvContent = BOM + [
            [`${t('waste.reportTitle')}`],
            [`${t('waste.generatedAt')} ${new Date().toLocaleString('pt-BR')}`],
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
        toast({ title: t('waste.exportSuccess') });
    };

    // ─── Settings Tab Logic ───
    const handleSaveVariant = () => {
        if (!variantName.trim()) return;
        if (editingVariant) {
            updateWasteVariant(editingVariant.id, { name: variantName.trim() });
            toast({ title: t('waste.variantUpdated') });
        } else {
            addWasteVariant({ name: variantName.trim(), productIds: [] });
            toast({ title: t('waste.variantCreated') });
        }
        setVariantName('');
        setEditingVariant(null);
        setShowVariantDialog(false);
    };

    const handleConfirmDeleteVariant = () => {
        if (deletingVariantId) {
            deleteWasteVariant(deletingVariantId);
            toast({ title: t('waste.variantDeleted'), description: t('waste.variantDeletedDesc'), variant: 'destructive' });
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
            toast({ title: t('waste.productsAssigned') });
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
            const catName = getCategoryById(p.categoryId)?.name || t('waste.noCategory');
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(p);
        });
        return grouped;
    }, [assignFilteredProducts, getCategoryById]);

    const handleSaveReason = () => {
        if (!reasonName.trim()) return;
        if (editingReason) {
            updateWasteReason(editingReason.id, { name: reasonName.trim() });
            toast({ title: t('waste.reasonUpdated') });
        } else {
            addWasteReason({ name: reasonName.trim() });
            toast({ title: t('waste.reasonCreated') });
        }
        setReasonName('');
        setEditingReason(null);
        setShowReasonDialog(false);
    };

    const handleConfirmDeleteReason = () => {
        if (deletingReasonId) {
            deleteWasteReason(deletingReasonId);
            toast({ title: t('waste.reasonDeleted'), variant: 'destructive' });
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
                <div className="min-h-screen bg-background p-6">
                    <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="mb-4 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('waste.back')}
                    </Button>
                    <Card className="max-w-lg mx-auto border-border shadow-sm">
                        <CardHeader className="text-center bg-muted/30 pb-6 border-b border-border">
                            {selectedProduct.imageUrl && (
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-24 h-24 object-cover rounded-xl mx-auto mb-3 shadow-sm border border-border" />
                            )}
                            <CardTitle className="text-lg font-bold text-foreground">{selectedProduct.name}</CardTitle>
                            {selectedProduct.sku && (
                                <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-4 text-center font-medium">{t('waste.selectVariant')}</p>
                            {variants.length > 0 ? (
                                <div className="space-y-2">
                                    {variants.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className="w-full p-4 rounded-xl border border-border hover:bg-muted/50 transition-all text-left font-semibold text-foreground hover:border-primary/50"
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground">{t('waste.noVariantsAssigned')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('waste.goToSettings')}</p>
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
            <div className="min-h-screen bg-background p-6">
                <Button variant="ghost" onClick={() => setSelectedVariant(null)} className="mb-4 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('waste.back')}
                </Button>
                <Card className="max-w-lg mx-auto border-border shadow-sm">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            {selectedProduct.imageUrl && (
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-20 h-20 object-cover rounded-xl mx-auto mb-3 shadow-sm border border-border" />
                            )}
                            <h2 className="text-lg font-bold text-foreground">{selectedProduct.name.toUpperCase()}</h2>
                            <p className="text-muted-foreground font-medium">{selectedVariant.name.toUpperCase()}</p>
                        </div>

                        {/* Quantity selector */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                                onClick={() => setWasteQuantity(Math.max(0.5, wasteQuantity - 0.5))}
                                className="w-14 h-14 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                            >
                                <Minus className="h-6 w-6" />
                            </button>
                            <Input
                                value={wasteQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value.replace(',', '.'));
                                    if (!isNaN(val) && val >= 0) setWasteQuantity(val);
                                }}
                                className="w-24 text-center text-3xl font-bold h-16 border-2 border-border rounded-xl bg-background text-foreground focus:ring-primary focus:border-primary"
                            />
                            <button
                                onClick={() => setWasteQuantity(wasteQuantity + 0.5)}
                                className="w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Reason */}
                        <div className="mb-4">
                            <Label className="font-bold text-foreground">{t('waste.reason')}</Label>
                            <Select value={wasteReasonId} onValueChange={setWasteReasonId}>
                                <SelectTrigger className="mt-1 border border-input rounded-xl h-12">
                                    <SelectValue placeholder={t('waste.selectReason')} />
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
                                <Label className="font-bold text-foreground">{t('waste.comment')}</Label>
                                <Textarea
                                    value={wasteComment}
                                    onChange={(e) => setWasteComment(e.target.value)}
                                    placeholder={t('waste.commentPlaceholder')}
                                    className="mt-1 border border-input rounded-xl min-h-[80px]"
                                />
                            </div>
                        )}

                        {/* Add button */}
                        <Button
                            onClick={handleAddWaste}
                            className="w-full h-14 rounded-full text-lg font-semibold mt-2 shadow-sm"
                        >
                            {t('waste.addToWaste')}
                        </Button>

                        {/* Product history */}
                        <div className="mt-8 border-t border-border pt-4">
                            {productHistory.length > 0 ? (
                                <>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {productHistory.slice(0, showHistory ? undefined : 3).map(record => {
                                            const variant = wasteVariants.find(v => v.id === record.variantId);
                                            return (
                                                <div key={record.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-primary text-xs font-bold">{record.userName.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {formatDateTime(record.createdAt)} ({record.userName})
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('waste.addedWaste')} {record.quantity} ({selectedProduct.name}{variant ? ` - ${variant.name}` : ''}) {t('waste.toWaste')}
                                                        </p>
                                                    </div>
                                                    {canUndoRecord(record) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive h-7 px-2 hover:bg-destructive/10"
                                                            onClick={() => handleUndoWaste(record.id)}
                                                        >
                                                            <Undo2 className="h-3 w-3 mr-1" />
                                                            {t('waste.undoAction')}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {productHistory.length > 3 && (
                                        <button
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="text-sm text-primary font-semibold mt-2 hover:underline"
                                        >
                                            {showHistory ? t('waste.hideHistory') : `${t('waste.showMore')} (${productHistory.length - 3})`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">{t('waste.noWasteHistory')}</p>
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
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder={t('waste.searchProduct')}
                                    value={wasteSearch}
                                    onChange={(e) => setWasteSearch(e.target.value)}
                                    className="pl-10 h-10"
                                />
                            </div>
                            <Select value={wasteStoreFilter || '__all__'} onValueChange={(v) => setWasteStoreFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[180px] h-10">
                                    <SelectValue placeholder={t('waste.allStores')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{t('waste.allStores')}</SelectItem>
                                    {stores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={wasteCategoryFilter || '__all__'} onValueChange={(v) => setWasteCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[180px] h-10">
                                    <SelectValue placeholder={t('waste.allCategories')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{t('waste.allCategories')}</SelectItem>
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
                    <Button variant="outline" onClick={() => setShowTodayHistory(!showTodayHistory)}>
                        <Clock className="h-4 w-4 mr-2" />
                        {showTodayHistory ? t('waste.hideTodayHistory') : `${t('waste.todayHistory')} (${todayRecords.length})`}
                    </Button>
                </div>

                {/* Today's History Panel */}
                {showTodayHistory && todayRecords.length > 0 && (
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-2 bg-muted/30 border-b border-border">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                {t('waste.wastedToday')}
                                <Badge variant="outline" className="bg-background">
                                    {todayRecords.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {todayRecords.map(record => {
                                    const product = getProductById(record.productId);
                                    const variant = wasteVariants.find(v => v.id === record.variantId);
                                    const reason = wasteReasons.find(r => r.id === record.reasonId);
                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-destructive text-xs font-bold">{record.userName.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{product?.name} {variant ? `(${variant.name})` : ''}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDateTime(record.createdAt)} — {record.userName} — {reason?.name}{record.comment ? ` - ${record.comment}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    {t('waste.qty')} {record.quantity}
                                                </Badge>
                                                {canUndoRecord(record) && (
                                                    <Button variant="ghost" size="sm" className="text-destructive h-7 px-2 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleUndoWaste(record.id)}>
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
                {
                    Object.entries(productsByCategory).map(([catName, prods]) => (
                        <div key={catName}>
                            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                {catName}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {prods.map(product => (
                                    <Card
                                        key={product.id}
                                        className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-border bg-card"
                                        onClick={() => { setSelectedProduct(product); setSelectedVariant(null); setWasteQuantity(1); setWasteReasonId(''); setWasteComment(''); setShowHistory(false); }}
                                    >
                                        <CardContent className="p-3 text-center">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl mx-auto mb-2 shadow-sm border border-border" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl mx-auto mb-2 bg-primary/10 flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-primary" />
                                                </div>
                                            )}
                                            <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                                            {product.sku && (
                                                <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                }

                {
                    Object.keys(productsByCategory).length === 0 && (
                        <div className="text-center py-16">
                            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">{t('waste.noProductFound')}</p>
                        </div>
                    )
                }
            </div >
        );
    };

    // ─── Render: Report Tab ───
    const renderReportTab = () => (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                        <Filter className="h-5 w-5 text-primary" />
                        {t('waste.reportFilters')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t('waste.startDate')}</Label>
                            <DateInput value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t('waste.endDate')}</Label>
                            <DateInput value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t('waste.store')}</Label>
                            <Select value={reportStoreFilter || '__all__'} onValueChange={(v) => setReportStoreFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{t('waste.allStores')}</SelectItem>
                                    {stores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t('waste.category')}</Label>
                            <Select value={reportCategoryFilter || '__all__'} onValueChange={(v) => setReportCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{t('waste.allCategories')}</SelectItem>
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
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-6 w-6 text-primary" />
                            <span className="text-lg text-foreground">{t('waste.wasteReport')}</span>
                            <Badge variant="outline" className="bg-background">
                                {filteredReportRecords.length} {t('waste.records')}
                            </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary" onClick={exportXLSX}>
                            <Download className="h-4 w-4" />
                            {t('waste.exportXLSX')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="font-semibold text-foreground">{t('waste.product')}</TableHead>
                                    <TableHead className="font-semibold text-foreground">{t('waste.sku')}</TableHead>
                                    <TableHead className="font-semibold text-foreground">{t('waste.variant')}</TableHead>
                                    <TableHead className="font-semibold text-foreground">{t('waste.user')}</TableHead>
                                    <TableHead className="font-semibold text-foreground">{t('waste.dateTime')}</TableHead>
                                    <TableHead className="font-semibold text-center text-foreground">{t('waste.quantity')}</TableHead>
                                    <TableHead className="font-semibold text-foreground">{t('waste.reason')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReportRecords.map(record => {
                                    const product = getProductById(record.productId);
                                    const variant = wasteVariants.find(v => v.id === record.variantId);
                                    const reason = wasteReasons.find(r => r.id === record.reasonId);
                                    return (
                                        <TableRow key={record.id} className="hover:bg-muted/30 border-border">
                                            <TableCell className="font-medium text-foreground">{product?.name || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{product?.sku || '-'}</TableCell>
                                            <TableCell className="text-foreground">{variant?.name || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{record.userName}</TableCell>
                                            <TableCell className="text-muted-foreground">{formatDateTime(record.createdAt)}</TableCell>
                                            <TableCell className="text-center font-semibold text-foreground">{record.quantity}</TableCell>
                                            <TableCell>
                                                <span className="text-foreground">{reason?.name || '-'}</span>
                                                {record.comment && <span className="text-xs text-muted-foreground ml-1">({record.comment})</span>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {filteredReportRecords.length === 0 && (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">{t('waste.noWasteRecords')}</p>
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
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Settings className="h-6 w-6 text-primary" />
                            <span className="text-foreground">{t('waste.variants')}</span>
                            <Badge variant="outline" className="bg-background">
                                {wasteVariants.length}
                            </Badge>
                        </div>
                        <Button size="sm" onClick={() => { setEditingVariant(null); setVariantName(''); setShowVariantDialog(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('waste.newVariant')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold text-foreground">{t('waste.name')}</TableHead>
                                <TableHead className="font-semibold text-center text-foreground">{t('waste.assignedProducts')}</TableHead>
                                <TableHead className="font-semibold text-right text-foreground">{t('waste.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wasteVariants.map(variant => (
                                <TableRow key={variant.id} className="hover:bg-muted/30 border-border">
                                    <TableCell className="font-medium text-foreground">{variant.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-background">
                                            {variant.productIds.length} {t('waste.products')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setEditingVariant(variant); setVariantName(variant.name); setShowVariantDialog(true); }} className="h-8">
                                                <Edit className="h-3 w-3 mr-1" />
                                                {t('waste.edit')}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleOpenAssign(variant)} className="h-8">
                                                <Users className="h-3 w-3 mr-1" />
                                                {t('waste.assign')}
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8" onClick={() => { setDeletingVariantId(variant.id); setShowDeleteConfirm(true); }}>
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                {t('waste.delete')}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {wasteVariants.length === 0 && (
                        <div className="text-center py-12">
                            <Settings className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">{t('waste.noVariantsRegistered')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reasons */}
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-primary" />
                            <span className="text-foreground">{t('waste.wasteReasons')}</span>
                            <Badge variant="outline" className="bg-background">
                                {wasteReasons.length}
                            </Badge>
                        </div>
                        <Button size="sm" onClick={() => { setEditingReason(null); setReasonName(''); setShowReasonDialog(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('waste.newReason')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold text-foreground">{t('waste.name')}</TableHead>
                                <TableHead className="font-semibold text-right text-foreground">{t('waste.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wasteReasons.map(reason => (
                                <TableRow key={reason.id} className="hover:bg-muted/30 border-border">
                                    <TableCell className="font-medium text-foreground">{reason.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setEditingReason(reason); setReasonName(reason.name); setShowReasonDialog(true); }} className="h-8">
                                                <Edit className="h-3 w-3 mr-1" />
                                                {t('waste.edit')}
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8" onClick={() => { setDeletingReasonId(reason.id); setShowDeleteReasonConfirm(true); }}>
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                {t('waste.delete')}
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
                        <DialogTitle>{editingVariant ? t('waste.editVariant') : t('waste.newVariant')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>{t('waste.nameRequired')}</Label>
                            <Input value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder={t('waste.variantPlaceholder')} className="mt-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVariantDialog(false)}>{t('waste.cancel')}</Button>
                        <Button onClick={handleSaveVariant} className="bg-gradient-to-r from-purple-600 to-indigo-600">{t('waste.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Variant Confirmation */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            {t('waste.deleteVariant')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('waste.deleteVariantConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>{t('waste.no')}</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteVariant}>{t('waste.yesDelete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Products Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>
                            {t('waste.assignProducts')} "{assigningVariant?.name}"
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder={t('waste.searchProduct')}
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            <Select value={assignCategoryFilter || '__all__'} onValueChange={(v) => setAssignCategoryFilter(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-[160px] h-9">
                                    <SelectValue placeholder={t('waste.category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{t('waste.all')}</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-gray-500">{assignSelectedProducts.length} {t('waste.productsSelected')}</p>
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
                        <Button variant="outline" onClick={() => setShowAssignDialog(false)}>{t('waste.cancel')}</Button>
                        <Button onClick={handleSaveAssignment} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                            {t('waste.save')} ({assignSelectedProducts.length} {t('waste.products')})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reason Create/Edit Dialog */}
            <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingReason ? t('waste.editReason') : t('waste.newReason')}</DialogTitle>
                    </DialogHeader>
                    <div>
                        <Label>{t('waste.nameRequired')}</Label>
                        <Input value={reasonName} onChange={(e) => setReasonName(e.target.value)} placeholder={t('waste.reasonPlaceholder')} className="mt-1" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReasonDialog(false)}>{t('waste.cancel')}</Button>
                        <Button onClick={handleSaveReason}>{t('waste.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Reason Confirmation */}
            <Dialog open={showDeleteReasonConfirm} onOpenChange={setShowDeleteReasonConfirm}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            {t('waste.deleteReason')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('waste.deleteReasonConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteReasonConfirm(false)}>{t('waste.no')}</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteReason}>{t('waste.yesDelete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    // ─── Main Render ───
    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {t('waste.title')}
                    </h1>
                    <p className="text-muted-foreground">{t('waste.subtitle')}</p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="waste" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            {t('waste.wasteTab')}
                        </TabsTrigger>
                        <TabsTrigger value="report" className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            {t('waste.reportTab')}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            {t('waste.settingsTab')}
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
