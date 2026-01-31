import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
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
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Users, 
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminTenants = () => {
  const { getAuthHeaders } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await axios.get(`${API_URL}/admin/tenants${params}`, {
        headers: getAuthHeaders()
      });
      setTenants(res.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast.error('Mandanten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, statusFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleApprove = async (tenantId) => {
    try {
      await axios.post(`${API_URL}/admin/tenants/${tenantId}/approve`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Mandant freigeschaltet!');
      fetchTenants();
    } catch (error) {
      toast.error('Freischaltung fehlgeschlagen');
    }
  };

  const handleReject = async (tenantId) => {
    if (!window.confirm('Mandant wirklich ablehnen?')) return;
    try {
      await axios.post(`${API_URL}/admin/tenants/${tenantId}/reject`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Mandant abgelehnt');
      fetchTenants();
    } catch (error) {
      toast.error('Ablehnung fehlgeschlagen');
    }
  };

  const handleSuspend = async (tenantId) => {
    if (!window.confirm('Mandant wirklich sperren?')) return;
    try {
      await axios.post(`${API_URL}/admin/tenants/${tenantId}/suspend`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Mandant gesperrt');
      fetchTenants();
    } catch (error) {
      toast.error('Sperrung fehlgeschlagen');
    }
  };

  const viewDetails = (tenant) => {
    setSelectedTenant(tenant);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Ausstehend', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      approved: { label: 'Freigeschaltet', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      rejected: { label: 'Abgelehnt', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      suspended: { label: 'Gesperrt', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    };
    const c = config[status] || config.pending;
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const filteredTenants = tenants.filter(t => 
    t.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-tenants-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
            Mandanten
          </h1>
          <p className="text-slate-400 mt-1">
            Verwalten Sie alle registrierten Mandanten
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Suchen nach Firma oder E-Mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
            data-testid="tenant-search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white" data-testid="status-filter">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="approved">Freigeschaltet</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
            <SelectItem value="suspended">Gesperrt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenants List */}
      <div className="space-y-4" data-testid="tenants-list">
        {filteredTenants.length === 0 ? (
          <Card className="p-12 bg-slate-900 border-slate-800 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Keine Mandanten gefunden</p>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card 
              key={tenant.id}
              className="p-5 bg-slate-900 border-slate-800"
              data-testid={`tenant-item-${tenant.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-white">{tenant.company_name}</h3>
                      {getStatusBadge(tenant.status)}
                    </div>
                    <p className="text-sm text-slate-400">{tenant.contact_person}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {tenant.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {tenant.phone}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(tenant)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    data-testid={`view-tenant-${tenant.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  
                  {tenant.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(tenant.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        data-testid={`approve-tenant-${tenant.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Freischalten
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(tenant.id)}
                        data-testid={`reject-tenant-${tenant.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Ablehnen
                      </Button>
                    </>
                  )}
                  
                  {tenant.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(tenant.id)}
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                      data-testid={`suspend-tenant-${tenant.id}`}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Sperren
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-heading">Mandanten-Details</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Firmenname</p>
                  <p className="font-medium">{selectedTenant.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ansprechpartner</p>
                  <p className="font-medium">{selectedTenant.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">E-Mail</p>
                  <p className="font-medium">{selectedTenant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Telefon</p>
                  <p className="font-medium">{selectedTenant.phone}</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse
                </p>
                <p className="font-medium">
                  {selectedTenant.street} {selectedTenant.house_number}<br />
                  {selectedTenant.postal_code} {selectedTenant.city}<br />
                  {selectedTenant.country}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Steuernummer</p>
                  <p className="font-medium">{selectedTenant.tax_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">USt-IdNr.</p>
                  <p className="font-medium">{selectedTenant.vat_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Website</p>
                  <p className="font-medium">{selectedTenant.website || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Branche</p>
                  <p className="font-medium">{selectedTenant.industry || '-'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-500">
                  Registriert am: {new Date(selectedTenant.created_at).toLocaleDateString('de-DE')}
                </p>
                {selectedTenant.approved_at && (
                  <p className="text-sm text-slate-500">
                    Freigeschaltet am: {new Date(selectedTenant.approved_at).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTenants;
