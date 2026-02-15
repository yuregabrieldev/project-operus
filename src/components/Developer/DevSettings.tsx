
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
    Key, Mail, Globe, Shield, Save, Plus, Plug, Bell,
    Lock, Database, Download, Clock, Edit, RefreshCw, HardDrive,
    Settings
} from 'lucide-react';

interface ApiKey {
    id: string;
    name: string;
    keyMasked: string;
    active: boolean;
    createdAt: string;
}

interface Integration {
    id: string;
    name: string;
    description: string;
    connected: boolean;
    webhookUrl?: string;
}

const DevSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('apikeys');

    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        { id: '1', name: 'API principal', keyMasked: 'dk_live••••••••7a2f', active: true, createdAt: '2025-10-15' },
        { id: '2', name: 'Webhook secret', keyMasked: 'whsec_••••••••3b4c', active: true, createdAt: '2025-11-01' },
        { id: '3', name: 'API teste', keyMasked: 'dk_test••••••••9d1e', active: false, createdAt: '2026-01-20' },
    ]);

    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: '1', name: 'Stripe', description: 'Processamento de pagamentos', connected: true, webhookUrl: 'https://api.operus.com/webhooks/stripe' },
        { id: '2', name: 'SendGrid', description: 'Envio de emails transacionais', connected: true },
        { id: '3', name: 'AWS S3', description: 'Armazenamento de ficheiros', connected: false },
        { id: '4', name: 'Slack', description: 'Notificações da equipa', connected: false },
    ]);

    const [showAddKey, setShowAddKey] = useState(false);
    const [showEditKey, setShowEditKey] = useState(false);
    const [showAddIntegration, setShowAddIntegration] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newIntName, setNewIntName] = useState('');
    const [newIntDesc, setNewIntDesc] = useState('');
    const [newIntWebhook, setNewIntWebhook] = useState('');

    const [emailTemplate, setEmailTemplate] = useState(
        `Olá {responsavel},\n\nGostaríamos de informar que a fatura referente à loja {loja} do plano {plano} no valor de {valor} encontra-se em atraso desde {data_vencimento}.\n\nPor favor, regularize o pagamento o mais breve possível.\n\nAtenciosamente,\nEquipa Operus`
    );

    // Notification settings
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifPush, setNotifPush] = useState(true);
    const [notifPayment, setNotifPayment] = useState(true);
    const [notifNewBrand, setNotifNewBrand] = useState(true);
    const [notifNewUser, setNotifNewUser] = useState(false);
    const [notifSystem, setNotifSystem] = useState(true);

    // Security settings
    const [twoFA, setTwoFA] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState('30');
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState('8');

    // Backup settings
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFrequency, setBackupFrequency] = useState('daily');

    const backupHistory = [
        { id: '1', date: '14/02/2026 08:00', size: '245 MB', status: 'success' },
        { id: '2', date: '13/02/2026 08:00', size: '243 MB', status: 'success' },
        { id: '3', date: '12/02/2026 08:00', size: '241 MB', status: 'success' },
        { id: '4', date: '11/02/2026 08:00', size: '240 MB', status: 'failed' },
    ];

    const toggleKeyActive = (id: string) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k));
    };

    const toggleIntegration = (id: string) => {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    };

    const handleSave = () => {
        toast({ title: 'Configurações salvas!', description: 'Todas as alterações foram aplicadas.' });
    };

    const handleAddKey = () => {
        if (newKeyName && newKeyValue) {
            const masked = newKeyValue.slice(0, 6) + '••••••••' + newKeyValue.slice(-4);
            setApiKeys(prev => [...prev, { id: Date.now().toString(), name: newKeyName, keyMasked: masked, active: true, createdAt: new Date().toISOString().split('T')[0] }]);
            toast({ title: 'Chave adicionada!', description: `${newKeyName} foi adicionada com sucesso.` });
        }
        setNewKeyName('');
        setNewKeyValue('');
        setShowAddKey(false);
    };

    const handleEditKey = () => {
        if (editingKey) {
            setApiKeys(prev => prev.map(k => k.id === editingKey.id ? { ...k, name: newKeyName || k.name } : k));
            toast({ title: 'Chave atualizada!', description: 'As alterações foram salvas.' });
        }
        setEditingKey(null);
        setNewKeyName('');
        setNewKeyValue('');
        setShowEditKey(false);
    };

    const handleAddIntegration = () => {
        if (newIntName) {
            setIntegrations(prev => [...prev, { id: Date.now().toString(), name: newIntName, description: newIntDesc, connected: false, webhookUrl: newIntWebhook || undefined }]);
            toast({ title: 'Integração adicionada!', description: `${newIntName} foi adicionada.` });
        }
        setNewIntName('');
        setNewIntDesc('');
        setNewIntWebhook('');
        setShowAddIntegration(false);
    };

    const tabs = [
        { id: 'apikeys', label: 'Chaves de API', icon: Key },
        { id: 'integrations', label: 'Integrações', icon: Plug },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'security', label: 'Segurança', icon: Lock },
        { id: 'backup', label: 'Backup', icon: Database },
        { id: 'email', label: 'Templates', icon: Mail },
        { id: 'general', label: 'Geral', icon: Settings },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'apikeys':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Key className="h-5 w-5 text-primary" /> Chaves de API
                                </CardTitle>
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddKey(true)}>
                                    <Plus className="h-3.5 w-3.5" /> Nova Chave
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {apiKeys.map(apiKey => (
                                <div key={apiKey.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{apiKey.name}</p>
                                        <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                                            {apiKey.keyMasked}
                                        </code>
                                        <span className="text-[10px] text-muted-foreground ml-2">Criada: {apiKey.createdAt}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar" onClick={() => { setEditingKey(apiKey); setNewKeyName(apiKey.name); setShowEditKey(true); }}>
                                        <Edit className="h-4 w-4 text-primary" />
                                    </Button>
                                    <Switch checked={apiKey.active} onCheckedChange={() => toggleKeyActive(apiKey.id)} />
                                    <Badge variant="outline" className={apiKey.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                                        {apiKey.active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            case 'integrations':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Plug className="h-5 w-5 text-primary" /> Integrações
                                </CardTitle>
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddIntegration(true)}>
                                    <Plus className="h-3.5 w-3.5" /> Nova Integração
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {integrations.map(integration => (
                                <div key={integration.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                                        <Globe className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{integration.name}</p>
                                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                                    </div>
                                    <Switch checked={integration.connected} onCheckedChange={() => toggleIntegration(integration.id)} />
                                    <Badge variant="outline" className={integration.connected ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                                        {integration.connected ? 'Conectado' : 'Desconectado'}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            case 'notifications':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Bell className="h-5 w-5 text-primary" /> Notificações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Notificações por Email</p>
                                    <p className="text-xs text-muted-foreground">Receber alertas por email</p>
                                </div>
                                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Notificações Push</p>
                                    <p className="text-xs text-gray-500">Receber notificações push no navegador</p>
                                </div>
                                <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Pagamentos atrasados</p>
                                    <p className="text-xs text-gray-500">Alertar quando um pagamento está vencido</p>
                                </div>
                                <Switch checked={notifPayment} onCheckedChange={setNotifPayment} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Novas marcas/lojas</p>
                                    <p className="text-xs text-gray-500">Alertar quando uma nova marca ou loja é solicitada</p>
                                </div>
                                <Switch checked={notifNewBrand} onCheckedChange={setNotifNewBrand} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Novos utilizadores</p>
                                    <p className="text-xs text-gray-500">Alertar quando um novo utilizador é cadastrado</p>
                                </div>
                                <Switch checked={notifNewUser} onCheckedChange={setNotifNewUser} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Alertas do sistema</p>
                                    <p className="text-xs text-gray-500">Alertar sobre erros, quedas e eventos críticos</p>
                                </div>
                                <Switch checked={notifSystem} onCheckedChange={setNotifSystem} />
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'security':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Lock className="h-5 w-5 text-primary" /> Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Autenticação de dois fatores (2FA)</p>
                                    <p className="text-xs text-muted-foreground">Exigir verificação adicional no login</p>
                                </div>
                                <Switch checked={twoFA} onCheckedChange={setTwoFA} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Timeout de sessão</p>
                                    <p className="text-xs text-gray-500">Minutos de inatividade até logout automático</p>
                                </div>
                                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="60">1 hora</SelectItem>
                                        <SelectItem value="120">2 horas</SelectItem>
                                        <SelectItem value="480">8 horas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Forçar troca de senha periódica</p>
                                    <p className="text-xs text-gray-500">Exigir alteração da senha a cada 90 dias</p>
                                </div>
                                <Switch checked={forcePasswordChange} onCheckedChange={setForcePasswordChange} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Comprimento mínimo da senha</p>
                                    <p className="text-xs text-gray-500">Número mínimo de caracteres obrigatório</p>
                                </div>
                                <Select value={minPasswordLength} onValueChange={setMinPasswordLength}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="6">6 chars</SelectItem>
                                        <SelectItem value="8">8 chars</SelectItem>
                                        <SelectItem value="10">10 chars</SelectItem>
                                        <SelectItem value="12">12 chars</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'backup':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Database className="h-5 w-5 text-primary" /> Backup do Sistema
                                </CardTitle>
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: 'Backup iniciado!', description: 'O backup está sendo processado...' })}>
                                    <RefreshCw className="h-3.5 w-3.5" /> Backup Agora
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Backup automático</p>
                                    <p className="text-xs text-muted-foreground">Executar backup automaticamente</p>
                                </div>
                                <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Frequência</p>
                                    <p className="text-xs text-gray-500">Intervalo entre backups automáticos</p>
                                </div>
                                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">A cada hora</SelectItem>
                                        <SelectItem value="daily">Diário</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Backup History */}
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Histórico de Backups
                                </p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-2.5 font-semibold text-muted-foreground">Data/Hora</th>
                                            <th className="text-center p-2.5 font-semibold text-muted-foreground">Tamanho</th>
                                            <th className="text-center p-2.5 font-semibold text-muted-foreground">Status</th>
                                            <th className="text-center p-2.5 font-semibold text-muted-foreground">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {backupHistory.map(b => (
                                            <tr key={b.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2.5">{b.date}</td>
                                                <td className="p-2.5 text-center">{b.size}</td>
                                                <td className="p-2.5 text-center">
                                                    <Badge variant="outline" className={b.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                        {b.status === 'success' ? 'Sucesso' : 'Falhou'}
                                                    </Badge>
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    {b.status === 'success' && (
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Baixar">
                                                            <Download className="h-3.5 w-3.5 text-blue-500" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'email':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Mail className="h-5 w-5 text-primary" /> Template de Email de Cobrança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="outline" className="text-[10px]">{'{responsavel}'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{'{loja}'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{'{plano}'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{'{valor}'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{'{data_vencimento}'}</Badge>
                                <Badge variant="outline" className="text-[10px]">{'{marca}'}</Badge>
                            </div>
                            <textarea
                                value={emailTemplate}
                                onChange={e => setEmailTemplate(e.target.value)}
                                className="w-full min-h-[200px] p-3 text-sm border rounded-lg bg-background font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </CardContent>
                    </Card>
                );
            case 'general':
                return (
                    <Card className="shadow-sm border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="h-5 w-5 text-primary" /> Geral
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Modo de manutenção</p>
                                    <p className="text-xs text-muted-foreground">Bloquear acesso a todos os usuários exceto o desenvolvedor</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Registro de novos usuários</p>
                                    <p className="text-xs text-gray-500">Permitir novos cadastros no sistema</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Aprovação automática de marcas</p>
                                    <p className="text-xs text-gray-500">Aprovar automaticamente novas marcas cadastradas</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Configurações do Desenvolvedor</h1>
                    <p className="text-muted-foreground">Gerencie as configurações da plataforma</p>
                </div>
                <Button className="gap-2" onClick={handleSave}>
                    <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>

            {/* Add API Key Dialog */}
            <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Adicionar Chave de API
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Chave *</Label>
                            <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Ex: API de produção" />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor da Chave *</Label>
                            <Input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="Cole a chave aqui" />
                            <p className="text-[11px] text-muted-foreground">A chave será mascarada após salvar e não poderá ser visualizada novamente.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowAddKey(false); setNewKeyName(''); setNewKeyValue(''); }}>Cancelar</Button>
                        <Button disabled={!newKeyName || !newKeyValue} onClick={handleAddKey} className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit API Key Dialog */}
            <Dialog open={showEditKey} onOpenChange={(open) => { if (!open) { setShowEditKey(false); setEditingKey(null); setNewKeyName(''); setNewKeyValue(''); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" /> Editar Chave de API
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Chave</Label>
                            <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nova Chave (opcional)</Label>
                            <Input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="Deixe vazio para manter a atual" />
                            <p className="text-[11px] text-muted-foreground">Se preenchido, a chave anterior será substituída permanentemente.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowEditKey(false); setEditingKey(null); }}>Cancelar</Button>
                        <Button onClick={handleEditKey} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Integration Dialog */}
            <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plug className="h-5 w-5" /> Adicionar Integração
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Integração *</Label>
                            <Input value={newIntName} onChange={e => setNewIntName(e.target.value)} placeholder="Ex: Twilio" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={newIntDesc} onChange={e => setNewIntDesc(e.target.value)} placeholder="Ex: Envio de SMS" />
                        </div>
                        <div className="space-y-2">
                            <Label>Webhook URL (opcional)</Label>
                            <Input value={newIntWebhook} onChange={e => setNewIntWebhook(e.target.value)} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowAddIntegration(false); setNewIntName(''); setNewIntDesc(''); setNewIntWebhook(''); }}>Cancelar</Button>
                        <Button disabled={!newIntName} onClick={handleAddIntegration} className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DevSettings;
