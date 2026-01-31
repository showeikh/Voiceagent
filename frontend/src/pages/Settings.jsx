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
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  Users, 
  Building2,
  Plus,
  Trash2,
  Loader2,
  User,
  Crown
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const { getAuthHeaders, user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [savingTenant, setSavingTenant] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/tenant`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/users`, { headers: getAuthHeaders() })
      ]);
      setTenant(tenantRes.data);
      setTenantName(tenantRes.data.name);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
      toast.error('Einstellungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveTenant = async () => {
    if (!tenantName.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }

    setSavingTenant(true);
    try {
      await axios.put(`${API_URL}/tenant?name=${encodeURIComponent(tenantName)}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Mandant aktualisiert');
      fetchData();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      toast.error('Mandant konnte nicht aktualisiert werden');
    } finally {
      setSavingTenant(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/users`, formData, {
        headers: getAuthHeaders()
      });

      toast.success('Benutzer erfolgreich erstellt!');
      setDialogOpen(false);
      setFormData({ username: '', email: '', password: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create user:', error);
      const message = error.response?.data?.detail || 'Benutzer konnte nicht erstellt werden';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Benutzer wirklich löschen?')) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Benutzer gelöscht');
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      const message = error.response?.data?.detail || 'Benutzer konnte nicht gelöscht werden';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="settings-loading">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Einstellungen
        </h1>
        <p className="text-slate-600 mt-1">
          Verwalten Sie Ihren Mandanten und Benutzer
        </p>
      </div>

      {/* Tenant Settings */}
      <Card className="p-6 bg-white border border-slate-100 shadow-soft" data-testid="tenant-settings">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Mandant</h2>
            <p className="text-sm text-slate-500">Ihre Organisationsdaten</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mandantenname</Label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="h-12 flex-1"
                data-testid="tenant-name-input"
              />
              <Button
                onClick={handleSaveTenant}
                disabled={savingTenant}
                className="h-12 bg-violet-600 hover:bg-violet-700 text-white px-6"
                data-testid="save-tenant-btn"
              >
                {savingTenant ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Speichern'
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">E-Mail</p>
              <p className="font-medium text-slate-900">{tenant?.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Erstellt am</p>
              <p className="font-medium text-slate-900">
                {tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('de-DE') : '-'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* User Management */}
      <Card className="p-6 bg-white border border-slate-100 shadow-soft" data-testid="user-management">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-slate-900">Benutzer</h2>
              <p className="text-sm text-slate-500">Maximal 2 Benutzer pro Mandant</p>
            </div>
          </div>

          {users.length < 2 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5"
                  data-testid="add-user-btn"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Benutzer hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">Neuen Benutzer hinzufügen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label>Benutzername</Label>
                    <Input
                      type="text"
                      placeholder="Max Mustermann"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="h-12"
                      data-testid="user-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input
                      type="email"
                      placeholder="benutzer@beispiel.de"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                      data-testid="user-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12"
                      data-testid="user-password-input"
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
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      data-testid="save-user-btn"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Erstellen...
                        </>
                      ) : (
                        'Benutzer erstellen'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Users List */}
        <div className="space-y-3" data-testid="users-list">
          {users.map((u) => (
            <div 
              key={u.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              data-testid={`user-item-${u.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  {u.is_admin ? (
                    <Crown className="w-5 h-5 text-amber-500" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{u.username}</p>
                    {u.is_admin && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                    {u.id === user?.id && (
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                        Sie
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
              </div>
              
              {u.id !== user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  data-testid={`delete-user-${u.id}`}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {users.length >= 2 && (
          <p className="mt-4 text-sm text-slate-500 text-center">
            Maximale Benutzeranzahl erreicht (2/2)
          </p>
        )}
      </Card>
    </div>
  );
};

export default Settings;
