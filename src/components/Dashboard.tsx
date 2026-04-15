import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertCircle, 
  Truck as TruckIcon,
  Users,
  Calendar,
  DollarSign,
  Puzzle
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { useTrips, useDrivers, useDebts } from '../lib/hooks';
import { isSupabaseConfigured } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (id: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
  const { debts, loading: debtsLoading } = useDebts();

  const stats = [
    { 
      label: 'Receita Bruta', 
      value: formatCurrency(trips.reduce((acc, t) => acc + (t.freight_value || 0), 0)), 
      icon: DollarSign, 
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10'
    },
    { 
      label: 'Motoristas Ativos', 
      value: drivers.filter(d => d.status === 'active').length.toString(), 
      icon: Users, 
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10'
    },
    { 
      label: 'Fretes Pendentes', 
      value: trips.filter(t => t.status === 'pending').length.toString(), 
      icon: TruckIcon, 
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10'
    },
    { 
      label: 'Dívidas Pendentes', 
      value: formatCurrency(debts.filter(d => d.status === 'pending').reduce((acc, d) => acc + (d.total_value || 0), 0)), 
      icon: AlertCircle, 
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10'
    },
  ];

  const quickMenu = [
    { id: 'fretes_ida', label: 'Lançar Ida', icon: ArrowUpRight, color: 'bg-brand-primary' },
    { id: 'fretes_volta', label: 'Lançar Volta', icon: ArrowDownLeft, color: 'bg-brand-primary' },
    { id: 'puzzle', label: 'Gestão de Tráfego', icon: Puzzle, color: 'bg-brand-primary' },
    { id: 'financeiro', label: 'Financeiro', icon: TrendingUp, color: 'bg-brand-primary' },
  ];

  if (tripsLoading || driversLoading || debtsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!isSupabaseConfigured && (
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-4 text-orange-800">
          <AlertCircle className="shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Banco de Dados não configurado!</p>
            <p className="opacity-80">Vá na aba "Motoristas" ou "Frotas" para ver as instruções de configuração.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="panel p-6 group hover:border-brand-primary transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg, "dark:bg-opacity-10")}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-brand-text">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex items-center gap-4 p-4 bg-white border border-brand-border rounded-2xl hover:shadow-md hover:border-brand-primary transition-all group"
          >
            <div className={cn("p-3 rounded-xl text-white transition-transform group-hover:scale-110", item.color)}>
              <item.icon size={20} />
            </div>
            <span className="text-sm font-bold text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
