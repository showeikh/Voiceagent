import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  Mic, 
  LayoutDashboard, 
  Calendar, 
  CalendarDays, 
  History, 
  Settings, 
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/dashboard/calendars', icon: Calendar, label: 'Kalender-Verbindungen' },
    { to: '/dashboard/appointments', icon: CalendarDays, label: 'Termine' },
    { to: '/dashboard/history', icon: History, label: 'Gesprächsverlauf' },
    { to: '/dashboard/settings', icon: Settings, label: 'Einstellungen' },
  ];

  const NavItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${isActive 
          ? 'bg-violet-100 text-violet-700 font-medium' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-voice flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-slate-900">VoiceAgent</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2" data-testid="mobile-user-menu">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-violet-700">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} data-testid="mobile-logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-voice flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-slate-900">VoiceAgent</span>
              <p className="text-xs text-slate-500">Sprachgesteuerte Termine</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                data-testid="user-menu-trigger"
              >
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-violet-700">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {user?.username || 'Benutzer'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
