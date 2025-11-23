import { Link, useLocation } from 'react-router-dom';
import { Settings, BarChart3, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Statistics', href: '/statistics', icon: BarChart3 },
  { name: 'Recent Images', href: '/recent-images', icon: Image },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-40 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-sm font-semibold">Plant Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

