import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mic, Calendar, Clock, Shield, ArrowRight, CheckCircle, Stethoscope, Briefcase, Building, Phone, Star, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const LandingPage = () => {
  const benefits = [
    'Nie wieder verpasste Anrufe',
    '24/7 Terminbuchung für Ihre Kunden',
    'Automatische Kalender-Synchronisation',
    'Deutsch und mehrsprachiger Support'
  ];

  const industries = [
    {
      icon: Stethoscope,
      title: 'Arztpraxen & Therapeuten',
      description: 'Patienten buchen Termine rund um die Uhr – auch außerhalb der Sprechzeiten. Entlasten Sie Ihr Praxisteam.',
      examples: ['Hausärzte', 'Zahnärzte', 'Physiotherapeuten', 'Psychologen']
    },
    {
      icon: Briefcase,
      title: 'Freiberufler & Berater',
      description: 'Konzentrieren Sie sich auf Ihre Arbeit. BuchungsButler kümmert sich um Ihre Terminanfragen.',
      examples: ['Anwälte', 'Steuerberater', 'Coaches', 'Architekten']
    },
    {
      icon: Building,
      title: 'Versicherungen & Finanzen',
      description: 'Verpassen Sie keine Kundenanfrage mehr. Automatische Terminvereinbarung für Beratungsgespräche.',
      examples: ['Versicherungsmakler', 'Finanzberater', 'Immobilienmakler', 'Banken']
    },
    {
      icon: Users,
      title: 'Dienstleister & Handwerk',
      description: 'Kunden erreichen Sie telefonisch – auch wenn Sie gerade beim Kunden sind.',
      examples: ['Friseure', 'Kosmetikstudios', 'KFZ-Werkstätten', 'Handwerker']
    }
  ];

  const features = [
    {
      icon: Phone,
      title: 'KI-Telefonassistent',
      description: 'Nimmt Anrufe entgegen, beantwortet Fragen und vereinbart Termine – wie eine echte Mitarbeiterin.'
    },
    {
      icon: Calendar,
      title: 'Kalender-Integration',
      description: 'Verbindet sich mit Google Calendar und Microsoft 365. Termine werden automatisch eingetragen.'
    },
    {
      icon: Clock,
      title: '24/7 Erreichbarkeit',
      description: 'Ihre Kunden können jederzeit anrufen – auch nachts, am Wochenende und an Feiertagen.'
    },
    {
      icon: Shield,
      title: 'DSGVO-konform',
      description: 'Höchste Datensicherheit. Alle Daten werden in Deutschland verarbeitet und gespeichert.'
    }
  ];

  const testimonials = [
    {
      quote: "Seit wir BuchungsButler nutzen, verpassen wir keinen Anruf mehr. Die Patienten sind begeistert.",
      author: "Dr. Sarah M.",
      role: "Hausärztin, München"
    },
    {
      quote: "Endlich kann ich mich auf meine Arbeit konzentrieren. Die Terminvereinbarung läuft automatisch.",
      author: "Thomas K.",
      role: "Steuerberater, Hamburg"
    },
    {
      quote: "Unsere Kunden lieben es, dass sie uns jederzeit erreichen können. Top Service!",
      author: "Lisa W.",
      role: "Versicherungsmaklerin, Berlin"
    }
  ];

  return (
    <>
      <Helmet>
        <title>BuchungsButler – KI-Telefonassistent für Terminbuchungen | Arztpraxen, Freiberufler, Versicherungen</title>
        <meta name="description" content="BuchungsButler ist Ihr intelligenter KI-Telefonassistent. Automatische Terminbuchung für Arztpraxen, Freiberufler und Versicherungsbüros. 24/7 erreichbar, DSGVO-konform." />
        <meta name="keywords" content="KI Telefonassistent, Terminbuchung, Arztpraxis Software, Freiberufler Tools, Versicherungsbüro, automatische Terminvereinbarung, Sprachassistent, Google Calendar Integration, Microsoft 365" />
        <meta property="og:title" content="BuchungsButler – KI-Telefonassistent für automatische Terminbuchungen" />
        <meta property="og:description" content="Nie wieder verpasste Anrufe. BuchungsButler nimmt Anrufe entgegen und vereinbart Termine – 24/7, auch außerhalb der Öffnungszeiten." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://buchungsbutler.de" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "BuchungsButler",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "KI-Telefonassistent für automatische Terminbuchungen",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "description": "Kostenlos testen"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "127"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-voice flex items-center justify-center">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg sm:text-xl text-foreground">BuchungsButler</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 text-sm sm:text-base px-2 sm:px-4" data-testid="nav-login-btn">
                  Anmelden
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-3 sm:px-6 text-sm sm:text-base shadow-glow" data-testid="nav-register-btn">
                  <span className="hidden sm:inline">Kostenlos testen</span>
                  <span className="sm:hidden">Testen</span>
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
                  Für Arztpraxen, Freiberufler & mehr
                </div>
                
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
                  Ihr KI-Telefonassistent für
                  <span className="text-violet-600"> Terminbuchungen</span>
                </h1>
                
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                  BuchungsButler nimmt Anrufe entgegen, beantwortet Fragen und vereinbart Termine – 
                  automatisch, 24/7 und in natürlicher Sprache. Wie eine zusätzliche Mitarbeiterin, die nie krank wird.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link to="/register">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg shadow-glow hover:shadow-glow-lg transition-all hover:scale-105"
                      data-testid="hero-cta-btn"
                    >
                      Kostenlos testen
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
                      Demo ansehen
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
                <div className="relative glass rounded-3xl p-6 sm:p-8 shadow-soft">
                  <img 
                    src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&auto=format&fit=crop&q=80"
                    alt="Ärztin telefoniert mit Patient - BuchungsButler Terminbuchung"
                    className="w-full h-auto rounded-2xl shadow-lg"
                    loading="lazy"
                  />
                  
                  {/* Floating card */}
                  <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 glass rounded-2xl p-3 sm:p-4 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-voice flex items-center justify-center">
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm sm:text-base">Anruf angenommen</p>
                        <p className="text-xs sm:text-sm text-slate-500">"Termin für Montag um 14 Uhr"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white" id="branchen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Perfekt für Ihre Branche
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                BuchungsButler passt sich Ihren Anforderungen an – egal ob Arztpraxis, Kanzlei oder Versicherungsbüro
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {industries.map((industry, index) => (
                <div 
                  key={index}
                  className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-100 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                    <industry.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                    {industry.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {industry.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {industry.examples.map((example, i) => (
                      <span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-slate-500 border border-slate-200">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/50" id="funktionen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                So funktioniert BuchungsButler
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Einfache Einrichtung, leistungsstarke Funktionen
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

        {/* Testimonials Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white" id="erfahrungen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Das sagen unsere Kunden
              </h2>
              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-slate-600">4.9 von 5 Sternen</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-medium text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6" id="preise">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-purple-500/5" />
              <div className="relative">
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 sm:mb-4">
                  Starten Sie jetzt kostenlos
                </h2>
                <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-xl mx-auto">
                  Testen Sie BuchungsButler 14 Tage kostenlos. Keine Kreditkarte erforderlich. 
                  Überzeugen Sie sich selbst.
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
                <p className="mt-4 text-sm text-slate-500">
                  Keine Kreditkarte • Keine Verpflichtung • DSGVO-konform
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg gradient-voice flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-heading font-bold text-slate-900">BuchungsButler</span>
                </div>
                <p className="text-sm text-slate-600">
                  Ihr KI-Telefonassistent für automatische Terminbuchungen.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Branchen</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#branchen" className="hover:text-violet-600">Arztpraxen</a></li>
                  <li><a href="#branchen" className="hover:text-violet-600">Freiberufler</a></li>
                  <li><a href="#branchen" className="hover:text-violet-600">Versicherungen</a></li>
                  <li><a href="#branchen" className="hover:text-violet-600">Dienstleister</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Produkt</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#funktionen" className="hover:text-violet-600">Funktionen</a></li>
                  <li><a href="#preise" className="hover:text-violet-600">Preise</a></li>
                  <li><a href="#erfahrungen" className="hover:text-violet-600">Kundenstimmen</a></li>
                  <li><Link to="/login" className="hover:text-violet-600">Anmelden</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Rechtliches</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-violet-600">Impressum</a></li>
                  <li><a href="#" className="hover:text-violet-600">Datenschutz</a></li>
                  <li><a href="#" className="hover:text-violet-600">AGB</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">
                © 2024 BuchungsButler. Alle Rechte vorbehalten.
              </p>
              <p className="text-slate-500 text-sm">
                Made in Germany 🇩🇪
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
