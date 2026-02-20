import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Sparkles,
  Globe
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
  const { t, language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const languageLabels: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español'
  };
  const languageFlags: Record<string, string> = {
    pt: '🇵🇹',
    en: '🇺🇸',
    es: '🇪🇸'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      toast({
        title: t('landing.loginSuccessTitle'),
        description: t('landing.loginSuccessDesc'),
      });
      setIsLoginOpen(false);
    } else {
      toast({
        title: t('landing.loginErrorTitle'),
        description: result.error || t('landing.loginErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.brandName.trim()) {
      toast({ title: t('landing.requiredFieldTitle'), description: t('landing.requiredBrand'), variant: "destructive" });
      return;
    }
    if (!registerForm.storesRange) {
      toast({ title: t('landing.requiredFieldTitle'), description: t('landing.requiredStores'), variant: "destructive" });
      return;
    }
    setRegisterRequestLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('registration_requests').insert({
        name: registerForm.name.trim(),
        email: registerForm.email.trim().toLowerCase(),
        phone: (registerForm.phone || '').trim() || null,
        brand_name: registerForm.brandName.trim(),
        stores_range: registerForm.storesRange || null,
      });
      if (error) throw error;
      setRegisterRequestSent(true);
      setRegisterForm({ name: '', email: '', phone: '', brandName: '', storesRange: '' });
    } catch (err: any) {
      const msg = err?.message || err?.error_description || t('landing.sendErrorDesc');
      toast({
        title: t('landing.sendErrorTitle'),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setRegisterRequestLoading(false);
    }
  };

  const features = [
    { icon: Package, titleKey: 'landing.featureInventory', descKey: 'landing.featureInventoryDesc' },
    { icon: BarChart3, titleKey: 'landing.featureDashboard', descKey: 'landing.featureDashboardDesc' },
    { icon: Truck, titleKey: 'landing.featureTransit', descKey: 'landing.featureTransitDesc' },
    { icon: FileText, titleKey: 'landing.featureInvoices', descKey: 'landing.featureInvoicesDesc' },
    { icon: Users, titleKey: 'landing.featureTeam', descKey: 'landing.featureTeamDesc' },
    { icon: Shield, titleKey: 'landing.featureSecurity', descKey: 'landing.featureSecurityDesc' },
  ];

  const testimonials = [
    { nameKey: 'landing.testimonial1Name', roleKey: 'landing.testimonial1Role', contentKey: 'landing.testimonial1Content', rating: 5 },
    { nameKey: 'landing.testimonial2Name', roleKey: 'landing.testimonial2Role', contentKey: 'landing.testimonial2Content', rating: 5 },
    { nameKey: 'landing.testimonial3Name', roleKey: 'landing.testimonial3Role', contentKey: 'landing.testimonial3Content', rating: 5 },
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
                {t('landing.navFeatures')}
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t('landing.navTestimonials')}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t('landing.navPricing')}
              </a>
            </nav>

            {/* Desktop: Globe language dropdown + Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title={t('landing.language')}
                  aria-label={t('landing.language')}
                >
                  <Globe className="h-5 w-5" />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {(['pt', 'en', 'es'] as const).map((lang2) => (
                      <button
                        key={lang2}
                        type="button"
                        onClick={() => {
                          setLanguage(lang2);
                          setShowLangMenu(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors text-left ${language === lang2 ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                      >
                        <span className="text-base">{languageFlags[lang2]}</span>
                        <span>{languageLabels[lang2]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">{t('landing.login')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('landing.loginTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('landing.loginDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">{t('landing.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={t('landing.emailPlaceholder')}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">{t('landing.password')}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder={t('landing.passwordPlaceholder')}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p>{t('landing.loginHint')}</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('landing.loginSubmitting') : t('landing.loginSubmit')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) setRegisterRequestSent(false); }}>
                <DialogTrigger asChild>
                  <Button>{t('landing.register')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('landing.createAccountTitle')}</DialogTitle>
                    {!registerRequestSent && (
                      <DialogDescription>
                        {t('landing.createAccountDescription')}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  {registerRequestSent ? (
                    <div className="py-6 text-center space-y-4">
                      <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
                      <p className="text-lg font-medium text-gray-900">
                        {t('landing.requestSentTitle')}
                      </p>
                      <p className="text-gray-600">
                        {t('landing.requestSentMessage')}
                      </p>
                      <Button type="button" variant="outline" onClick={() => { setIsRegisterOpen(false); setRegisterRequestSent(false); }}>
                        {t('landing.close')}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterRequest} className="space-y-4">
                      <div>
                        <Label htmlFor="register-name">{t('landing.name')}</Label>
                        <Input
                          id="register-name"
                          placeholder={t('landing.namePlaceholder')}
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-email">{t('landing.email')}</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder={t('landing.emailPlaceholder')}
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-phone">{t('landing.phoneLabel')}</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder={t('landing.phonePlaceholder')}
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-brand">{t('landing.brandName')}</Label>
                        <Input
                          id="register-brand"
                          placeholder={t('landing.brandPlaceholder')}
                          value={registerForm.brandName}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, brandName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-stores">{t('landing.storesCount')}</Label>
                        <Select value={registerForm.storesRange} onValueChange={(v) => setRegisterForm(prev => ({ ...prev, storesRange: v }))}>
                          <SelectTrigger id="register-stores" aria-required="true">
                            <SelectValue placeholder={t('landing.storesPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">{t('landing.stores1_5')}</SelectItem>
                            <SelectItem value="5-10">{t('landing.stores5_10')}</SelectItem>
                            <SelectItem value="10+">{t('landing.stores10plus')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={registerRequestLoading}>
                        {registerRequestLoading ? t('landing.registerSubmitting') : t('landing.createAccountSubmit')}
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
              <div className="flex gap-1 mb-4">
                {(['pt', 'en', 'es'] as const).map((lang) => (
                  <button key={lang} type="button" onClick={() => setLanguage(lang)} className={`px-2 py-1 text-sm rounded ${language === lang ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-100'}`}>{lang.toUpperCase()}</button>
                ))}
              </div>
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600">
                  {t('landing.navFeatures')}
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600">
                  {t('landing.navTestimonials')}
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600">
                  {t('landing.navPricing')}
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                    {t('landing.login')}
                  </Button>
                  <Button onClick={() => setIsRegisterOpen(true)}>
                    {t('landing.register')}
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
              {t('landing.heroTitle')}
              <span className="text-blue-600"> {t('landing.heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => setIsRegisterOpen(true)}>
                {t('landing.heroCta')}
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
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{t(feature.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t(feature.descKey)}
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
              {t('landing.testimonialsTitle')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.testimonialsSubtitle')}
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
                  <p className="text-gray-600 mb-4 italic">&quot;{t(testimonial.contentKey)}&quot;</p>
                  <div>
                    <p className="font-semibold text-gray-900">{t(testimonial.nameKey)}</p>
                    <p className="text-sm text-gray-500">{t(testimonial.roleKey)}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('landing.pricingTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">{t('landing.pricingSubtitle')}</p>

            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>{t('landing.monthly')}</span>
              <button type="button" onClick={() => setIsAnnual(!isAnnual)} className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${isAnnual ? 'translate-x-7' : ''}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>{t('landing.annual')}</span>
              {isAnnual && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('landing.saveBadge')}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative hover:shadow-xl transition-all border-2 border-gray-200">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{t('landing.planStarter')}</CardTitle>
                <CardDescription className="text-gray-500">{t('landing.planStarterDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">€{isAnnual ? '26,50' : '29'}</span>
                  <span className="text-gray-500">{isAnnual ? t('landing.perMonthAnnual') : t('landing.perMonth')}</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureInventory')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureDashboard')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureInvoices')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureTransit')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureTeamShort')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.featureCash')}</span></li>
                </ul>
                <Button className="w-full" variant="outline" size="lg" onClick={() => { setSubscribePlan('Starter'); setShowSubscribe(true); setSubscribeSuccess(false); }}>
                  {t('landing.subscribeStarter')}
                </Button>
              </CardContent>
            </Card>

            <Card className="relative hover:shadow-xl transition-all border-2 border-blue-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1 gap-1"><Sparkles className="h-3 w-3" /> {t('landing.popular')}</Badge>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{t('landing.planBusiness')}</CardTitle>
                <CardDescription className="text-gray-500">{t('landing.planBusinessDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">€{isAnnual ? '32' : '35'}</span>
                  <span className="text-gray-500">{isAnnual ? t('landing.perMonthAnnual') : t('landing.perMonth')}</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.allStarter')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" /><span className="font-semibold text-blue-700">{t('landing.featureWaste')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" /><span className="font-semibold text-blue-700">{t('landing.featureProduction')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.advancedReports')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.prioritySupport')}</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>{t('landing.advancedIntegrations')}</span></li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => { setSubscribePlan('Business'); setShowSubscribe(true); setSubscribeSuccess(false); }}>
                  {t('landing.subscribeBusiness')}
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
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('landing.ctaSubtitle')}
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => setIsRegisterOpen(true)}>
            {t('landing.heroCta')}
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
              {t('landing.footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
      {/* Subscribe Dialog */}
      <Dialog open={showSubscribe} onOpenChange={(open) => { if (!open) { setShowSubscribe(false); setSubscribeSuccess(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" /> {t('landing.subscribeTitle')} {subscribePlan}
            </DialogTitle>
            <DialogDescription>
              {t('landing.subscribeDescription')}
            </DialogDescription>
          </DialogHeader>
          {subscribeSuccess ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('landing.subscribeSuccessTitle')}</h3>
              <p className="text-gray-600 text-sm">{t('landing.subscribeSuccessMessage', { plan: subscribePlan })}</p>
              <Button className="mt-6" onClick={() => { setShowSubscribe(false); setSubscribeSuccess(false); }}>{t('landing.subscribeClose')}</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>{t('landing.subscribeName')}</Label>
                <Input placeholder={t('landing.namePlaceholder')} value={subscribeForm.name} onChange={e => setSubscribeForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>{t('landing.email')} *</Label>
                <Input type="email" placeholder={t('landing.emailPlaceholder')} value={subscribeForm.email} onChange={e => setSubscribeForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>{t('landing.subscribePhone')}</Label>
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
                  <Input className="flex-1" placeholder={t('landing.phonePlaceholder')} value={subscribeForm.phone} onChange={e => setSubscribeForm(p => ({ ...p, phone: e.target.value }))} />
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
                {t('landing.subscribeSubmit')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
