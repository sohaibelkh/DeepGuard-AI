import React, { useState } from 'react';
import {
  Activity,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Heart,
  User,
  X,
  LineChart,
  Cpu,
  MessageSquare
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';

// Use an existing high-quality medical image for the sidebar background
import sidebarBg from '../../assets/images/slider1.png';

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
  { label: 'AI Assistant', to: '/dashboard/chat', icon: MessageSquare },
  { label: 'Model performance', to: '/dashboard/model-performance', icon: LineChart },
  { label: 'Model architecture', to: '/dashboard/model-architecture', icon: Cpu },
  { label: 'Profile', to: '/dashboard/profile', icon: User }
];

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
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
            'relative z-10 flex items-center gap-2.5 rounded-lg px-4 py-3 text-xs font-medium transition-all duration-300 mx-2',
            isActive
              ? 'bg-[#a5c422] text-white shadow-lg shadow-[#a5c422]/40'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          ].join(' ')
        }
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9] text-[#393939]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Sidebar with background image & overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Background Layer */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${sidebarBg})` }}
        />
        {/* Dark Glassmorphic Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-900/85 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col h-full px-2 py-6">
          <div className="flex items-center justify-between px-4 pb-8 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                <Heart className="h-5 w-5 text-[#a5c422]" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight text-white">CardioAI</p>
                <p className="text-[10px] text-slate-400 font-medium">Diagnostic Console</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Navigation
            </p>
            {navItems.map(renderNavLink)}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10 px-2">
            <button
              type="button"
              onClick={handleLogout}
              className="relative z-10 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[#e5e5e5] bg-white px-4 py-3 lg:px-6 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-md p-2 text-slate-500 hover:bg-[#f5f5f5] hover:text-[#393939] lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#393939] uppercase tracking-wide">ECG Diagnosis Overview</p>
              <p className="text-[11px] text-[#999]">
                System Status: <span className="text-[#a5c422] font-semibold">Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-full border border-[#e5e5e5] bg-[#f9f9f9] pl-3 pr-1 py-1 shadow-sm">
              <div className="hidden text-right leading-tight sm:block mr-1">
                <p className="text-[11px] font-bold text-[#333]">{user?.full_name ?? 'User'}</p>
                <p className="text-[10px] text-[#999]">{user?.email ?? ''}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a5c422] text-[11px] font-bold text-white shadow-md">
                {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#f9f9f9] overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
