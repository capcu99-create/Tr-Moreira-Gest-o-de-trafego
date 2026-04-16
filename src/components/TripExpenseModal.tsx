import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calculator, 
  Truck, 
  Fuel, 
  Receipt,
  ArrowDownCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { Trip, TripExpense } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';

interface TripExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdateTrip: () => void;
}

// Modal de gastos da viagem
export function TripExpenseModal({ isOpen, onClose, trip, onUpdateTrip }: TripExpenseModalProps) {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [kmInitial, setKmInitial] = useState(trip.km_initial || 0);
  const [kmFinal, setKmFinal] = useState(trip.km_final || 0);
  const [expenseType, setExpenseType] = useState<'fuel' | 'diverse' | 'advance'>('fuel');
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
      setKmInitial(trip.km_initial || 0);
      setKmFinal(trip.km_final || 0);
    }
  }, [isOpen, trip.id, trip.km_initial, trip.km_final]);

  const loadExpenses = async () => {
    try {
      const data = await dbService.getTripExpenses(trip.id);
      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'fuel' | 'diverse' | 'advance';
    
    const newExpense = {
      trip_id: trip.id,
      type,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      value: Number(formData.get('value')),
      liters: type === 'fuel' ? Number(formData.get('liters')) : undefined
    };

    try {
      await dbService.addTripExpense(newExpense);
      showToast('Gasto adicionado!', 'success');
      loadExpenses();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      showToast(error.message || 'Erro ao adicionar gasto', 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await dbService.deleteTripExpense(id);
      showToast('Gasto excluído!', 'success');
      loadExpenses();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir gasto', 'error');
    }
  };

  const handleUpdateKM = async () => {
    try {
      await dbService.updateTrip(trip.id, { 
        km_initial: kmInitial, 
        km_final: kmFinal 
      });
      showToast('KMs atualizados!', 'success');
      onUpdateTrip();
    } catch (error: any) {
      showToast(error.message || 'Erro ao atualizar KM', 'error');
    }
  };

  const totalFuel = expenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + e.value, 0);
  const totalLiters = expenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + (e.liters || 0), 0);
  const totalDiverse = expenses.filter(e => e.type === 'diverse').reduce((sum, e) => sum + e.value, 0);
  const totalAdvances = expenses.filter(e => e.type === 'advance').reduce((sum, e) => sum + e.value, 0) + trip.advance_value;
  const totalExpenses = totalFuel + totalDiverse + totalAdvances;
  const profit = trip.freight_value - totalExpenses;
  const kmTraveled = kmFinal > kmInitial ? kmFinal - kmInitial : 0;
  const fuelMedia = kmTraveled > 0 && totalLiters > 0 ? (kmTraveled / totalLiters).toFixed(2) : '0.00';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gastos da Viagem - ${trip.drivers?.name}`} maxWidth="max-w-5xl">
      <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Trip Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-4 bg-brand-primary/5 border-brand-primary/20">
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Valor do Frete</p>
            <p className="text-lg font-bold text-brand-text">{formatCurrency(trip.freight_value)}</p>
          </div>
          <div className="panel p-4 bg-red-50 border-red-100">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Total Despesas</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="panel p-4 bg-emerald-50 border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Lucro Estimado</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(profit)}</p>
          </div>
          <div className="panel p-4 bg-orange-50 border-orange-100">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Média Consumo</p>
            <p className="text-lg font-bold text-orange-700">{fuelMedia} km/l</p>
          </div>
        </div>

        {/* KM Management */}
        <div className="panel p-6">
          <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={16} /> Contagem de KM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">KM Inicial</label>
              <input 
                type="number" 
                value={kmInitial} 
                onChange={(e) => setKmInitial(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-brand-border rounded-lg text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">KM Final</label>
              <input 
                type="number" 
                value={kmFinal} 
                onChange={(e) => setKmFinal(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-brand-border rounded-lg text-sm font-bold"
              />
            </div>
            <button 
              onClick={handleUpdateKM}
              className="bg-brand-dark text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-black transition-all"
            >
              Atualizar KMs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAddExpense} className="panel p-6 space-y-4 sticky top-0">
              <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Novo Lançamento</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Tipo</label>
                <select 
                  name="type" 
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as any)}
                  required 
                  className="w-full px-4 py-2 border border-brand-border rounded-lg text-sm font-bold"
                >
                  <option value="fuel">Abastecimento</option>
                  <option value="diverse">Despesa Diversa</option>
                  <option value="advance">Vale / Adiantamento</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Data</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-brand-border rounded-lg text-sm font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Descrição</label>
                <input name="description" required placeholder="Ex: Posto Pantanal ou Lavagem" className="w-full px-4 py-2 border border-brand-border rounded-lg text-sm font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={cn(expenseType !== 'fuel' && "col-span-2")}>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Valor (R$)</label>
                  <input type="number" step="0.01" name="value" required className="w-full px-4 py-2 border border-brand-border rounded-lg text-sm font-bold" />
                </div>
                {expenseType === 'fuel' && (
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Litros (Abast.)</label>
                    <input type="number" step="0.01" name="liters" className="w-full px-4 py-2 border border-brand-border rounded-lg text-sm font-bold" placeholder="0.00" />
                  </div>
                )}
              </div>

              <button className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md">
                Lançar Gasto
              </button>
            </form>
          </div>

          {/* Expense Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fuel List */}
            <div className="panel overflow-hidden">
              <div className="panel-header py-3 flex justify-between items-center bg-orange-50/50 border-b border-orange-100">
                <span className="flex items-center gap-2 text-orange-700">
                  <Fuel size={16} /> Abastecimentos
                </span>
                <span className="text-xs font-bold text-orange-600">{formatCurrency(totalFuel)}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white border-b border-brand-border shadow-sm">
                    <tr>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest">Posto / Descrição</th>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest">Litros</th>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest text-right">Valor</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => e.type === 'fuel').map(e => (
                      <tr key={e.id} className="border-b border-brand-border hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-brand-text">{e.description}</p>
                          <p className="text-[10px] text-brand-text-muted font-medium">{formatDate(e.date)}</p>
                        </td>
                        <td className="px-4 py-3 font-medium">{e.liters?.toFixed(2)} L</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(e.value)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteExpense(e.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diverse Expenses List */}
            <div className="panel overflow-hidden">
              <div className="panel-header py-3 flex justify-between items-center bg-blue-50/50 border-b border-blue-100">
                <span className="flex items-center gap-2 text-blue-700">
                  <Receipt size={16} /> Despesas Diversas
                </span>
                <span className="text-xs font-bold text-blue-600">{formatCurrency(totalDiverse)}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white border-b border-brand-border shadow-sm">
                    <tr>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest">Gasto</th>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest">Data</th>
                      <th className="px-4 py-2 font-bold text-brand-text-muted uppercase tracking-widest text-right">Valor</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => e.type === 'diverse').map(e => (
                      <tr key={e.id} className="border-b border-brand-border hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-brand-text">{e.description}</td>
                        <td className="px-4 py-3 font-medium text-brand-text-muted">{formatDate(e.date)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(e.value)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteExpense(e.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advances List */}
            <div className="panel overflow-hidden">
              <div className="panel-header py-3 flex justify-between items-center bg-emerald-50/50 border-b border-emerald-100">
                <span className="flex items-center gap-2 text-emerald-700">
                  <ArrowDownCircle size={16} /> Vales e Adiantamentos
                </span>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(totalAdvances)}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4 bg-emerald-50/30 border-b border-emerald-50 text-[10px] font-bold text-emerald-600 flex justify-between items-center">
                  <span>Adiantamento Original do Frete</span>
                  <span>{formatCurrency(trip.advance_value)}</span>
                </div>
                <table className="w-full text-left text-xs">
                  <tbody>
                    {expenses.filter(e => e.type === 'advance').map(e => (
                      <tr key={e.id} className="border-b border-brand-border hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-brand-text">{e.description}</td>
                        <td className="px-4 py-3 font-medium text-brand-text-muted">{formatDate(e.date)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(e.value)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteExpense(e.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
