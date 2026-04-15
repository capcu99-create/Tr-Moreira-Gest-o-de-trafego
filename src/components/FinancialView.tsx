import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Fuel, Wrench } from 'lucide-react';
import { dbService } from '../lib/dbService';

export function FinancialView() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dbService.getTrips();
        setTrips(data);
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = trips.reduce((acc, trip) => acc + (trip.freight_value || 0), 0);
  const totalAdvance = trips.reduce((acc, trip) => acc + (trip.advance_value || 0), 0);
  const netProfit = totalRevenue - totalAdvance;

  const chartData = [
    { name: 'Total', receita: totalRevenue, adiantamento: totalAdvance },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-brand-primary animate-pulse font-bold">Calculando finanças...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-primary p-6 rounded-xl text-white shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Receita Bruta Total</span>
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(totalRevenue)}</h3>
          <p className="mt-4 text-[10px] text-white/80 font-bold uppercase tracking-wider">Soma de todos os fretes</p>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Adiantamentos</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-text">{formatCurrency(totalAdvance)}</h3>
          <p className="mt-4 text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">Valores já pagos aos motoristas</p>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Saldo a Receber</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-primary">{formatCurrency(netProfit)}</h3>
          <div className="mt-4 w-full bg-brand-bg h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full" 
              style={{ width: `${totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
            Margem: {totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Comparativo de Fretes</div>
        <div className="p-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted-color)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted-color)', fontSize: 11 }} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-color)' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--panel-color)',
                  color: 'var(--text-color)'
                }}
              />
              <Bar dataKey="receita" fill="var(--color-brand-primary)" radius={[2, 2, 0, 0]} barSize={60} name="Receita Bruta" />
              <Bar dataKey="adiantamento" fill="var(--text-muted-color)" radius={[2, 2, 0, 0]} barSize={60} name="Adiantamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
