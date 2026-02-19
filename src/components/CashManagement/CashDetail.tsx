import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, CheckCircle, Clock, Paperclip, MessageSquare, CreditCard, Truck, Banknote, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useBrand } from '@/contexts/BrandContext';
import { CashEntry, DEMO_ENTRIES, fmt } from './types';

const CashDetail: React.FC = () => {
    const { t } = useLanguage();
    const { lang = 'pt', id } = useParams<{ lang: string; id: string }>();
    const navigate = useNavigate();
    const { stores } = useData();
    const { stores: brandStores, selectedBrand } = useBrand();

    const allStores = useMemo(() =>
        brandStores.length > 0 ? brandStores : stores.map(s => ({ ...s, brandId: selectedBrand?.id || '' })),
        [brandStores, stores, selectedBrand]
    );

    const storeName = (storeId: string) => allStores.find(s => s.id === storeId)?.name || t('cash.store');

    // Find entry by ID (mock data)
    const entry: CashEntry | undefined = DEMO_ENTRIES.find(e => e.id === id);

    // Local state for new comment
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<string[]>(entry?.comments || []);

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

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments(prev => [...prev, newComment.trim()]);
        setNewComment('');
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 space-y-6">
                {/* Back + Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate(`/${lang}/caixa`)} className="shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-lg font-bold text-foreground">{t('cash.closureDetails')}</h1>
                        <p className="text-sm text-muted-foreground">{fmtDate} — {storeName(entry.storeId)}</p>
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`pointer-events-none ${entry.closingTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        {fmt(entry.closingTotal)} {t('cash.sales')}
                    </Badge>
                    <Badge variant="outline" className="pointer-events-none bg-orange-50 text-orange-700 border-orange-200">
                        {fmt(extrasTotal)} {t('cash.outflows')}
                    </Badge>
                    <Badge variant="outline" className={`pointer-events-none ${hasDeposit ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {hasDeposit ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {hasDeposit ? t('cash.deposited') : t('cash.toDeposit')}
                    </Badge>
                    {entry.noMovement && <Badge variant="secondary" className="pointer-events-none text-muted-foreground">{t('cash.noMovements')}</Badge>}
                </div>

                {/* Main Content Grid */}
                {!entry.noMovement && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Apuração Table */}
                        <Card className="lg:col-span-2">
                            <CardContent className="p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-2 font-semibold text-muted-foreground"></th>
                                            <th className="text-center p-2 font-semibold text-muted-foreground">{t('cash.cash')}</th>
                                            <th className="text-center p-2 font-semibold text-muted-foreground">{t('cash.card')}</th>
                                            <th className="text-center p-2 font-semibold text-muted-foreground">{t('cash.delivery')}</th>
                                            <th className="text-center p-2 font-semibold text-muted-foreground">{t('common.total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="p-2 font-medium text-foreground">{t('cash.assessment')}</td>
                                            <td className="p-2 text-center">{fmt(entry.closingEspecie)}</td>
                                            <td className="p-2 text-center">{fmt(entry.closingCartao)}</td>
                                            <td className="p-2 text-center">{fmt(entry.closingDelivery)}</td>
                                            <td className="p-2 text-center font-semibold">{fmt(entry.closingTotal)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 font-medium text-foreground">{t('cash.validation')}</td>
                                            {[especieVal, cartaoVal, deliveryVal, totalVal].map((v, i) => (
                                                <td key={i} className="p-2 text-center">
                                                    {v === 0 ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className={`font-semibold ${v < 0 ? 'text-destructive' : 'text-emerald-600'}`}>{fmt(v)}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Caixa Summary */}
                        <Card>
                            <CardContent className="p-4 space-y-2">
                                <h4 className="font-bold text-foreground text-center mb-3">{t('cash.register')}</h4>
                                <div className="flex justify-between"><span className="text-muted-foreground text-sm">{t('cash.opening')}</span><span className="font-semibold">{fmt(entry.openingValue)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground text-sm">{t('cash.closing')}</span><span className="font-semibold">{fmt(entry.closingTotal)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground text-sm">(-) {t('cash.deposit')}</span><span className="font-semibold">{fmt(entry.depositValue)}</span></div>
                                <hr className="border-border" />
                                <div className="flex justify-between"><span className="font-semibold text-foreground">{t('cash.balance')}</span><span className={`font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(saldo)}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Card Items — Read-Only */}
                {entry.cartaoItems.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t('cash.cardBreakdown')}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {entry.cartaoItems.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-muted/30 rounded-lg p-3 border">
                                        <span className="text-sm font-medium">{item.brand}</span>
                                        <Input value={fmt(item.value)} disabled className="w-24 text-right text-sm h-8 bg-muted" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Delivery Items — Read-Only */}
                {entry.deliveryItems.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> {t('cash.deliveryBreakdown')}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {entry.deliveryItems.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-muted/30 rounded-lg p-3 border">
                                        <span className="text-sm font-medium">{item.app}</span>
                                        <Input value={fmt(item.value)} disabled className="w-24 text-right text-sm h-8 bg-muted" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Extras — Read-Only */}
                {entry.extras.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Banknote className="h-4 w-4" /> {t('cash.extras')}</h4>
                            <div className="space-y-2">
                                {entry.extras.map((extra, i) => (
                                    <div key={i} className="flex justify-between items-center bg-muted/30 rounded-lg p-3 border">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={extra.type === 'entrada' ? 'default' : 'destructive'} className="text-xs">
                                                {extra.type === 'entrada' ? t('cash.inflow') : t('cash.outflow')}
                                            </Badge>
                                            <span className="text-sm">{extra.description}</span>
                                        </div>
                                        <Input value={fmt(extra.value)} disabled className="w-24 text-right text-sm h-8 bg-muted" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata — Read-Only */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>{t('cash.createdBy')} <b>{entry.openedBy}</b></span>
                            <span>• {t('cash.closedBy')} <b>{entry.closedBy || '—'}</b></span>
                            <div className="ml-auto flex items-center gap-4">
                                <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {entry.attachments.length}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {comments.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comments / Observations */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> {t('cash.comments')} ({comments.length})
                        </h4>

                        {comments.length > 0 ? (
                            <div className="space-y-2">
                                {comments.map((c, i) => (
                                    <div key={i} className="p-3 bg-muted/30 rounded-lg border text-sm text-foreground">
                                        {c}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">{t('cash.noComments')}</p>
                        )}

                        {/* Add New Comment */}
                        <div className="flex gap-2">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={t('cash.addCommentPlaceholder')}
                                className="flex-1 resize-none"
                                rows={2}
                            />
                            <Button
                                size="sm"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="self-end"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CashDetail;
