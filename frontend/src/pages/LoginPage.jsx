import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Mic, ArrowLeft, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Erfolgreich angemeldet!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl gradient-voice flex items-center justify-center mb-8">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">
            Willkommen zurück
          </h1>
          <p className="text-lg text-slate-600 max-w-md">
            Melden Sie sich an, um Ihre Termine per Sprache zu verwalten und Ihre Kalender im Blick zu behalten.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-40 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
            data-testid="back-home-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>

          <div className="lg:hidden mb-8">
            <div className="w-12 h-12 rounded-xl gradient-voice flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              Willkommen zurück
            </h1>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft">
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-6">
              Anmelden
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  data-testid="login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  data-testid="login-password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-glow transition-all hover:shadow-glow-lg"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Anmelden...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-slate-600">
              Noch kein Konto?{' '}
              <Link 
                to="/register" 
                className="text-violet-600 hover:text-violet-700 font-medium"
                data-testid="register-link"
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
