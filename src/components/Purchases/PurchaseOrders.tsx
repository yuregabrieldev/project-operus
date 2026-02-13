import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trash2, FileEdit, Store, Check, ShoppingCart, ArrowLeft, Truck, FileText, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import type { PurchaseOrder } from '@/contexts/DataContext';

const PurchaseOrders: React.FC = () => {
    const { t } = useLanguage();
    const {
        purchaseOrders,
        suppliers,
        stores,
        getProductById,
        getSupplierById,
        getStoreById,
        deletePurchaseOrder,
        updatePurchaseOrder,
        addMovement,
        addInvoice,
    } = useData();

    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [showTransitDialog, setShowTransitDialog] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [observation, setObservation] = useState('');
    const [isCreatingTransit, setIsCreatingTransit] = useState(false);

    const toggleStore = (storeId: string) => {
        setSelectedStoreIds(prev =>
            prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
        );
    };

    const filteredOrders = useMemo(() => {
        return purchaseOrders
            .filter(order => {
                if (selectedSupplier !== 'all' && order.supplierId !== selectedSupplier) return false;
                if (selectedStoreIds.length > 0 && !order.storeIds.some(id => selectedStoreIds.includes(id))) return false;
                return true;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [purchaseOrders, selectedSupplier, selectedStoreIds]);

    const handleDelete = (orderId: string) => {
        deletePurchaseOrder(orderId);
        toast({
            title: t('orders.deleted'),
            description: t('orders.deletedDescription'),
        });
    };

    const getStoreNames = (storeIds: string[]) => {
        return storeIds.map(id => getStoreById(id)?.name || '').filter(Boolean).join(', ');
    };

    const getTotalItems = (order: PurchaseOrder) => {
        return order.items.length;
    };

    const getTotalQty = (order: PurchaseOrder) => {
        return order.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    const handleCreateTransit = async () => {
        if (!selectedOrder || !orderNumber.trim() || !observation.trim()) {
            toast({
                title: t('purchases.requiredFields'),
                description: t('purchases.fillRequiredFields'),
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingTransit(true);
        try {
            let transitCount = 0;
            selectedOrder.items.forEach(item => {
                addMovement({
                    productId: item.productId,
                    toStoreId: item.storeId,
                    quantity: item.quantity,
                    status: 'in_transit',
                    createdAt: new Date(),
                    userId: 'user1',
                    type: 'in',
                });
                transitCount++;
            });

            const supplier = getSupplierById(selectedOrder.supplierId);
            const totalAmount = selectedOrder.items.reduce((sum, item) => {
                const p = getProductById(item.productId);
                return sum + (p ? p.costPrice * item.quantity : 0);
            }, 0);

            addInvoice({
                supplierId: selectedOrder.supplierId,
                invoiceNumber: orderNumber,
                amount: totalAmount,
                status: 'pending',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 86400000),
            });

            updatePurchaseOrder(selectedOrder.id, {
                hasInvoiceManagement: true,
                hasTransitGenerated: true,
                invoiceId: orderNumber,
                observation: observation,
            });

            toast({
                title: t('purchases.transitCreated'),
                description: t('purchases.transitCreatedDescription').replace('{count}', String(transitCount)),
            });

            setShowTransitDialog(false);
            setOrderNumber('');
            setObservation('');
            setSelectedOrder({ ...selectedOrder, hasInvoiceManagement: true, hasTransitGenerated: true });
        } catch (error) {
            toast({ title: t('common.error'), description: t('purchases.transitError'), variant: 'destructive' });
        } finally {
            setIsCreatingTransit(false);
        }
    };

    const storeLabel = selectedStoreIds.length === 0
        ? t('purchases.allStores')
        : selectedStoreIds.length === 1
            ? stores.find((s: any) => s.id === selectedStoreIds[0])?.name || ''
            : `${selectedStoreIds.length} ${t('purchases.storesSelected')}`;

    // ---- DETAIL VIEW ----
    if (selectedOrder) {
        const supplier = getSupplierById(selectedOrder.supplierId);
        const storeNames = getStoreNames(selectedOrder.storeIds);
        const needsTransit = !selectedOrder.hasInvoiceManagement && !selectedOrder.hasTransitGenerated;

        return (
            <div className="p-6 space-y-6">
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('orders.back')}
                </Button>

                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-5 w-5 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900">{t('orders.orderDetails')}</h2>
                            <Badge
                                variant="outline"
                                className={selectedOrder.hasInvoiceManagement
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                }
                            >
                                {t('orders.invoice')}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={selectedOrder.hasTransitGenerated
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                }
                            >
                                {t('orders.transit')}
                            </Badge>
                        </div>

                        {/* Meta */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 text-xs uppercase">{t('orders.createdAt')}</span>
                                <p className="font-medium">{selectedOrder.createdAt.toLocaleDateString('pt-BR')} {selectedOrder.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase">{t('orders.createdBy')}</span>
                                <p className="font-medium">{selectedOrder.userId}</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500 text-xs uppercase flex items-center gap-1">
                                <Package className="h-3 w-3" /> {t('orders.supplier')}
                            </span>
                            <p className="font-bold text-gray-900">{supplier?.name || '-'}</p>
                        </div>

                        <div>
                            <span className="text-gray-500 text-xs uppercase flex items-center gap-1">
                                <Store className="h-3 w-3" /> {t('orders.stores')}
                            </span>
                            <p className="font-medium text-gray-900">{storeNames}</p>
                        </div>

                        {/* Products Table */}
                        <div>
                            <span className="text-gray-500 text-xs uppercase flex items-center gap-1 mb-2">
                                <ShoppingCart className="h-3 w-3" /> {t('orders.products')}
                            </span>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-bold">{t('orders.productName')}</TableHead>
                                            <TableHead className="font-bold">{t('orders.store')}</TableHead>
                                            <TableHead className="font-bold">{t('orders.unitOfMeasure')}</TableHead>
                                            <TableHead className="font-bold">{t('orders.quantity')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items.map((item, idx) => {
                                            const product = getProductById(item.productId);
                                            const store = getStoreById(item.storeId);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell className="uppercase font-medium">{product?.name || '-'}</TableCell>
                                                    <TableCell>{store?.name || '-'}</TableCell>
                                                    <TableCell className="text-blue-600">{item.unit}</TableCell>
                                                    <TableCell className="text-blue-600 font-semibold">{item.quantity}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center pt-4">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                {t('orders.backToList')}
                            </Button>
                            {needsTransit && (
                                <Button
                                    className="bg-purple-700 hover:bg-purple-800 gap-2"
                                    onClick={() => setShowTransitDialog(true)}
                                >
                                    <Truck className="h-4 w-4" />
                                    {t('purchases.createTransitAndInvoice')}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Transit Creation Dialog */}
                <Dialog open={showTransitDialog} onOpenChange={setShowTransitDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('purchases.transitCreation')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                {t('purchases.transitWillCreate').replace('{count}', String(selectedOrder.items.length))}
                            </p>
                            <div className="space-y-1.5">
                                <Label className="font-medium">{t('purchases.orderNumberLabel')}*</Label>
                                <Input
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder={t('purchases.orderNumberPlaceholder')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="font-medium">{t('purchases.observationLabel')}*</Label>
                                <Textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    placeholder={t('purchases.observationPlaceholder')}
                                    className="min-h-[100px]"
                                />
                            </div>
                            <p className="text-xs text-gray-400">{t('purchases.transitNote')}</p>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowTransitDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    onClick={handleCreateTransit}
                                    disabled={isCreatingTransit || !orderNumber.trim() || !observation.trim()}
                                    className="flex-1 bg-purple-700 hover:bg-purple-800"
                                >
                                    {isCreatingTransit ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                            {t('purchases.creating')}
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="h-4 w-4 mr-2" />
                                            {t('purchases.createTransitAndInvoice')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ---- LIST VIEW ----
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('orders.title')}</h1>
                <p className="text-gray-600 mt-2">{t('orders.description')}</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">{t('orders.supplier')}</Label>
                            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('purchases.allSuppliers')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('purchases.allSuppliers')}</SelectItem>
                                    {suppliers.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">{t('orders.stores')}</Label>
                            <Popover open={storeDropdownOpen} onOpenChange={setStoreDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal h-10">
                                        <span className="truncate">{storeLabel}</span>
                                        <Store className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-2" align="start">
                                    <div className="space-y-1">
                                        <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => setSelectedStoreIds([])}>
                                            <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${selectedStoreIds.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                {selectedStoreIds.length === 0 && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            {t('purchases.allStores')}
                                        </Button>
                                        {stores.map((store: any) => (
                                            <Button key={store.id} variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => toggleStore(store.id)}>
                                                <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${selectedStoreIds.includes(store.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                    {selectedStoreIds.includes(store.id) && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                {store.name}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t('orders.listTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('orders.createdAt')}</TableHead>
                                    <TableHead>{t('orders.supplier')}</TableHead>
                                    <TableHead>{t('orders.user')}</TableHead>
                                    <TableHead>{t('orders.stores')}</TableHead>
                                    <TableHead>{t('orders.items')}</TableHead>
                                    <TableHead>{t('orders.qty')}</TableHead>
                                    <TableHead>{t('orders.invoiceManagement')}</TableHead>
                                    <TableHead>{t('orders.generatedTransit')}</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map(order => {
                                    const supplier = getSupplierById(order.supplierId);
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {order.createdAt.toLocaleDateString('pt-BR')}
                                                <br />
                                                <span className="text-gray-400 text-xs">{order.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </TableCell>
                                            <TableCell className="font-semibold">{supplier?.name || '-'}</TableCell>
                                            <TableCell>{order.userId}</TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <span className="text-sm">{getStoreNames(order.storeIds)}</span>
                                            </TableCell>
                                            <TableCell className="text-center">{getTotalItems(order)}</TableCell>
                                            <TableCell className="text-center font-semibold">{getTotalQty(order)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={order.hasInvoiceManagement
                                                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-100'
                                                    : 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100'
                                                }>
                                                    {order.hasInvoiceManagement ? t('orders.yes') : t('orders.no')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={order.hasTransitGenerated
                                                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-100'
                                                    : 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100'
                                                }>
                                                    {order.hasTransitGenerated ? t('orders.yes') : t('orders.no')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(order.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => setSelectedOrder(order)}>
                                                        <FileEdit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('orders.noOrders')}</h3>
                            <p className="text-gray-500 text-sm">{t('orders.noOrdersDescription')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PurchaseOrders;
