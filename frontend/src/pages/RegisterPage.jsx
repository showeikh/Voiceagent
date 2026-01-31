import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Mic, ArrowLeft, Loader2, CheckCircle, Building2 } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    tax_number: '',
    vat_id: '',
    website: '',
    industry: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validate step 1
      if (!formData.company_name || !formData.contact_person || !formData.email || !formData.password) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwörter stimmen nicht überein');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Passwort muss mindestens 6 Zeichen lang sein');
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      // Validate step 2
      if (!formData.street || !formData.house_number || !formData.postal_code || !formData.city || !formData.phone) {
        toast.error('Bitte alle Pflichtfelder ausfüllen');
        return;
      }
      setStep(3);
      return;
    }
    
    // Step 3 - Submit
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await axios.post(`${API_URL}/auth/register`, submitData);
      setRegistered(true);
      toast.success('Registrierung erfolgreich!');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-4">
            Registrierung erfolgreich!
          </h1>
          <p className="text-slate-600 mb-8">
            Vielen Dank für Ihre Registrierung. Ihr Konto wird geprüft und Sie erhalten 
            eine Benachrichtigung, sobald es freigeschaltet wurde. Dies dauert in der 
            Regel 1-2 Werktage.
          </p>
          <Link to="/login">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8">
              Zur Anmeldung
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            data-testid="back-home-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>

          <div className="lg:hidden mb-6">
            <div className="w-12 h-12 rounded-xl gradient-voice flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-1 rounded ${
                    step > s ? 'bg-violet-600' : 'bg-slate-100'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft">
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-2">
              {step === 1 && 'Kontodaten'}
              {step === 2 && 'Firmenadresse'}
              {step === 3 && 'Steuerdaten & Abschluss'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {step === 1 && 'Geben Sie Ihre grundlegenden Kontodaten ein'}
              {step === 2 && 'Geben Sie die Firmenadresse ein'}
              {step === 3 && 'Optionale Steuerdaten für die Rechnungsstellung'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Firmenname *</Label>
                    <Input
                      type="text"
                      placeholder="Muster GmbH"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="h-12"
                      data-testid="register-company-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ansprechpartner *</Label>
                    <Input
                      type="text"
                      placeholder="Max Mustermann"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="h-12"
                      data-testid="register-contact-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-Mail *</Label>
                    <Input
                      type="email"
                      placeholder="kontakt@firma.de"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                      data-testid="register-email-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Passwort *</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12"
                        data-testid="register-password-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Passwort bestätigen *</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="h-12"
                        data-testid="register-confirm-password-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Straße *</Label>
                      <Input
                        type="text"
                        placeholder="Musterstraße"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="h-12"
                        data-testid="register-street-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hausnr. *</Label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={formData.house_number}
                        onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                        className="h-12"
                        data-testid="register-house-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>PLZ *</Label>
                      <Input
                        type="text"
                        placeholder="12345"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="h-12"
                        data-testid="register-plz-input"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Stadt *</Label>
                      <Input
                        type="text"
                        placeholder="Berlin"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="h-12"
                        data-testid="register-city-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Land</Label>
                    <Input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="h-12"
                      data-testid="register-country-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon *</Label>
                    <Input
                      type="tel"
                      placeholder="+49 30 12345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12"
                      data-testid="register-phone-input"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Steuernummer</Label>
                    <Input
                      type="text"
                      placeholder="123/456/78901"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      className="h-12"
                      data-testid="register-tax-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>USt-IdNr.</Label>
                    <Input
                      type="text"
                      placeholder="DE123456789"
                      value={formData.vat_id}
                      onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                      className="h-12"
                      data-testid="register-vat-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      type="url"
                      placeholder="https://www.firma.de"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-12"
                      data-testid="register-website-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branche</Label>
                    <Input
                      type="text"
                      placeholder="z.B. IT-Dienstleistungen"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="h-12"
                      data-testid="register-industry-input"
                    />
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-800 mt-4">
                    <p className="font-medium mb-1">Hinweis zur Freischaltung</p>
                    <p>Nach der Registrierung wird Ihr Konto manuell geprüft. Sie erhalten eine Benachrichtigung, sobald es freigeschaltet wurde.</p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Zurück
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                  data-testid="register-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registrieren...
                    </>
                  ) : step < 3 ? (
                    'Weiter'
                  ) : (
                    'Registrieren'
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-slate-600">
              Bereits ein Konto?{' '}
              <Link 
                to="/login" 
                className="text-violet-600 hover:text-violet-700 font-medium"
                data-testid="login-link"
              >
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-violet-600/20 via-purple-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl gradient-voice flex items-center justify-center mb-8">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">
            Für Unternehmen
          </h1>
          <p className="text-lg text-slate-600 max-w-md mb-8">
            Registrieren Sie Ihr Unternehmen und erhalten Sie Zugang zum Voice Agent System.
          </p>
          
          <div className="space-y-4">
            {[
              'KI-Telefonassistent für Ihre Firma',
              '24/7 Erreichbarkeit für Ihre Kunden',
              'Google & Office 365 Kalender-Integration',
              'DSGVO-konforme Datenverarbeitung'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default RegisterPage;
