import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Phone, 
  FileText,
  Euro,
  TrendingUp,
  Loader2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Statistiken konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="admin-dashboard-loading">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Gesamt Mandanten', value: stats?.total_tenants || 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { icon: Clock, label: 'Ausstehend', value: stats?.pending_tenants || 0, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { icon: UserCheck, label: 'Freigeschaltet', value: stats?.approved_tenants || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { icon: Users, label: 'Benutzer', value: stats?.total_users || 0, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { icon: Phone, label: 'Gespräche', value: stats?.total_calls || 0, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { icon: TrendingUp, label: 'Minuten genutzt', value: stats?.total_minutes?.toFixed(0) || 0, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    { icon: FileText, label: 'Rechnungen', value: stats?.total_invoices || 0, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { icon: Euro, label: 'Umsatz (€)', value: stats?.total_revenue?.toFixed(2) || '0.00', color: 'text-green-400', bg: 'bg-green-500/20' },
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Übersicht über die gesamte Plattform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index}
            className="p-5 bg-slate-900 border border-slate-800"
            data-testid={`admin-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-slate-900 border border-slate-800">
        <h2 className="font-heading text-lg font-semibold text-white mb-4">
          Schnellzugriff
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a href="/admin/tenants?status=pending" className="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <Clock className="w-6 h-6 text-amber-400 mb-2" />
            <p className="font-medium text-white">Ausstehende Freischaltungen</p>
            <p className="text-sm text-slate-400">{stats?.pending_tenants || 0} Mandanten warten</p>
          </a>
          <a href="/admin/invoices" className="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <FileText className="w-6 h-6 text-blue-400 mb-2" />
            <p className="font-medium text-white">Rechnungen verwalten</p>
            <p className="text-sm text-slate-400">Rechnungen erstellen & versenden</p>
          </a>
          <a href="/admin/pricing" className="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <Euro className="w-6 h-6 text-green-400 mb-2" />
            <p className="font-medium text-white">Preise anpassen</p>
            <p className="text-sm text-slate-400">Tarife & Minutenpakete</p>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
