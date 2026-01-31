import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  CreditCard, 
  Package, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  Euro
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPricing = () => {
  const { getAuthHeaders } = useAuth();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [minutePackages, setMinutePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price_per_minute: 0.15,
    monthly_fee: 0,
    included_minutes: 0,
    description: '',
    is_active: true
  });
  const [packageForm, setPackageForm] = useState({
    name: '',
    minutes: 100,
    price: 12,
    is_active: true
  });

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, packagesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pricing-plans`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/admin/minute-packages`, { headers: getAuthHeaders() })
      ]);
      setPricingPlans(plansRes.data);
      setMinutePackages(packagesRes.data);
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      toast.error('Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await axios.put(`${API_URL}/admin/pricing-plans/${editingPlan.id}`, planForm, {
          headers: getAuthHeaders()
        });
        toast.success('Tarif aktualisiert');
      } else {
        await axios.post(`${API_URL}/admin/pricing-plans`, planForm, {
          headers: getAuthHeaders()
        });
        toast.success('Tarif erstellt');
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: '', price_per_minute: 0.15, monthly_fee: 0, included_minutes: 0, description: '', is_active: true });
      fetchData();
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await axios.put(`${API_URL}/admin/minute-packages/${editingPackage.id}`, packageForm, {
          headers: getAuthHeaders()
        });
        toast.success('Paket aktualisiert');
      } else {
        await axios.post(`${API_URL}/admin/minute-packages`, packageForm, {
          headers: getAuthHeaders()
        });
        toast.success('Paket erstellt');
      }
      setPackageDialogOpen(false);
      setEditingPackage(null);
      setPackageForm({ name: '', minutes: 100, price: 12, is_active: true });
      fetchData();
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
    }
  };

  const editPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price_per_minute: plan.price_per_minute,
      monthly_fee: plan.monthly_fee,
      included_minutes: plan.included_minutes,
      description: plan.description || '',
      is_active: plan.is_active
    });
    setPlanDialogOpen(true);
  };

  const editPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      minutes: pkg.minutes,
      price: pkg.price,
      is_active: pkg.is_active
    });
    setPackageDialogOpen(true);
  };

  const deletePlan = async (planId) => {
    if (!window.confirm('Tarif wirklich löschen?')) return;
    try {
      await axios.delete(`${API_URL}/admin/pricing-plans/${planId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Tarif gelöscht');
      fetchData();
    } catch (error) {
      toast.error('Löschen fehlgeschlagen');
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
    <div className="space-y-8" data-testid="admin-pricing-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
          Preise & Pakete
        </h1>
        <p className="text-slate-400 mt-1">
          Verwalten Sie Tarife und Minutenpakete
        </p>
      </div>

      {/* Pricing Plans */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-white">Tarife</h2>
              <p className="text-sm text-slate-500">Monatliche Abonnements</p>
            </div>
          </div>
          
          <Dialog open={planDialogOpen} onOpenChange={(open) => {
            setPlanDialogOpen(open);
            if (!open) {
              setEditingPlan(null);
              setPlanForm({ name: '', price_per_minute: 0.15, monthly_fee: 0, included_minutes: 0, description: '', is_active: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700" data-testid="add-plan-btn">
                <Plus className="w-5 h-5 mr-2" />
                Neuer Tarif
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Tarif bearbeiten' : 'Neuer Tarif'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="z.B. Professional"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preis pro Minute (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={planForm.price_per_minute}
                      onChange={(e) => setPlanForm({ ...planForm, price_per_minute: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monatliche Gebühr (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={planForm.monthly_fee}
                      onChange={(e) => setPlanForm({ ...planForm, monthly_fee: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Inklusiv-Minuten</Label>
                  <Input
                    type="number"
                    value={planForm.included_minutes}
                    onChange={(e) => setPlanForm({ ...planForm, included_minutes: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Input
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="Kurze Beschreibung"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.is_active}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                  />
                  <Label>Aktiv</Label>
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                  {editingPlan ? 'Speichern' : 'Erstellen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`p-4 rounded-xl border ${plan.is_active ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{plan.name}</h3>
                    {!plan.is_active && <span className="text-xs text-slate-500">(Inaktiv)</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-emerald-400">{plan.price_per_minute.toFixed(2)}€/Min</span>
                    {plan.monthly_fee > 0 && <span className="text-slate-400">{plan.monthly_fee.toFixed(2)}€/Monat</span>}
                    {plan.included_minutes > 0 && <span className="text-blue-400">{plan.included_minutes} Min inkl.</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => editPlan(plan)} className="text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Minute Packages */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-white">Minutenpakete</h2>
              <p className="text-sm text-slate-500">Einmalige Käufe</p>
            </div>
          </div>
          
          <Dialog open={packageDialogOpen} onOpenChange={(open) => {
            setPackageDialogOpen(open);
            if (!open) {
              setEditingPackage(null);
              setPackageForm({ name: '', minutes: 100, price: 12, is_active: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-package-btn">
                <Plus className="w-5 h-5 mr-2" />
                Neues Paket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>{editingPackage ? 'Paket bearbeiten' : 'Neues Paket'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePackage} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="z.B. 500 Minuten"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minuten</Label>
                    <Input
                      type="number"
                      value={packageForm.minutes}
                      onChange={(e) => setPackageForm({ ...packageForm, minutes: parseInt(e.target.value) })}
                      className="bg-slate-800 border-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preis (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={packageForm.is_active}
                    onCheckedChange={(checked) => setPackageForm({ ...packageForm, is_active: checked })}
                  />
                  <Label>Aktiv</Label>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {editingPackage ? 'Speichern' : 'Erstellen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {minutePackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`p-4 rounded-xl border text-center ${pkg.is_active ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}
            >
              <h3 className="font-medium text-white text-lg">{pkg.name}</h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{pkg.price.toFixed(2)}€</p>
              <p className="text-slate-400 text-sm mt-1">{pkg.minutes} Minuten</p>
              <p className="text-slate-500 text-xs mt-1">
                ({(pkg.price / pkg.minutes).toFixed(3)}€/Min)
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => editPackage(pkg)} className="text-slate-400 hover:text-white">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminPricing;
