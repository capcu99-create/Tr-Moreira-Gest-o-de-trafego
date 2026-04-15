import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { dbService } from '../lib/dbService';

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarView() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dbService.getTrips();
        setTrips(data);
      } catch (error) {
        console.error('Erro no calendário:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Simple calendar generation for the current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const weeklyTrips = trips.filter(t => {
    const tripDate = new Date(t.loading_date);
    const diff = today.getTime() - tripDate.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 panel">
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-1 hover:bg-brand-bg rounded-md transition-colors text-brand-text">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold uppercase tracking-wider text-brand-text">{months[currentMonth]} {currentYear}</span>
            <button className="p-1 hover:bg-brand-bg rounded-md transition-colors text-brand-text">
              <ChevronRight size={18} />
            </button>
          </div>
          <button className="text-[11px] text-brand-primary font-bold uppercase tracking-wider">Hoje</button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {days.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-brand-text-muted uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-brand-border border border-brand-border rounded-lg overflow-hidden">
            {calendarDays.map((day, i) => (
              <div 
                key={i} 
                className={cn(
                  "aspect-square bg-brand-panel p-2 relative hover:bg-brand-bg transition-colors cursor-pointer",
                  day === today.getDate() && "bg-brand-primary/10"
                )}
              >
                {day && (
                  <>
                    <span className={cn(
                      "text-xs font-medium",
                      day === today.getDate() ? "text-brand-primary font-bold" : "text-brand-text"
                    )}>
                      {day}
                    </span>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {day % 7 === 0 && <div className="w-1 h-1 bg-brand-primary rounded-full"></div>}
                      {day % 10 === 0 && <div className="w-1 h-1 bg-brand-primary/50 rounded-full"></div>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel">
          <div className="panel-header flex items-center justify-between">
            <span>Notas / Lembretes</span>
            <button className="p-1 text-brand-primary hover:bg-blue-50 rounded-md transition-all">
              <Plus size={16} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1 h-10 bg-brand-primary rounded-full shrink-0"></div>
              <div>
                <p className="text-[13px] font-semibold text-brand-text">Vencimento Seguro</p>
                <p className="text-[11px] text-brand-text-muted">Renovar seguro da carreta MMK 7F41.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-10 bg-brand-primary/50 rounded-full shrink-0"></div>
              <div>
                <p className="text-[13px] font-semibold text-brand-text">Manutenção Preventiva</p>
                <p className="text-[11px] text-brand-text-muted">Troca de óleo Scania R440.</p>
              </div>
            </div>
            <button className="w-full py-2 border-2 border-dashed border-brand-border rounded-lg text-[11px] font-bold text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-all">
              + Nova Nota
            </button>
          </div>
        </div>

        <div className="bg-brand-dark p-6 rounded-xl text-white shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-80">Resumo da Semana</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="opacity-60">Viagens na Semana</span>
              <span className="font-bold">{weeklyTrips.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">Viagens Concluídas</span>
              <span className="font-bold">{weeklyTrips.filter(t => t.status === 'paid').length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">Receita Estimada</span>
              <span className="font-bold">{formatCurrency(weeklyTrips.reduce((acc, t) => acc + (t.freight_value || 0), 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { formatCurrency } from '../lib/utils';
