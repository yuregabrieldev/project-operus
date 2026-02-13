import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
            case 'ativa': return 'bg-green-100 text-green-700 border-green-300';
            case 'expirada': return 'bg-red-100 text-red-700 border-red-300';
            case 'cancelada': return 'bg-gray-100 text-gray-700 border-gray-300';
            case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
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
                <h2 className="text-xl font-bold text-gray-800">
                    {license ? 'Editar os dados da licença' : 'Nova Licença'}
                </h2>
                <Badge className={`${getStatusColor(status)} border ${status === 'expirada' ? 'animate-heartbeat' : ''}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            </div>

            {/* Main data section */}
            <Card className="border border-blue-100">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                            {/* Store */}
                            <div>
                                <Label className="text-xs text-gray-500 font-medium">Lojas*</Label>
                                <p className="text-sm font-semibold text-gray-800">
                                    {storeNames || <span className="text-gray-400">Selecione as lojas</span>}
                                </p>
                            </div>

                            {/* License name */}
                            <div>
                                <Label className="text-xs text-gray-500 font-medium">Licença*</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome da licença"
                                    className="mt-1"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-xs text-gray-500 font-medium">Descrição</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descrição da licença"
                                    className="mt-1 min-h-[60px]"
                                />
                            </div>

                            {/* Periodicity */}
                            <div>
                                <Label className="text-xs text-gray-500 font-medium">Periodicidade*</Label>
                                <Select value={periodicity} onValueChange={(v: License['periodicity']) => setPeriodicity(v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mensal">Mensal</SelectItem>
                                        <SelectItem value="trimestral">Trimestral</SelectItem>
                                        <SelectItem value="semestral">Semestral</SelectItem>
                                        <SelectItem value="anual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Alert days */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mt-2">
                                    A enviar alerta a partir de{' '}
                                    <Input
                                        type="number"
                                        value={alertDays}
                                        onChange={(e) => setAlertDays(e.target.value)}
                                        className="w-16 inline-block mx-1 h-8 text-center"
                                        min="1"
                                    />{' '}
                                    dias
                                </p>
                            </div>
                        </div>

                        <Button variant="outline" onClick={() => { setTempStoreIds(storeIds); setShowStoreDialog(true); }} className="ml-4">
                            Editar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Renewals section */}
            <Card className="border border-blue-100">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Renovações*</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setShowRenewalDialog(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 border-0">
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {renewals.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs"><Calendar className="h-3 w-3 inline mr-1" />Emissão</TableHead>
                                    <TableHead className="text-xs"><Calendar className="h-3 w-3 inline mr-1" />Renovação</TableHead>
                                    <TableHead className="text-xs"><DollarSign className="h-3 w-3 inline mr-1" />Valor</TableHead>
                                    <TableHead className="text-xs w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renewals.map((renewal, i) => {
                                    const isActive = new Date(renewal.renewalDate) > new Date();
                                    return (
                                        <TableRow key={renewal.id}>
                                            <TableCell className="text-sm">{formatDate(renewal.issueDate)}</TableCell>
                                            <TableCell className="text-sm">{formatDate(renewal.renewalDate)}</TableCell>
                                            <TableCell className="text-sm">{renewal.currency}{renewal.value.toFixed(2)}</TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteRenewal(renewal.id)}>
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
                            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Nenhuma renovação adicionada</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contacts section */}
            <Card className="border border-blue-100">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Contactos</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => { setEditingContactId(null); setContactForm({ name: '', phone: '', email: '' }); setShowContactDialog(true); }} className="bg-indigo-600 text-white hover:bg-indigo-700 border-0">
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {contacts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs"><User className="h-3 w-3 inline mr-1" />Nome</TableHead>
                                    <TableHead className="text-xs"><Phone className="h-3 w-3 inline mr-1" />Telemóvel</TableHead>
                                    <TableHead className="text-xs"><Mail className="h-3 w-3 inline mr-1" />Email</TableHead>
                                    <TableHead className="text-xs w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map(contact => (
                                    <TableRow key={contact.id}>
                                        <TableCell className="text-sm">{contact.name}</TableCell>
                                        <TableCell className="text-sm text-gray-500">{contact.phone || '-'}</TableCell>
                                        <TableCell className="text-sm text-gray-500">{contact.email || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteContact(contact.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-500" onClick={() => handleEditContact(contact)}>
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
                            <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Nenhum contacto foi encontrado</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attachments section */}
            <Card className="border border-blue-100">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Anexos</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => { setAttachmentDesc(''); setAttachmentFile(null); setShowAttachmentDialog(true); }} className="bg-indigo-600 text-white hover:bg-indigo-700 border-0">
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {attachments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs"><FileText className="h-3 w-3 inline mr-1" />Descrição</TableHead>
                                    <TableHead className="text-xs"><Calendar className="h-3 w-3 inline mr-1" />Data de Criação</TableHead>
                                    <TableHead className="text-xs w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attachments.map(att => (
                                    <TableRow key={att.id}>
                                        <TableCell className="text-sm">{att.description}</TableCell>
                                        <TableCell className="text-sm text-gray-500">{formatDate(att.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteAttachment(att.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                                {att.file && (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500" onClick={() => handleViewAttachment(att)}>
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
                            <Paperclip className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Nenhum anexo foi encontrado</p>
                            <Button variant="outline" className="mt-3 bg-indigo-600 text-white hover:bg-indigo-700 border-0" onClick={() => { setAttachmentDesc(''); setAttachmentFile(null); setShowAttachmentDialog(true); }}>
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Observations section */}
            <Card className="border border-blue-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Observações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {observations.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {observations.map((obs, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">{obs.user.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">
                                            <span className="font-semibold text-gray-700">{obs.user}:</span>{' '}
                                            <span className="text-gray-600">{obs.text}</span>
                                        </p>
                                        <p className="text-xs text-gray-400">{obs.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={newObservation}
                            onChange={(e) => setNewObservation(e.target.value)}
                            placeholder="Adicionar nova observação"
                            className="flex-1"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddObservation(); }}
                        />
                        <Button onClick={handleAddObservation} className="bg-indigo-600 hover:bg-indigo-700">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                    Voltar
                </Button>
                <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                    {license ? 'Salvar Alterações' : 'Criar Licença'}
                </Button>
                {license && license.status !== 'cancelada' && (
                    <Button variant="destructive" onClick={handleCancel}>
                        Cancelar licença
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
                            <Input type="date" value={renewalForm.issueDate} onChange={(e) => setRenewalForm(prev => ({ ...prev, issueDate: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                            <Label className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" /> Renovação</Label>
                            <Input type="date" value={renewalForm.renewalDate} onChange={(e) => setRenewalForm(prev => ({ ...prev, renewalDate: e.target.value }))} className="mt-1" />
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
                        <DialogTitle>Selecionar Lojas</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stores.map(store => (
                            <button
                                key={store.id}
                                onClick={() => toggleTempStore(store.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${tempStoreIds.includes(store.id)
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{store.name}</span>
                                    {tempStoreIds.includes(store.id) && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStoreDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveStores} className="bg-indigo-600 hover:bg-indigo-700">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LicenseForm;
