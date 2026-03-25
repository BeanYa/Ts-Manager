import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Package, Server, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/orders', label: '订单管理', icon: Package },
  { path: '/containers', label: '容器管理', icon: Server },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-300 ${
        collapsed ? 'w-0 -translate-x-full md:w-16 md:translate-x-0' : 'w-64'
      }`}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-[hsl(var(--border))]">
        {!collapsed && <span className="font-bold text-lg">TS Manager</span>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="hidden md:flex">
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </Button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'hover:bg-[hsl(var(--accent))]'
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur px-4">
      <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden">
        <Menu size={18} />
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
        <LogOut size={16} />
        退出
      </Button>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <Header onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
