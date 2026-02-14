
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
    Settings, Key, Mail, Globe, Shield, Eye, EyeOff, Save,
    Plus, Trash2, Plug, FileText
} from 'lucide-react';

interface ApiKey {
    id: string;
    name: string;
    key: string;
    active: boolean;
}

interface Integration {
    id: string;
    name: string;
    description: string;
    connected: boolean;
}

const DevSettings: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        { id: '1', name: 'API principal', key: 'demo_live_0001_placeholder_key', active: true },
        { id: '2', name: 'Webhook secret', key: 'demo_webhook_0002_placeholder', active: true },
        { id: '3', name: 'API teste', key: 'demo_test_0003_placeholder_key', active: false },
    ]);

    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: '1', name: 'Stripe', description: 'Processamento de pagamentos', connected: true },
        { id: '2', name: 'SendGrid', description: 'Envio de emails transacionais', connected: true },
        { id: '3', name: 'AWS S3', description: 'Armazenamento de ficheiros', connected: false },
        { id: '4', name: 'Slack', description: 'Notificações da equipa', connected: false },
    ]);

    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [emailTemplate, setEmailTemplate] = useState(
        `Olá {responsavel},\n\nGostaríamos de informar que a fatura referente à loja {loja} do plano {plano} no valor de {valor} encontra-se em atraso desde {data_vencimento}.\n\nPor favor, regularize o pagamento o mais breve possível.\n\nAtenciosamente,\nEquipa Operus`
    );

    const maskKey = (key: string) => key.slice(0, 7) + '•'.repeat(key.length - 11) + key.slice(-4);

    const toggleKeyVisibility = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleKeyActive = (id: string) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k));
    };

    const toggleIntegration = (id: string) => {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    };

    const handleSave = () => {
        toast({ title: 'Configurações salvas!', description: 'Todas as alterações foram aplicadas.' });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Desenvolvedor</h1>
                <Button className="gap-2" onClick={handleSave}>
                    <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
            </div>

            {/* API Keys */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="h-5 w-5 text-amber-600" /> Chaves de API
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {apiKeys.map(apiKey => (
                        <div key={apiKey.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <p className="text-sm font-medium">{apiKey.name}</p>
                                <code className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                                    {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                                </code>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleKeyVisibility(apiKey.id)}>
                                {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Switch checked={apiKey.active} onCheckedChange={() => toggleKeyActive(apiKey.id)} />
                            <Badge variant="outline" className={apiKey.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                                {apiKey.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-2 mt-2">
                        <Plus className="h-3.5 w-3.5" /> Gerar Nova Chave
                    </Button>
                </CardContent>
            </Card>

            {/* Integrations */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plug className="h-5 w-5 text-blue-600" /> Integrações
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {integrations.map(integration => (
                        <div key={integration.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                                <Globe className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{integration.name}</p>
                                <p className="text-xs text-gray-500">{integration.description}</p>
                            </div>
                            <Switch checked={integration.connected} onCheckedChange={() => toggleIntegration(integration.id)} />
                            <Badge variant="outline" className={integration.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                                {integration.connected ? 'Conectado' : 'Desconectado'}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Email Template */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="h-5 w-5 text-purple-600" /> Template de Email de Cobrança
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
                        className="w-full min-h-[200px] p-3 text-sm border rounded-lg bg-white font-mono resize-y focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                </CardContent>
            </Card>

            {/* General Settings */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-5 w-5 text-emerald-600" /> Geral
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Modo de manutenção</p>
                            <p className="text-xs text-gray-500">Bloquear acesso a todos os usuários exceto o desenvolvedor</p>
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
        </div>
    );
};

export default DevSettings;
