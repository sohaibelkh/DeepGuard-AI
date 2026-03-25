import React, { useState } from 'react';
import {
  Activity,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Shield,
  User,
  X,
  LineChart,
  Cpu
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'ECG Diagnosis', to: '/dashboard/detect', icon: Activity },
  { label: 'Live ECG', to: '/dashboard/ecg-stream', icon: Radio },
  { label: 'History', to: '/dashboard/history', icon: History },
  { label: 'Model performance', to: '/dashboard/model-performance', icon: LineChart },
  { label: 'Model architecture', to: '/dashboard/model-architecture', icon: Cpu },
  { label: 'Profile', to: '/dashboard/profile', icon: User }
];

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          [
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
            isActive
              ? 'bg-slate-800 text-slate-50'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
          ].join(' ')
        }
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-800 bg-slate-950/95 px-4 py-4 shadow-subtle transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
              <Shield className="h-4 w-4 text-sky-400" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold tracking-tight">ECG Cardiac AI</p>
              <p className="text-[10px] text-slate-500">Cardiac Diagnosis Console</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 text-xs">
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Navigation
          </p>
          {navItems.map(renderNavLink)}
        </nav>

        <div className="mt-4 border-t border-slate-800 pt-3 text-xs">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium text-slate-200">ECG Diagnosis Overview</p>
              <p className="text-[11px] text-slate-500">
                Monitor ECG analyses and model performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-2 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-200">
                {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden text-[11px] leading-tight text-slate-300 sm:block">
                <p className="font-medium">{user?.full_name ?? 'User'}</p>
                <p className="text-[10px] text-slate-500">{user?.email ?? ''}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-950 px-4 py-4 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

