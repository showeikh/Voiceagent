import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Settings, 
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  ExternalLink
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSettings = () => {
  const { getAuthHeaders } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    twilio_sid: '',
    twilio_token: '',
    twilio_phone: '',
    sipgate_token: '',
    lexoffice_key: ''
  });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/telephony-config`, {
        headers: getAuthHeaders()
      });
      setConfig(res.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (formData.twilio_sid) params.append('twilio_sid', formData.twilio_sid);
      if (formData.twilio_token) params.append('twilio_token', formData.twilio_token);
      if (formData.twilio_phone) params.append('twilio_phone', formData.twilio_phone);
      if (formData.sipgate_token) params.append('sipgate_token', formData.sipgate_token);
      if (formData.lexoffice_key) params.append('lexoffice_key', formData.lexoffice_key);

      await axios.post(`${API_URL}/admin/telephony-config?${params.toString()}`, {}, {
        headers: getAuthHeaders()
      });
      
      toast.success('Einstellungen gespeichert');
      setFormData({ twilio_sid: '', twilio_token: '', twilio_phone: '', sipgate_token: '', lexoffice_key: '' });
      fetchConfig();
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
          Einstellungen
        </h1>
        <p className="text-slate-400 mt-1">
          Konfigurieren Sie API-Verbindungen und Systemeinstellungen
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white">Twilio</span>
            </div>
            {config?.twilio?.configured ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verbunden
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Nicht konfiguriert
              </Badge>
            )}
          </div>
        </Card>
        
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-400" />
              <span className="font-medium text-white">Sipgate</span>
            </div>
            {config?.sipgate?.configured ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verbunden
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Nicht konfiguriert
              </Badge>
            )}
          </div>
        </Card>
        
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="font-medium text-white">Lexoffice</span>
            </div>
            {config?.lexoffice?.configured ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verbunden
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Nicht konfiguriert
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Twilio Settings */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-white">Twilio</h2>
            <p className="text-sm text-slate-500">VoIP und Telefonie weltweit</p>
          </div>
          <a 
            href="https://www.twilio.com/console" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-auto text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Twilio Console <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-400">Account SID</Label>
            <Input
              type="password"
              placeholder="ACxxxxxxxxx..."
              value={formData.twilio_sid}
              onChange={(e) => setFormData({ ...formData, twilio_sid: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Auth Token</Label>
            <Input
              type="password"
              placeholder="Token eingeben..."
              value={formData.twilio_token}
              onChange={(e) => setFormData({ ...formData, twilio_token: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Telefonnummer</Label>
            <Input
              type="text"
              placeholder="+49..."
              value={formData.twilio_phone}
              onChange={(e) => setFormData({ ...formData, twilio_phone: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
      </Card>

      {/* Sipgate Settings */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-white">Sipgate</h2>
            <p className="text-sm text-slate-500">Deutscher VoIP-Anbieter</p>
          </div>
          <a 
            href="https://console.sipgate.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-auto text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Sipgate Console <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400">API Token</Label>
          <Input
            type="password"
            placeholder="Sipgate API Token..."
            value={formData.sipgate_token}
            onChange={(e) => setFormData({ ...formData, sipgate_token: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white max-w-md"
          />
        </div>
      </Card>

      {/* Lexoffice Settings */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-white">Lexoffice</h2>
            <p className="text-sm text-slate-500">Automatische Rechnungserstellung</p>
          </div>
          <a 
            href="https://developers.lexware.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-auto text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            Developer Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="p-4 bg-slate-800 rounded-xl mb-4">
          <h4 className="font-medium text-white mb-2">So erhalten Sie den API-Key:</h4>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
            <li>Melden Sie sich bei <a href="https://developers.lexware.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">developers.lexware.io</a> an</li>
            <li>Erstellen Sie eine neue App im Developer Portal</li>
            <li>Generieren Sie unter "API Keys" einen neuen Key</li>
            <li>Kopieren Sie den Key und fügen Sie ihn hier ein</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400">API Key</Label>
          <Input
            type="password"
            placeholder="Lexoffice API Key..."
            value={formData.lexoffice_key}
            onChange={(e) => setFormData({ ...formData, lexoffice_key: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white max-w-md"
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700"
          data-testid="save-settings-btn"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
