import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Calendar } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  FileText, 
  Send,
  Plus,
  Loader2,
  CalendarIcon,
  Euro,
  Building2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminInvoices = () => {
  const { getAuthHeaders } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [periodEnd, setPeriodEnd] = useState(new Date());
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, tenantsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/invoices`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/admin/tenants?status=approved`, { headers: getAuthHeaders() })
      ]);
      setInvoices(invoicesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!selectedTenant) {
      toast.error('Bitte wählen Sie einen Mandanten');
      return;
    }
    
    setGenerating(true);
    try {
      await axios.post(
        `${API_URL}/admin/invoices/generate/${selectedTenant}?period_start=${periodStart.toISOString()}&period_end=${periodEnd.toISOString()}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Rechnung erstellt');
      setGenerateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Rechnungserstellung fehlgeschlagen');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToLexoffice = async (invoiceId) => {
    setSendingId(invoiceId);
    try {
      await axios.post(`${API_URL}/admin/invoices/${invoiceId}/send-lexoffice`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Rechnung an Lexoffice gesendet');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Senden fehlgeschlagen');
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Entwurf', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      created: { label: 'Erstellt', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      sent: { label: 'Versendet', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      paid: { label: 'Bezahlt', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      cancelled: { label: 'Storniert', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    const c = config[status] || config.draft;
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.company_name || tenantId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-invoices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
            Rechnungen
          </h1>
          <p className="text-slate-400 mt-1">
            Rechnungen erstellen und via Lexoffice versenden
          </p>
        </div>

        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700" data-testid="generate-invoice-btn">
              <Plus className="w-5 h-5 mr-2" />
              Rechnung erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Neue Rechnung erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mandant</label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Mandant wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Von</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-slate-800 border-slate-700">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(periodStart, 'PPP', { locale: de })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={periodStart}
                        onSelect={(date) => date && setPeriodStart(date)}
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bis</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-slate-800 border-slate-700">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(periodEnd, 'PPP', { locale: de })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={periodEnd}
                        onSelect={(date) => date && setPeriodEnd(date)}
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={generating}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  'Rechnung erstellen'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <p className="text-sm text-blue-400">
          <strong>Lexoffice Integration:</strong> Rechnungen werden automatisch in Lexoffice erstellt und per E-Mail an den Mandanten versendet. 
          Stellen Sie sicher, dass der Lexoffice API-Key in den Einstellungen konfiguriert ist.
        </p>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4" data-testid="invoices-list">
        {invoices.length === 0 ? (
          <Card className="p-12 bg-slate-900 border-slate-800 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Keine Rechnungen vorhanden</p>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card 
              key={invoice.id}
              className="p-5 bg-slate-900 border-slate-800"
              data-testid={`invoice-item-${invoice.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-white">{invoice.invoice_number}</h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {getTenantName(invoice.tenant_id)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>{invoice.total_minutes?.toFixed(2)} Min</span>
                      <span>•</span>
                      <span>{format(new Date(invoice.period_start), 'dd.MM.yyyy', { locale: de })} - {format(new Date(invoice.period_end), 'dd.MM.yyyy', { locale: de })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">{invoice.gross_amount?.toFixed(2)}€</p>
                    <p className="text-xs text-slate-500">inkl. {(invoice.tax_amount || 0).toFixed(2)}€ MwSt.</p>
                  </div>
                  
                  {invoice.status === 'created' && (
                    <Button
                      onClick={() => handleSendToLexoffice(invoice.id)}
                      disabled={sendingId === invoice.id}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      data-testid={`send-invoice-${invoice.id}`}
                    >
                      {sendingId === invoice.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          An Lexoffice senden
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminInvoices;
