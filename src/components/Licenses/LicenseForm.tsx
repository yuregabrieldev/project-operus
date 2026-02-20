import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    FileText, Plus, Trash2, Edit, Eye, CheckCircle, User, Phone, Mail,
    Paperclip, Calendar, DollarSign, ArrowLeft, X, MessageSquare
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { License, LicenseRenewal, LicenseContact, LicenseAttachment, LicenseStatus } from '@/contexts/DataContext';

interface LicenseFormProps {
    license?: License | null;
    onClose: () => void;
}

export const LicenseForm: React.FC<LicenseFormProps> = ({ license, onClose }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { stores, addLicense, updateLicense } = useData();

    // Form data
    const [name, setName] = useState(license?.name || '');
    const [storeIds, setStoreIds] = useState<string[]>(license?.storeIds || []);
    const [description, setDescription] = useState(license?.description || '');
    const [periodicity, setPeriodicity] = useState<License['periodicity']>(license?.periodicity || 'mensal');
    const [alertDays, setAlertDays] = useState(license?.alertDays?.toString() || '10');
    const [status, setStatus] = useState<LicenseStatus>(license?.status || 'ativa');

    // Renewals
    const [renewals, setRenewals] = useState<LicenseRenewal[]>(license?.renewals || []);
    const [showRenewalDialog, setShowRenewalDialog] = useState(false);
    const [renewalForm, setRenewalForm] = useState({ issueDate: '', renewalDate: '', value: '', currency: '€' });

    // Contacts
    const [contacts, setContacts] = useState<LicenseContact[]>(license?.contacts || []);
    const [showContactDialog, setShowContactDialog] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
    const [editingContactId, setEditingContactId] = useState<string | null>(null);

    // Attachments
    const [attachments, setAttachments] = useState<LicenseAttachment[]>(license?.attachments || []);
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
    const [attachmentDesc, setAttachmentDesc] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    // Observations
    const [observations, setObservations] = useState<Array<{ user: string; text: string; date: string }>>(license?.observations || []);
    const [newObservation, setNewObservation] = useState('');

    // Store selector dialog
    const [showStoreDialog, setShowStoreDialog] = useState(false);
    const [tempStoreIds, setTempStoreIds] = useState<string[]>(storeIds);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const getStatusColor = (s: LicenseStatus) => {
        switch (s) {
            case 'ativa': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'expirada': return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'cancelada': return 'bg-muted text-muted-foreground border-border';
            case 'pendente': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-muted/50 text-muted-foreground border-border';
        }
    };

    const storeNames = storeIds.map(id => stores.find(s => s.id === id)?.name).filter(Boolean).join(', ');

    // Renewal handlers
    const handleAddRenewal = () => {
        if (!renewalForm.issueDate || !renewalForm.renewalDate || !renewalForm.value) return;
        const renewal: LicenseRenewal = {
            id: generateId(),
            issueDate: new Date(renewalForm.issueDate),
            renewalDate: new Date(renewalForm.renewalDate),
            value: parseFloat(renewalForm.value),
            currency: renewalForm.currency,
        };
        setRenewals(prev => [...prev, renewal]);
        setRenewalForm({ issueDate: '', renewalDate: '', value: '', currency: '€' });
        setShowRenewalDialog(false);
    };

    const handleDeleteRenewal = (id: string) => {
        setRenewals(prev => prev.filter(r => r.id !== id));
    };

    // Contact handlers
    const handleSaveContact = () => {
        if (!contactForm.name) return;
        if (editingContactId) {
            setContacts(prev => prev.map(c => c.id === editingContactId ? { ...c, ...contactForm } : c));
            setEditingContactId(null);
        } else {
            const contact: LicenseContact = {
                id: generateId(),
                ...contactForm,
            };
            setContacts(prev => [...prev, contact]);
        }
        setContactForm({ name: '', phone: '', email: '' });
        setShowContactDialog(false);
    };

    const handleEditContact = (contact: LicenseContact) => {
        setEditingContactId(contact.id);
        setContactForm({ name: contact.name, phone: contact.phone || '', email: contact.email || '' });
        setShowContactDialog(true);
    };

    const handleDeleteContact = (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    };

    // Attachment handlers
    const handleAddAttachment = () => {
        if (!attachmentDesc) return;
        const attachment: LicenseAttachment = {
            id: generateId(),
            description: attachmentDesc,
            createdAt: new Date(),
            file: attachmentFile || undefined,
            fileName: attachmentFile?.name,
        };
        setAttachments(prev => [...prev, attachment]);
        setAttachmentDesc('');
        setAttachmentFile(null);
        setShowAttachmentDialog(false);
    };

    const handleDeleteAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleViewAttachment = (attachment: LicenseAttachment) => {
        if (attachment.file) {
            const url = URL.createObjectURL(attachment.file);
            window.open(url, '_blank');
        }
    };

    // Observation handler
    const handleAddObservation = () => {
        if (!newObservation.trim()) return;
        const obs = {
            user: user?.name || 'User',
            text: newObservation.trim(),
            date: new Date().toLocaleString('pt-BR'),
        };
        setObservations(prev => [...prev, obs]);
        setNewObservation('');
    };

    // Store select handler
    const handleSaveStores = () => {
        setStoreIds(tempStoreIds);
        setShowStoreDialog(false);
    };

    const toggleTempStore = (storeId: string) => {
        setTempStoreIds(prev =>
            prev.includes(storeId) ? prev.filter(s => s !== storeId) : [...prev, storeId]
        );
    };

    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

    // Submit
    const handleSubmit = () => {
        if (!name.trim() || storeIds.length === 0) {
            toast({ title: 'Preencha os campos obrigatórios', description: 'Nome e Lojas são obrigatórios.', variant: 'destructive' });
            return;
        }
        if (renewals.length === 0) {
            toast({ title: 'Adicione pelo menos uma renovação', variant: 'destructive' });
            return;
        }

        const autoObs: Array<{ user: string; text: string; date: string }> = [];
        if (!license) {
            autoObs.push({ user: user?.name || 'User', text: 'Novo controle de licença criado.', date: new Date().toLocaleString('pt-BR') });
        }

        const data: Omit<License, 'id'> = {
            name: name.trim(),
            storeIds,
            description: description.trim(),
            periodicity,
            alertDays: parseInt(alertDays) || 10,
            status,
            renewals,
            contacts,
            attachments,
            observations: [...observations, ...autoObs],
        };

        if (license) {
            updateLicense(license.id, data);
            toast({ title: 'Licença atualizada com sucesso!' });
        } else {
            addLicense(data);
            toast({ title: 'Licença criada com sucesso!' });
        }

        onClose();
    };

    // Cancel license
    const handleCancel = () => {
        if (license) {
            const cancelObs = {
                user: user?.name || 'User',
                text: 'Licença cancelada.',
                date: new Date().toLocaleString('pt-BR'),
            };
            updateLicense(license.id, { status: 'cancelada', observations: [...observations, cancelObs] });
            toast({ title: 'Licença cancelada', variant: 'destructive' });
            onClose();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with status badge */}
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">
                    {license ? t('licenses.editLicenseData') : t('licenses.newLicense')}
                </h2>
                <Badge className={`${getStatusColor(status)} border ${status === 'expirada' ? 'animate-pulse' : ''}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            </div>

            {/* Main data section */}
            <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                            {/* Store */}
                            <div>
                                <Label className="text-xs text-muted-foreground font-medium">{t('licenses.store')}*</Label>
                                <p className="text-sm font-semibold text-foreground">
                                    {storeNames || <span className="text-muted-foreground">{t('licenses.selectStore')}</span>}
                                </p>
                            </div>

                            {/* License name */}
                            <div>
                                <Label className="text-xs text-muted-foreground font-medium">{t('licenses.licenseName')}*</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('licenses.licenseNamePlaceholder')}
                                    className="mt-1"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-xs text-muted-foreground font-medium">{t('licenses.description')}</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('licenses.descriptionPlaceholder')}
                                    className="mt-1 min-h-[60px]"
                                />
                            </div>

                            {/* Periodicity */}
                            <div>
                                <Label className="text-xs text-muted-foreground font-medium">{t('licenses.periodicity')}*</Label>
                                <Select value={periodicity} onValueChange={(v: License['periodicity']) => setPeriodicity(v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mensal">{t('licenses.monthly')}</SelectItem>
                                        <SelectItem value="trimestral">{t('licenses.quarterly')}</SelectItem>
                                        <SelectItem value="semestral">{t('licenses.biannual')}</SelectItem>
                                        <SelectItem value="anual">{t('licenses.annual')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Alert days */}
                            <div>
                                <p className="text-sm font-semibold text-foreground mt-2">
                                    {t('licenses.alertDaysPrefix')}{' '}
                                    <Input
                                        type="number"
                                        value={alertDays}
                                        onChange={(e) => setAlertDays(e.target.value)}
                                        className="w-16 inline-block mx-1 h-8 text-center"
                                        min="1"
                                    />{' '}
                                    {t('licenses.days')}
                                </p>
                            </div>
                        </div>

                        <Button variant="outline" onClick={() => { setTempStoreIds(storeIds); setShowStoreDialog(true); }} className="ml-4">
                            {t('common.edit')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Renewals section */}
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-foreground">{t('licenses.renewals')}*</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowRenewalDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm">
                            <Plus className="h-3 w-3 mr-1" />
                            {t('common.add')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {renewals.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />{t('licenses.issue')}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />{t('licenses.renewal')}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground"><DollarSign className="h-3 w-3 inline mr-1" />{t('licenses.value')}</TableHead>
                                    <TableHead className="text-xs w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renewals.map((renewal, i) => {
                                    const isActive = new Date(renewal.renewalDate) > new Date();
                                    return (
                                        <TableRow key={renewal.id} className="hover:bg-muted/50">
                                            <TableCell className="text-sm text-foreground">{formatDate(renewal.issueDate)}</TableCell>
                                            <TableCell className="text-sm text-foreground">{formatDate(renewal.renewalDate)}</TableCell>
                                            <TableCell className="text-sm text-foreground">{renewal.currency}{renewal.value.toFixed(2)}</TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRenewal(renewal.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6">
                            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('licenses.noRenewals')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contacts section */}
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-foreground">{t('licenses.contacts')}</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => { setEditingContactId(null); setContactForm({ name: '', phone: '', email: '' }); setShowContactDialog(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm">
                            <Plus className="h-3 w-3 mr-1" />
                            {t('common.add')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {contacts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground"><User className="h-3 w-3 inline mr-1" />{t('licenses.contactName')}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground"><Phone className="h-3 w-3 inline mr-1" />{t('licenses.contactPhone')}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground"><Mail className="h-3 w-3 inline mr-1" />{t('licenses.contactEmail')}</TableHead>
                                    <TableHead className="text-xs w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map(contact => (
                                    <TableRow key={contact.id} className="hover:bg-muted/50">
                                        <TableCell className="text-sm text-foreground">{contact.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{contact.phone || '-'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{contact.email || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteContact(contact.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleEditContact(contact)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6">
                            <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('licenses.noContacts')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attachments section */}
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-foreground">{t('licenses.attachments')}</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => { setAttachmentDesc(''); setAttachmentFile(null); setShowAttachmentDialog(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm">
                            <Plus className="h-3 w-3 mr-1" />
                            {t('common.add')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {attachments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground"><FileText className="h-3 w-3 inline mr-1" />{t('licenses.description')}</TableHead>
                                    <TableHead className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />{t('licenses.createdAt')}</TableHead>
                                    <TableHead className="text-xs w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attachments.map(att => (
                                    <TableRow key={att.id} className="hover:bg-muted/50">
                                        <TableCell className="text-sm text-foreground">{att.description}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(att.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAttachment(att.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                                {att.file && (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleViewAttachment(att)}>
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6">
                            <Paperclip className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('licenses.noAttachments')}</p>
                            <Button variant="outline" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm" onClick={() => { setAttachmentDesc(''); setAttachmentFile(null); setShowAttachmentDialog(true); }}>
                                <Plus className="h-3 w-3 mr-1" />
                                {t('common.add')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Observations section */}
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">{t('licenses.observations')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {observations.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {observations.map((obs, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary text-xs font-bold">{obs.user.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">
                                            <span className="font-semibold text-foreground">{obs.user}:</span>{' '}
                                            <span className="text-muted-foreground">{obs.text}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">{obs.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={newObservation}
                            onChange={(e) => setNewObservation(e.target.value)}
                            placeholder={t('licenses.newObservationPlaceholder')}
                            className="flex-1"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddObservation(); }}
                        />
                        <Button onClick={handleAddObservation} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {t('common.add')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="shadow-sm">
                    {t('common.back')}
                </Button>
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                    {license ? t('common.saveChanges') : t('licenses.createLicense')}
                </Button>
                {license && license.status !== 'cancelada' && (
                    <Button variant="destructive" onClick={handleCancel} className="shadow-sm">
                        {t('licenses.cancelLicense')}
                    </Button>
                )}
            </div>

            {/* ─── Dialogs ─── */}

            {/* Renewal Dialog */}
            <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Renovação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" /> Emissão</Label>
                            <DateInput value={renewalForm.issueDate} onChange={(e) => setRenewalForm(prev => ({ ...prev, issueDate: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" /> Renovação</Label>
                            <DateInput value={renewalForm.renewalDate} onChange={(e) => setRenewalForm(prev => ({ ...prev, renewalDate: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1 text-sm"><DollarSign className="h-3 w-3" /> Valor</Label>
                            <div className="flex gap-2 mt-1">
                                <Select value={renewalForm.currency} onValueChange={(v) => setRenewalForm(prev => ({ ...prev, currency: v }))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="€">€</SelectItem>
                                        <SelectItem value="R$">R$</SelectItem>
                                        <SelectItem value="$">$</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input type="number" step="0.01" placeholder="Valor" value={renewalForm.value} onChange={(e) => setRenewalForm(prev => ({ ...prev, value: e.target.value }))} className="flex-1" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-col gap-2">
                        <Button onClick={handleAddRenewal} className="w-full bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
                        <Button variant="outline" onClick={() => setShowRenewalDialog(false)} className="w-full">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contact Dialog */}
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingContactId ? 'Editar Contacto' : 'Adicionar Contacto'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nome *</Label>
                            <Input value={contactForm.name} onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label>Telemóvel</Label>
                            <Input value={contactForm.phone} onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={contactForm.email} onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))} className="mt-1" type="email" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveContact} className="bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Attachment Dialog */}
            <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Anexo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Descrição *</Label>
                            <Input value={attachmentDesc} onChange={(e) => setAttachmentDesc(e.target.value)} className="mt-1" placeholder="Descrição do anexo" />
                        </div>
                        <div>
                            <Label>Arquivo</Label>
                            <Input type="file" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} className="mt-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAttachmentDialog(false)}>Cancelar</Button>
                        <Button onClick={handleAddAttachment} className="bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Store Selection Dialog */}
            <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t('licenses.selectStores')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stores.map(store => (
                            <button
                                key={store.id}
                                onClick={() => toggleTempStore(store.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${tempStoreIds.includes(store.id)
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'bg-card border-border hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{store.name}</span>
                                    {tempStoreIds.includes(store.id) && <CheckCircle className="h-4 w-4 text-primary" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStoreDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveStores} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('common.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LicenseForm;
