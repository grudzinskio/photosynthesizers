import { Link, useLocation } from 'react-router-dom';
import { Settings, BarChart3, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

// Logo import
import logoImage from '@/assets/milwaukee-domes-logo.png';

const navigation = [
  { name: 'Plants', href: '/plants', icon: BarChart3 },
  { name: 'Recent Images', href: '/recent-images', icon: Image },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex flex-col items-center justify-center border-b p-4">
        <img 
          src={logoImage} 
          alt="Milwaukee Domes Logo" 
          className="h-24 w-auto object-contain"
        />
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

