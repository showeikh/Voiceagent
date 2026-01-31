import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CalendarConnections = () => {
  const { getAuthHeaders } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    email: '',
    access_token: '',
    refresh_token: '',
    expires_at: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCalendars = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/calendars`, {
        headers: getAuthHeaders()
      });
      setCalendars(res.data);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      toast.error('Kalender konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.provider || !formData.email || !formData.access_token) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/calendars`, {
        provider: formData.provider,
        email: formData.email,
        access_token: formData.access_token,
        refresh_token: formData.refresh_token || null,
        expires_at: formData.expires_at || new Date(Date.now() + 3600000).toISOString()
      }, {
        headers: getAuthHeaders()
      });

      toast.success('Kalender erfolgreich verbunden!');
      setDialogOpen(false);
      setFormData({ provider: '', email: '', access_token: '', refresh_token: '', expires_at: '' });
      fetchCalendars();
    } catch (error) {
      console.error('Failed to add calendar:', error);
      toast.error('Kalender konnte nicht verbunden werden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (calendarId) => {
    if (!window.confirm('Kalender-Verbindung wirklich entfernen?')) return;

    try {
      await axios.delete(`${API_URL}/calendars/${calendarId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Kalender-Verbindung entfernt');
      fetchCalendars();
    } catch (error) {
      console.error('Failed to delete calendar:', error);
      toast.error('Kalender konnte nicht entfernt werden');
    }
  };

  const getProviderIcon = (provider) => {
    if (provider === 'google') {
      return (
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.617 0 3.082.587 4.229 1.555l3.129-3.129A11.932 11.932 0 0 0 12 0C7.388 0 3.391 2.597 1.25 6.416l3.637 2.828A7.125 7.125 0 0 1 12 5z"/>
            <path fill="#4285F4" d="M23.787 12.261c0-.797-.067-1.564-.193-2.304H12v4.358h6.625a5.665 5.665 0 0 1-2.462 3.714l3.767 2.924c2.198-2.027 3.467-5.012 3.467-8.692z"/>
            <path fill="#FBBC05" d="M4.887 14.244A7.125 7.125 0 0 1 4.875 12c0-.781.133-1.535.38-2.244L1.618 6.928A11.925 11.925 0 0 0 0 12c0 1.923.465 3.736 1.25 5.334l3.637-3.09z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.956-1.076 7.94-2.914l-3.767-2.924a7.125 7.125 0 0 1-10.653-3.733l-3.637 2.828C3.88 21.403 7.625 24 12 24z"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M11.5 0H0v11.5h11.5V0zM24 0H12.5v11.5H24V0zM11.5 12.5H0V24h11.5V12.5zM24 12.5H12.5V24H24V12.5z"/>
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="calendar-loading">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="calendar-connections-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Kalender-Verbindungen
          </h1>
          <p className="text-slate-600 mt-1">
            Verbinden Sie Ihre Google- und Microsoft-Kalender
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 shadow-glow"
              data-testid="add-calendar-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              Kalender verbinden
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Kalender verbinden</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label>Anbieter</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger className="h-12" data-testid="provider-select">
                    <SelectValue placeholder="Wählen Sie einen Anbieter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="microsoft">Microsoft Office 365</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>E-Mail-Adresse des Kalenders</Label>
                <Input
                  type="email"
                  placeholder="kalender@beispiel.de"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12"
                  data-testid="calendar-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  type="text"
                  placeholder="OAuth Access Token"
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  className="h-12"
                  data-testid="access-token-input"
                />
                <p className="text-xs text-slate-500">
                  Den Access Token erhalten Sie über die OAuth-Authentifizierung des jeweiligen Anbieters.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Refresh Token (optional)</Label>
                <Input
                  type="text"
                  placeholder="OAuth Refresh Token"
                  value={formData.refresh_token}
                  onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                  className="h-12"
                  data-testid="refresh-token-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                  data-testid="save-calendar-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verbinden...
                    </>
                  ) : (
                    'Verbinden'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-violet-50 border-violet-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-slate-900 mb-1">
              Kalender-Integration
            </h3>
            <p className="text-sm text-slate-600">
              Um einen Kalender zu verbinden, benötigen Sie OAuth-Zugangsdaten (Access Token) von Google oder Microsoft.
              Diese erhalten Sie über die jeweilige Entwicklerkonsole.
            </p>
            <div className="flex gap-4 mt-3">
              <a 
                href="https://developers.google.com/calendar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
              >
                Google Calendar API <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://learn.microsoft.com/en-us/graph/overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
              >
                Microsoft Graph API <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar List */}
      {calendars.length === 0 ? (
        <Card className="p-12 bg-white border border-slate-100 shadow-soft text-center" data-testid="no-calendars">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-heading font-semibold text-slate-900 mb-2">
            Keine Kalender verbunden
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Verbinden Sie Ihren ersten Kalender, um Termine per Sprache zu verwalten.
          </p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ersten Kalender verbinden
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4" data-testid="calendar-list">
          {calendars.map((calendar) => (
            <Card 
              key={calendar.id}
              className="p-5 bg-white border border-slate-100 shadow-soft hover-lift"
              data-testid={`calendar-item-${calendar.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getProviderIcon(calendar.provider)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">
                        {calendar.provider === 'google' ? 'Google Calendar' : 'Microsoft Office 365'}
                      </h3>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-500">{calendar.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(calendar.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  data-testid={`delete-calendar-${calendar.id}`}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarConnections;
