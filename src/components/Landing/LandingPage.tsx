
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  Package,
  Truck,
  FileText,
  Shield,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  Phone,
  Sparkles
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const LandingPage: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', brandName: '', storesRange: '' });
  const [registerRequestLoading, setRegisterRequestLoading] = useState(false);
  const [registerRequestSent, setRegisterRequestSent] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribePlan, setSubscribePlan] = useState('');
  const [subscribeForm, setSubscribeForm] = useState({ name: '', email: '', phone: '', countryCode: '+351' });
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const { login, loading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginForm.email, loginForm.password);

    if (success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Operus",
      });
      setIsLoginOpen(false);
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.brandName.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o nome da sua marca.", variant: "destructive" });
      return;
    }
    if (!registerForm.storesRange) {
      toast({ title: "Campo obrigatório", description: "Selecione a quantidade de lojas.", variant: "destructive" });
      return;
    }
    setRegisterRequestLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('registration_requests').insert({
        name: registerForm.name.trim(),
        email: registerForm.email.trim().toLowerCase(),
        phone: (registerForm.phone || '').trim(),
        brand_name: (registerForm.brandName || '').trim(),
        stores_range: registerForm.storesRange || null,
      });
      if (error) throw error;
      setRegisterRequestSent(true);
      setRegisterForm({ name: '', email: '', phone: '', brandName: '', storesRange: '' });
    } catch {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRegisterRequestLoading(false);
    }
  };

  const features = [
    {
      icon: Package,
      title: "Gestão de Estoque",
      description: "Controle completo do seu inventário com alertas automáticos de estoque baixo"
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize métricas importantes e tome decisões baseadas em dados"
    },
    {
      icon: Truck,
      title: "Trânsito de Produtos",
      description: "Gerencie transferências entre lojas e acompanhe entregas"
    },
    {
      icon: FileText,
      title: "Gestão de Faturas",
      description: "Controle de notas fiscais e documentos fiscais centralizados"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Controle de acesso e permissões para diferentes níveis de usuário"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Dados protegidos com criptografia e backups automáticos"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Gerente de Loja",
      content: "O Operus revolucionou nossa gestão. Economizamos 3 horas por dia só no controle de estoque.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Proprietário",
      content: "Interface intuitiva e funcionalidades completas. Recomendo para qualquer negócio.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Supervisora",
      content: "O melhor sistema que já usei. Suporte excelente e atualizações constantes.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/operus-logo.png" alt="OPERUS" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-gray-900">OPERUS</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Funcionalidades
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                Depoimentos
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                Preços
              </a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex space-x-4">
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">Entrar</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Entrar no Operus</DialogTitle>
                    <DialogDescription>
                      Digite suas credenciais para acessar o sistema
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p>Use o email e senha da sua conta para entrar.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) setRegisterRequestSent(false); }}>
                <DialogTrigger asChild>
                  <Button>Cadastrar</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Conta</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para solicitar acesso. Nossa equipe entrará em contato.
                    </DialogDescription>
                  </DialogHeader>
                  {registerRequestSent ? (
                    <div className="py-6 text-center space-y-4">
                      <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
                      <p className="text-lg font-medium text-gray-900">
                        Solicitação enviada!
                      </p>
                      <p className="text-gray-600">
                        Em breve a nossa equipe entrará em contato.
                      </p>
                      <Button type="button" variant="outline" onClick={() => { setIsRegisterOpen(false); setRegisterRequestSent(false); }}>
                        Fechar
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterRequest} className="space-y-4">
                      <div>
                        <Label htmlFor="register-name">Nome</Label>
                        <Input
                          id="register-name"
                          placeholder="Seu nome completo"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-phone">Telefone para contato</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="+351 912 345 678"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-brand">Nome da sua marca</Label>
                        <Input
                          id="register-brand"
                          placeholder="Ex: Minha Marca"
                          value={registerForm.brandName}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, brandName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-stores">Quantidade de lojas</Label>
                        <Select value={registerForm.storesRange} onValueChange={(v) => setRegisterForm(prev => ({ ...prev, storesRange: v }))}>
                          <SelectTrigger id="register-stores" aria-required="true">
                            <SelectValue placeholder="Selecione a quantidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1 - 5 lojas</SelectItem>
                            <SelectItem value="5-10">5 - 10 lojas</SelectItem>
                            <SelectItem value="10+">10+ lojas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={registerRequestLoading}>
                        {registerRequestLoading ? "Enviando..." : "Criar Conta"}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600">
                  Funcionalidades
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600">
                  Depoimentos
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600">
                  Preços
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                    Entrar
                  </Button>
                  <Button onClick={() => setIsRegisterOpen(true)}>
                    Cadastrar
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Gerencie seu negócio com
              <span className="text-blue-600"> inteligência</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              O Operus é a solução completa para gestão de estoque, vendas e operações.
              Simplifique processos, economize tempo e aumente seus lucros.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => setIsRegisterOpen(true)}>
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio em uma única plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Empresas de todos os tamanhos confiam no Operus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planos & Preços</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">Escolha o plano ideal para o seu negócio</p>

            {/* Annual toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
              <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${isAnnual ? 'translate-x-7' : ''}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Anual</span>
              {isAnnual && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Poupe ~9%</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <Card className="relative hover:shadow-xl transition-all border-2 border-gray-200">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription className="text-gray-500">Para pequenos negócios</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">€{isAnnual ? '26,50' : '29'}</span>
                  <span className="text-gray-500">/{isAnnual ? 'mês (faturado anualmente)' : 'mês'}</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Gestão de Estoque</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Dashboard Inteligente</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Gestão de Faturas</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Trânsito de Produtos</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Gestão de Equipa</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Gestão de Caixa</span></li>
                </ul>
                <Button className="w-full" variant="outline" size="lg" onClick={() => { setSubscribePlan('Starter'); setShowSubscribe(true); setSubscribeSuccess(false); }}>
                  Subscrever Starter
                </Button>
              </CardContent>
            </Card>

            {/* Business */}
            <Card className="relative hover:shadow-xl transition-all border-2 border-blue-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1 gap-1"><Sparkles className="h-3 w-3" /> Popular</Badge>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Business</CardTitle>
                <CardDescription className="text-gray-500">Para crescimento acelerado</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">€{isAnnual ? '32' : '35'}</span>
                  <span className="text-gray-500">/{isAnnual ? 'mês (faturado anualmente)' : 'mês'}</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Tudo do Starter</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" /><span className="font-semibold text-blue-700">Gestão de Desperdício</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" /><span className="font-semibold text-blue-700">Gestão de Produção</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Relatórios avançados</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Suporte prioritário</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Integrações avançadas</span></li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => { setSubscribePlan('Business'); setShowSubscribe(true); setSubscribeSuccess(false); }}>
                  Subscrever Business
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de empresas que já usam o Operus para crescer
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => setIsRegisterOpen(true)}>
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img src="/operus-logo.png" alt="OPERUS" className="h-8 w-8 object-contain brightness-0 invert" />
              <span className="text-xl font-bold text-white">OPERUS</span>
            </div>
            <p className="text-gray-400">
              © 2024 OPERUS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
      {/* Subscribe Dialog */}
      <Dialog open={showSubscribe} onOpenChange={(open) => { if (!open) { setShowSubscribe(false); setSubscribeSuccess(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" /> Subscrever Plano {subscribePlan}
            </DialogTitle>
            <DialogDescription>
              Preencha os seus dados de contacto para solicitar a subscrição.
            </DialogDescription>
          </DialogHeader>
          {subscribeSuccess ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pedido Recebido!</h3>
              <p className="text-gray-600 text-sm">Obrigado pelo interesse no plano <strong>{subscribePlan}</strong>. A nossa equipa irá entrar em contacto consigo em breve.</p>
              <Button className="mt-6" onClick={() => { setShowSubscribe(false); setSubscribeSuccess(false); }}>Fechar</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Seu nome completo" value={subscribeForm.name} onChange={e => setSubscribeForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" placeholder="seu@email.com" value={subscribeForm.email} onChange={e => setSubscribeForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone *</Label>
                <div className="flex gap-2">
                  <Select value={subscribeForm.countryCode} onValueChange={v => setSubscribeForm(p => ({ ...p, countryCode: v }))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+351">🇵🇹 +351</SelectItem>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+33">🇫🇷 +33</SelectItem>
                      <SelectItem value="+49">🇩🇪 +49</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="flex-1" placeholder="912 345 678" value={subscribeForm.phone} onChange={e => setSubscribeForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!subscribeForm.name || !subscribeForm.email || !subscribeForm.phone}
                onClick={() => {
                  setSubscribeSuccess(true);
                  setSubscribeForm({ name: '', email: '', phone: '', countryCode: '+351' });
                }}
              >
                Enviar Pedido de Subscrição
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
