import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mic, Calendar, Users, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Mic,
      title: 'KI-Sprachassistent',
      description: 'Sprechen Sie natürlich mit dem Assistenten, um Termine zu verwalten und Kalenderinformationen abzurufen.'
    },
    {
      icon: Calendar,
      title: 'Kalender-Integration',
      description: 'Verbinden Sie Google Calendar und Microsoft Office 365 für nahtlose Terminverwaltung.'
    },
    {
      icon: Users,
      title: 'Mandantenfähig',
      description: 'Jeder Mandant hat seinen eigenen sicheren Bereich mit bis zu 2 Benutzern.'
    },
    {
      icon: Shield,
      title: 'Sichere Datenisolierung',
      description: 'Vollständige Trennung der Daten zwischen Mandanten für maximale Sicherheit.'
    }
  ];

  const benefits = [
    'Termine per Sprache erstellen und abfragen',
    'Mehrere Kalender an einem Ort verwalten',
    'Intelligente Verfügbarkeitsprüfung',
    'Deutsch und mehrsprachiger Support'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-voice flex items-center justify-center">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg sm:text-xl text-foreground">VoiceAgent</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-sm sm:text-base px-2 sm:px-4" data-testid="nav-login-btn">
                Anmelden
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-3 sm:px-6 text-sm sm:text-base shadow-glow" data-testid="nav-register-btn">
                <span className="hidden sm:inline">Kostenlos starten</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 gradient-hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-100 text-violet-700 rounded-full text-xs sm:text-sm font-medium">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                KI-gestützte Terminverwaltung
              </div>
              
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
                Termine verwalten mit
                <span className="text-violet-600"> Ihrer Stimme</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                Der intelligente Sprachassistent für Ihre Kalender. Verbinden Sie Google Calendar und Office 365 
                und verwalten Sie Termine einfach per Sprache.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg shadow-glow hover:shadow-glow-lg transition-all hover:scale-105"
                    data-testid="hero-cta-btn"
                  >
                    Jetzt starten
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto rounded-full px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg border-slate-300 hover:bg-slate-50"
                    data-testid="hero-login-btn"
                  >
                    Anmelden
                  </Button>
                </Link>
              </div>
              
              <div className="pt-4 space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 via-purple-500/10 to-transparent rounded-3xl blur-3xl" />
              <div className="relative glass rounded-3xl p-8 shadow-soft">
                <img 
                  src="https://images.unsplash.com/photo-1758876202167-f81c995c3fdc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwdGFsa2luZyUyMG9uJTIwcGhvbmUlMjBtb2Rlcm4lMjBvZmZpY2V8ZW58MHx8fHwxNzY5ODI2MDE0fDA&ixlib=rb-4.1.0&q=85"
                  alt="Professional using voice agent"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
                
                {/* Floating card */}
                <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-lg animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-voice flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Sprachbefehl erkannt</p>
                      <p className="text-sm text-slate-500">"Termin am Montag um 14 Uhr"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Alles was Sie brauchen
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Ein vollständiges Ökosystem für intelligente Terminverwaltung per Sprache
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-soft hover-lift"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
                </div>
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-soft relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-purple-500/5" />
            <div className="relative">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 sm:mb-4">
                Bereit für intelligente Terminverwaltung?
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-xl mx-auto">
                Starten Sie kostenlos und erleben Sie, wie einfach Terminverwaltung per Sprache sein kann.
              </p>
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 sm:px-10 h-12 sm:h-14 text-base sm:text-lg shadow-glow hover:shadow-glow-lg transition-all hover:scale-105"
                  data-testid="cta-register-btn"
                >
                  Kostenlos registrieren
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-voice flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-slate-900">VoiceAgent</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 VoiceAgent. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
