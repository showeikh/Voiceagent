import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Clock, XCircle, AlertTriangle, LogOut } from 'lucide-react';

const PendingApproval = ({ status = 'pending' }) => {
  const { logout } = useAuth();

  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'Freischaltung ausstehend',
      description: 'Ihr Konto wird derzeit geprüft. Sie erhalten eine Benachrichtigung per E-Mail, sobald Ihr Zugang freigeschaltet wurde. Dies dauert in der Regel 1-2 Werktage.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    rejected: {
      icon: XCircle,
      title: 'Registrierung abgelehnt',
      description: 'Leider wurde Ihre Registrierung abgelehnt. Bitte kontaktieren Sie unseren Support für weitere Informationen.',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    suspended: {
      icon: AlertTriangle,
      title: 'Konto gesperrt',
      description: 'Ihr Konto wurde vorübergehend gesperrt. Bitte kontaktieren Sie unseren Support für weitere Informationen.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-2xl ${config.bgColor} flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${config.color}`} />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 mb-4">
          {config.title}
        </h1>
        <p className="text-slate-600 mb-8">
          {config.description}
        </p>
        <div className="flex flex-col gap-3">
          <a href="mailto:support@voiceagent.de">
            <Button variant="outline" className="w-full">
              Support kontaktieren
            </Button>
          </a>
          <Button 
            onClick={logout}
            variant="ghost"
            className="w-full text-slate-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
