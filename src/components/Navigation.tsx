import React from 'react';
import { 
  Truck, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  LayoutDashboard,
  Settings,
  LogOut,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Puzzle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard, color: 'bg-brand-primary' },
  { id: 'puzzle', label: 'Gestão de Tráfego', icon: Puzzle, color: 'bg-brand-primary' },
  { id: 'drivers', label: 'Motoristas', icon: Users, color: 'bg-brand-primary' },
  { id: 'trucks', label: 'Frotas', icon: Truck, color: 'bg-brand-primary' },
  { id: 'fretes_ida', label: 'Fretes Ida', icon: ArrowUpRight, color: 'bg-brand-primary' },
  { id: 'fretes_volta', label: 'Fretes Volta', icon: ArrowDownLeft, color: 'bg-brand-primary' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, color: 'bg-brand-primary' },
  { id: 'cronograma', label: 'Cronograma', icon: Calendar, color: 'bg-brand-primary' },
  { id: 'dre', label: 'DRE / Lucros', icon: TrendingUp, color: 'bg-brand-primary' },
  { id: 'dividas', label: 'Dívidas', icon: CreditCard, color: 'bg-brand-primary' },
];

interface NavigationProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-dark md:relative md:w-[240px] md:h-screen p-6 z-50 flex md:flex-col border-t border-white/10 md:border-t-0 md:border-r">
      <div className="hidden md:flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-white rounded-lg p-1">
          <img 
            src="https://i.imgur.com/nkXSx8R.jpeg" 
            alt="Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-bold text-lg tracking-wider text-white uppercase">TR Moreira</h1>
      </div>

      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col md:flex-row items-center gap-3 px-4 py-3 rounded-md transition-all min-w-[80px] md:min-w-0 text-sm font-medium",
                isActive 
                  ? "bg-brand-primary text-white" 
                  : "text-brand-text-nav hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} />
              <span className="text-[10px] md:text-sm whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden md:block mt-auto pt-6 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors w-full text-sm font-medium">
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </nav>
  );
}
