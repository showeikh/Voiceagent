import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Clock,
  Loader2,
  CalendarIcon
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Appointments = () => {
  const { getAuthHeaders } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    calendar_provider: 'local'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/appointments`, {
        headers: getAuthHeaders()
      });
      setAppointments(res.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Termine konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const startTime = `${dateStr}T${formData.startTime}:00Z`;
    const endTime = `${dateStr}T${formData.endTime}:00Z`;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/appointments`, {
        title: formData.title,
        description: formData.description || null,
        start_time: startTime,
        end_time: endTime,
        calendar_provider: formData.calendar_provider
      }, {
        headers: getAuthHeaders()
      });

      toast.success('Termin erfolgreich erstellt!');
      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        date: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        calendar_provider: 'local'
      });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast.error('Termin konnte nicht erstellt werden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Termin wirklich löschen?')) return;

    try {
      await axios.delete(`${API_URL}/appointments/${appointmentId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Termin gelöscht');
      fetchAppointments();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      toast.error('Termin konnte nicht gelöscht werden');
    }
  };

  const formatDateTime = (isoString) => {
    try {
      const date = parseISO(isoString);
      return format(date, 'dd. MMM yyyy, HH:mm', { locale: de });
    } catch {
      return isoString;
    }
  };

  const getProviderLabel = (provider) => {
    switch (provider) {
      case 'google': return 'Google Calendar';
      case 'microsoft': return 'Office 365';
      default: return 'Lokal';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="appointments-loading">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="appointments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Termine
          </h1>
          <p className="text-slate-600 mt-1">
            Verwalten Sie Ihre Termine und Meetings
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 shadow-glow"
              data-testid="add-appointment-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              Neuer Termin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Neuen Termin erstellen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  type="text"
                  placeholder="Termin-Titel"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12"
                  data-testid="appointment-title-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  placeholder="Optionale Beschreibung"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none"
                  rows={3}
                  data-testid="appointment-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Datum *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-normal"
                      data-testid="date-picker-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: de }) : 'Datum wählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      locale={de}
                      data-testid="date-calendar"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startzeit *</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="h-12"
                    data-testid="start-time-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endzeit *</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="h-12"
                    data-testid="end-time-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kalender</Label>
                <Select
                  value={formData.calendar_provider}
                  onValueChange={(value) => setFormData({ ...formData, calendar_provider: value })}
                >
                  <SelectTrigger className="h-12" data-testid="calendar-provider-select">
                    <SelectValue placeholder="Kalender wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Lokal (BuchungsButler)</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="microsoft">Microsoft Office 365</SelectItem>
                  </SelectContent>
                </Select>
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
                  data-testid="save-appointment-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Erstellen...
                    </>
                  ) : (
                    'Termin erstellen'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="p-12 bg-white border border-slate-100 shadow-soft text-center" data-testid="no-appointments">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-heading font-semibold text-slate-900 mb-2">
            Keine Termine
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Erstellen Sie Ihren ersten Termin oder nutzen Sie den Sprachassistenten.
          </p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ersten Termin erstellen
          </Button>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="appointments-list">
          {appointments.map((appointment) => (
            <Card 
              key={appointment.id}
              className="p-5 bg-white border border-slate-100 shadow-soft hover-lift"
              data-testid={`appointment-item-${appointment.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{appointment.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(appointment.start_time)}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                        {getProviderLabel(appointment.calendar_provider)}
                      </span>
                    </div>
                    {appointment.description && (
                      <p className="mt-2 text-sm text-slate-600">{appointment.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(appointment.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                  data-testid={`delete-appointment-${appointment.id}`}
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

export default Appointments;
